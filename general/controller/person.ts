import { v4 as uuid } from "uuid";

import { compareTwoDateString, lunarDateToNormalDate, normalDateToLunarDate, shortenDateString, todayDate } from "../utils/DateUtils";
import { isStringPureInterger } from "../utils/ValidationUtils";
import { CommonResponse, paginateAndSortItems, type PaginateParams, type ControllerHandlerResult as CHR } from "./utils";
import { LifeStatus, Gender, type Person } from "../model/Person";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export type ExtendedPerson = Person & {
    children: {
        child: ExtendedPerson;
        spouseId: string | null;
    }[];
};

export type CreatePersonParams = {
    person: Omit<Person, "id" | "ownerUserId" | "isStandForUser">;
    role?: {
        roleName: string;
        roleWithTargetPersonId: string;
    };
};

export function filterPeople(people: Person[], search: string, searchFieldsAsString?: string) {
    if (search.trim() == "") {
        return people;
    }

    search = search.trim().toLowerCase();
    while (search.includes("  ")) {
        search = search.replace("  ", " ");
    }
    search = search.split(" ").map(s => {
        // Số nguyên bắt đầu bằng số 0 thì bỏ số 0
        if (isStringPureInterger(s, 2) && s != "0") {
            while (s.startsWith("0")) s = s.slice(1);
        }

        // Support search ngày tháng
        if (s.split("/").length <= 3 && s.split("/").every((p, index) => {
            if (isStringPureInterger(p, 1)) return true;
            if (p == "" && index == s.split("/").length - 1) { // Kết thúc bằng "/" có thể người dùng chưa nhập xong: VD: "09/09/"
                return true;
            }
            return false;
        })) {
            s = s.split("/").map(p => {
                if (p == "" || p == "0") return "";
                return parseInt(p).toString();
            })
            .join("/")
        }

        return s;
    })
    .join(" ");

    const allFields = !searchFieldsAsString;
    const searchFields = searchFieldsAsString ? searchFieldsAsString.split(",") : [];

    people = people.filter(person => {
        let matched = false;
        (allFields ? Object.keys(person) : searchFields).forEach(field => {
            if (matched) return;
            if (["id", "ownerUserId", "isStandForUser", "avatarUrl", "spouseId", "fatherId", "motherId"].includes(field)) return;
            let val = person[field as keyof Person];
            if (!val) return;

            if (field == "deathdate" && normalDateToLunarDate(val as string)) {
                val += " " + normalDateToLunarDate(val as string) as string;
            }

            val = val.toString().toLowerCase();
            if (val.includes(search)) {
                matched = true
            }
        })
        return matched;
    });

    return people;
}

export default function getPersonController(personDAO: IDAO<Person>) {
    async function getAllPeopleBaseInfo(data: PaginateParams, loggedInUser: User | null): Promise<CHR<{ people: Person[]; total: number }>> {
        if (!loggedInUser) return CommonResponse[401];

        let people = await personDAO.findAll({ where: { ownerUserId: loggedInUser.id } });
        if (data.search) {
            people = filterPeople(people, data.search, data.searchFields);
        }
        let compare: undefined | ((v1: any, v2: any, k1: Person, k2: Person) => number) = undefined;

        if (data.sortBy == "status_deathdate") {
            data.sortBy = "status";
            const sortDesc = data.sortDesc == "true";

            compare = (v1, v2, k1, k2) => {
                if (v1 != v2) {
                    return v1 == LifeStatus.ALIVE ? -1 : 1;
                }
                return compareTwoDateString(k1.deathdate, k2.deathdate, sortDesc);
            }
        }

        if (data.sortBy == "birthdate") {
            const sortDesc = data.sortDesc == "true";

            compare = (v1, v2) => {
                return compareTwoDateString(v1, v2, sortDesc);
            }
        }

        return {
            data: {
                people: paginateAndSortItems(people, data, compare),
                total: people.length
            },
            status: 200
        };
    }

    async function getPersonDetailInfo({ id }: { id: string }, loggedInUser: User | null): Promise<CHR<{ person: Person & {
        personIdsOnlySameFather: string[],
        personIdsOnlySameMother: string[],
        personIdsSameBothFatherAndMother: string[],
        childIds: string[]
    } }>> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;

        const person = await personDAO.findOne({ where: { id, ownerUserId: loggedInUser.id } });
        if (!person) return CommonResponse.BAD_REQUEST;

        const [peopleHasSameFather, peopleHasSameMother, children] = await Promise.all([
            person.fatherId ? personDAO.findAll({ where: { fatherId: person.fatherId } }) : Promise.resolve([]),
            person.motherId ? personDAO.findAll({ where: { motherId: person.motherId } }) : Promise.resolve([]),
            person.gender == Gender.MALE ?
                personDAO.findAll({ where: { fatherId: person.id } }) :
                personDAO.findAll({ where: { motherId: person.id } })
        ]);

        const personIdsSameFather = peopleHasSameFather.map(p => p.id).filter(id => id != person.id);
        const personIdsSameMother = peopleHasSameMother.map(p => p.id).filter(id => id != person.id);
        const setPersonIdsSameFather = new Set(personIdsSameFather);
        const setPersonIdsSameMother = new Set(personIdsSameMother);

        const personIdsOnlySameFather = personIdsSameFather.filter(id => !setPersonIdsSameMother.has(id));
        const personIdsOnlySameMother = personIdsSameMother.filter(id => !setPersonIdsSameFather.has(id));
        const personIdsSameBothFatherAndMother = personIdsSameFather.filter(id => setPersonIdsSameMother.has(id));
        
        return {
            data: {
                person: {
                    ...person,
                    personIdsOnlySameFather,
                    personIdsOnlySameMother,
                    personIdsSameBothFatherAndMother,
                    childIds: children.map(p => p.id)
                }
            },
            status: 200
        }
    }

    async function getFamilyTreeInfo({ subjectId, level }: { subjectId?: string, level: string }, loggedInUser: User | null): Promise<CHR<{
        ancestor: ExtendedPerson,
        subjectId: string,
    }>> {
        const levelInt = parseInt(level);
        if (!loggedInUser || isNaN(levelInt)) return CommonResponse[401];
        if (!subjectId) {
            const personStandForUser = await personDAO.findOne({ where: { ownerUserId: loggedInUser.id, isStandForUser: true } });
            if (!personStandForUser) return CommonResponse[400];
            subjectId = personStandForUser.id;
        }

        const people = await personDAO.findAll({ where: { ownerUserId: loggedInUser.id } });

        const mapIdToPerson: Record<string, ExtendedPerson> = {};
        const childrenIdsOf: Record<string, string[]> = {};
        const fatherIdOf: Record<string, string> = {};
        const motherIdOf: Record<string, string> = {};
        
        people.forEach(person => {
            mapIdToPerson[person.id] = Object.assign(person, {
                children: [],
            });
            childrenIdsOf[person.id] = [];
        });

        const getPersonById = (id: string) => {
            const person = mapIdToPerson[id];
            // Make copy
            return Object.assign({}, person, { children: [] }) as ExtendedPerson;
        }

        people.forEach(person => {
            if (person.motherId) {
                motherIdOf[person.id] = person.motherId;
                childrenIdsOf[person.motherId].push(person.id)
            }
            if (person.fatherId) {
                fatherIdOf[person.id] = person.fatherId
                childrenIdsOf[person.fatherId].push(person.id)
            }
        });

        let ancestor = getPersonById(subjectId);
        const consideredAncestorIds = new Set([ancestor.id]);
        const femaleIdsAllowedGetChildren = new Set<string>();

        while(true) {
            if (ancestor.fatherId && (!consideredAncestorIds.has(ancestor.fatherId))) {
                ancestor = getPersonById(ancestor.fatherId);
            }
            else if (levelInt > 2 && ancestor.motherId && (!consideredAncestorIds.has(ancestor.motherId))) {
                ancestor = getPersonById(ancestor.motherId);
                femaleIdsAllowedGetChildren.add(ancestor.id);
            }
            else {
                break;
            }

            consideredAncestorIds.add(ancestor.id);
        }

        // Travelsal and update children of person
        function travesal(person: ExtendedPerson, path?: Set<string>) {
            if (!path) path = new Set([person.id]);
            else path.add(person.id);

            if (person.gender == Gender.MALE || levelInt > 2) {
                childrenIdsOf[person.id].forEach(childId => {
                    if (!path) {
                        return; // By pass typescript error
                    }
                    if (!path.has(childId)) {

                        const child = getPersonById(childId);
                        travesal(child, path);

                        person.children.push({
                            child,
                            spouseId: person.id == child.fatherId ? child.motherId : child.fatherId,
                        });
                    }
                })
            }

            path.delete(person.id);
        }

        travesal(ancestor);

        return {
            data: {
                ancestor,
                subjectId
            },
            status: 200,
        }
    }

    async function createPerson(data: CreatePersonParams, loggedInUser: User | null): Promise<CHR<{ createdPersonId: string }>> {
        if (!loggedInUser) {
            return CommonResponse[400];
        }
        // to do: Check params

        const newPerson: Person = {
            id: uuid(),
            ownerUserId: loggedInUser.id,
            isStandForUser: false,
            ...data.person,
            birthdate: data.person.birthdate ? shortenDateString(data.person.birthdate) : null,
            deathdate: data.person.deathdate ? shortenDateString(data.person.deathdate) : null,
        }

        await personDAO.create(newPerson);

        if (data.role) {
            const { roleName, roleWithTargetPersonId } = data.role;
            if (roleName == "father") {
                await personDAO.update({ fatherId: newPerson.id }, { where: { id: roleWithTargetPersonId } });
            }
            else if (roleName == "mother") {
                await personDAO.update({ motherId: newPerson.id }, { where: { id: roleWithTargetPersonId } });
            }
        }

        // Đảm bảo 1 người chỉ có 1 bạn đời
        if (newPerson.spouseId) {
            const spouse = await personDAO.findByPk(newPerson.spouseId);
            if (spouse && spouse.spouseId) {
                await personDAO.update({ spouseId: null }, { where: { id: spouse.spouseId } });
            }
        }

        // to do: Create FieldVal with for all people FieldDef

        return {
            data: {
                createdPersonId: newPerson.id,
            },
            status: 200,
        }
    }

    async function deletePerson({ id }: { id: string }, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        if (!loggedInUser) {
            return CommonResponse[401];
        }

        const person = await personDAO.findByPk(id);
        if (!person || person.ownerUserId != loggedInUser.id || person.isStandForUser) {
            return CommonResponse[400];
        }

        await Promise.all([
            personDAO.update({ fatherId: null }, { where: { fatherId: id } }),
            personDAO.update({ motherId: null }, { where: { motherId: id } }),
            personDAO.update({ spouseId: null }, { where: { spouseId: id } }),
        ]);

        await personDAO.destroy({ where: { id } });

        // to do: FieldVal & FieldDef

        return CommonResponse.OK;
    }

    async function updatePerson(data: Partial<Person> & { id: string }, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        if (!loggedInUser) return CommonResponse[401];

        // to do: Validate data

        const person = await personDAO.findByPk(data.id);
        if (!person) return CommonResponse[400];

        await Promise.all(Object.entries(data).map(async ([field, value]) => {
            if (field == "gender" && value != person.gender) {
                await Promise.all([
                    personDAO.update({ fatherId: null }, { where: { fatherId: person.id } }),
                    personDAO.update({ motherId: null }, { where: { motherId: person.id } }),
                ]);
            }
            else if (field == "spouseId" && value != person.spouseId) {
                // Ban đầu có spouse
                if (person.spouseId) {
                    await personDAO.update({ spouseId: null }, { where: { id: person.spouseId } });
                }

                // Update to certain value
                if (value) {
                    const newSpouse = await personDAO.findByPk(value as string);
                    if (newSpouse) {
                        if (newSpouse.spouseId) {
                            await personDAO.update({ spouseId: null }, { where: { id: newSpouse.spouseId } });
                        }
                        await personDAO.update({ spouseId: person.id }, { where: { id: newSpouse.id } });
                    }
                }
            }
            else if (field == "status") {
                if (value != LifeStatus.DEAD) {
                    data.deathdate = null;
                }
            }
            else if (field == "deathdate" && value) {
                data.status = LifeStatus.DEAD;
            }
        }));

        await personDAO.update(data, { where: { id: person.id } });

        return CommonResponse.OK;
    }

    async function statistic(data: any, loggedInUser: User | null): Promise<CHR<{
        status: {
            [LifeStatus.ALIVE]: number,
            [LifeStatus.DEAD]: number,
            unknown: number
        },
        gender: {
            [Gender.MALE]: number,
            [Gender.FEMALE]: number,
        },
        agesOfLiving: { [age: string]: number },
        agesOfDeceased: { [age: string]: number },
        birthMonths: { [month: string]: number },
        deathMonths: { [month: string]: number },
        birthYears: { [month: string]: number },
        deathYears: { [month: string]: number },
    }>> {
        if (!loggedInUser) return CommonResponse[401];

        const status = {
            [LifeStatus.ALIVE]: 0,
            [LifeStatus.DEAD]: 0,
            unknown: 0
        };
        const gender = {
            [Gender.MALE]: 0,
            [Gender.FEMALE]: 0,
        }
        const agesOfLiving: { [age: string]: number } = {};
        const agesOfDeceased: { [age: string]: number } = {};
        const birthMonths : { [month: string]: number } = {};
        const deathMonths : { [month: string]: number } = {};
        const birthYears : { [month: string]: number } = {};
        const deathYears : { [month: string]: number } = {};

        const people = await personDAO.findAll();
        const [nd, nm, ny] = todayDate().split("/").map(n => parseInt(n));

        const increaseKeyValue = (obj: Record<string, number>, key: string | number) => {
            if (!obj[key]) {
                obj[key] = 1;
            } else {
                obj[key]++;
            }
        }

        function extractNormalDayMonthYear(date: string): [day: number, month: number, year: number] {
            if (date.endsWith("AL")) {
                date = date.replace("AL", "");
                const temp = lunarDateToNormalDate(date);
                if (!temp) return [1, 1, 10e10];
                date = temp;
            }
            const parts = date.split("/").map(p => parseInt(p));
            if (parts.length == 1) {
                return [1, 1, parts[0]];
            }
            else if (parts.length == 2) {
                return [1, parts[0], parts[1]];
            }
            return [parts[0], parts[1], parts[2]];
        }

        const checkIfMissingMonth = (date: string) => date.split("/").length == 1;

        people.forEach(person => {
            status[person.status || "unknown"] += 1;
            gender[person.gender] += 1;

            if (person.status == LifeStatus.ALIVE) {
                if (person.birthdate) {
                    const [d, m, y] = extractNormalDayMonthYear(person.birthdate);
                    let age = ny - y;
                    if (nm > m || (nm == m && nd >= d)) {
                        age += 1;
                    }
                    if (age < 0) age = 0;
                    increaseKeyValue(agesOfLiving, age);
                    increaseKeyValue(birthYears, y);
                    if (!checkIfMissingMonth(person.birthdate)) {
                        increaseKeyValue(birthMonths, m);
                    }
                }
            }
            else if (person.status == LifeStatus.DEAD) {
                if (person.deathdate) {
                    const [d, m, y] = extractNormalDayMonthYear(person.deathdate);

                    if (person.birthdate) {
                        const [bd, bm, by] = extractNormalDayMonthYear(person.birthdate);
                        let age = y - by;
                        if (m > bm || (m == bm && d >= bd)) {
                            age += 1;
                        }
                        if (age < 0) age = 0;
                        increaseKeyValue(agesOfDeceased, age);
                    }

                    increaseKeyValue(deathYears, y);
                    if (!checkIfMissingMonth(person.deathdate)) {
                        increaseKeyValue(deathMonths, m);
                    }
                }
            }
        });

        return {
            data: {
                status, gender, agesOfLiving, agesOfDeceased,
                birthMonths, birthYears, deathMonths, deathYears
            },
            status: 200,
        };
    }

    return {
        getAllPeopleBaseInfo,
        getPersonDetailInfo,
        getFamilyTreeInfo,
        createPerson,
        deletePerson,
        updatePerson,
        statistic
    };
}
