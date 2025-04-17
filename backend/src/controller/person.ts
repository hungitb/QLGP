import { v4 as uuid } from "uuid";

import { compareTwoDateString, datePlusDay, DateInputDB, isSomeValueStandardNormalDate, isSufixedLunarDate, lunarDateToNormalDate, normalDateToLunarDate, nowDate, shortenDateString, sortByStdDate, StandardNormalDate, sufixedLunarDateToNormalDate, todayDate, convertDateStoredDBToDateInputDB, convertDateInputDBToDateStoredDB } from "../utils/DateUtils";
import { isStringPureInterger } from "../utils/ValidationUtils";
import { CommonResponse, paginateAndSortItems, type PaginateParams, type ControllerHandlerResult as CHR, Controller, ControllerHandler, applyUserGuards, CanReadGuard, CanWriteGuard, keysModel, SafeOmit } from "./utils";
import { LifeStatus, Gender, type Person } from "../model/Person";
import type { User } from "../model/User";
import type { IDAO, IDASO } from "../model/IDAO";
import { extractEvents, type Event } from "./event";
import { ThongTinGiaPha } from "../model/ThongTinGiaPha";

export type ExtendedPerson = Person & {
    children: {
        child: ExtendedPerson;
        spouseId: string | null;
    }[];
};

export type CreatePersonParams = {
    person: SafeOmit<Person, "id" | "createdAt">;
    role?: {
        roleName: string;
        roleWithTargetPersonId: string;
    };
};

function removeAccents(str: string) {
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // Một vài bộ encode coi các dấu mũ, dấu chữ như một kí tự riêng biệt nên thêm hai dòng này
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
    return str;
}

export function filterPeople(people: Person[], search: string, searchFieldsAsString?: string) {
    if (search.trim() == "") {
        return people;
    }

    search = search.trim().toLowerCase();
    while (search.includes("  ")) {
        search = search.replace("  ", " ");
    }
    const nonAccentsSearch = removeAccents(search);
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
            .join("/");
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
            // "createdAt", "updatedAt": default field of database, include "t" and some digits. For example:
            // "createdAt": "2024-12-02T13:57:26.804Z",
            // "updatedAt": "2024-12-02T13:57:26.804Z"
            if (["id", "ownerUserId", "isStandForUser", "avatarUrl", "spouseId", "fatherId", "motherId", "createdAt", "updatedAt"].includes(field)) return;
            let val = person[field as keyof Person];
            if (!val) return;

            const valAsLunarDate = normalDateToLunarDate(val as StandardNormalDate);
            if (field == "deathdate" && valAsLunarDate) {
                val += " " + valAsLunarDate;
            }

            val = val.toString().toLowerCase();
            if (val.includes(search)) {
                matched = true;
            } else if (removeAccents(val).includes(nonAccentsSearch)) {
                matched = true;
            }
        })
        return matched;
    });

    return people;
}

export default function getPersonController(personDAO: IDAO<Person>, userDAO: IDAO<User>, ttgpDASO: IDASO<ThongTinGiaPha>) {
    const getAllPeopleBaseInfo = applyUserGuards<
        {},
        PaginateParams,
        { people: Person[], total: number }
    >(async ({ query }) => {
        let people = await personDAO.findAll();
        if (query.search) {
            people = filterPeople(people, query.search, query.searchFields);
            people = sortByStdDate("createdAt", people);
        }

        let compare: undefined | ((v1: any, v2: any, k1: Person, k2: Person) => number) = undefined;

        if (query.sortBy == "status_deathdate") {
            query.sortBy = "status";
            const sortDesc = query.sortDesc == "true";

            compare = (v1, v2, k1, k2) => {
                if (v1 != v2) {
                    return v1 == LifeStatus.ALIVE ? -1 : 1;
                }
                return compareTwoDateString(
                    k1.deathdate,
                    k2.deathdate,
                    sortDesc
                );
            }
        }

        if (query.sortBy == "birthdate") {
            const sortDesc = query.sortDesc == "true";

            compare = (v1, v2) => {
                return compareTwoDateString(v1, v2, sortDesc);
            }
        }

        return {
            data: {
                people: paginateAndSortItems(people, query, compare),
                total: people.length
            },
            status: 200
        };
    }, CanReadGuard);

    const getPersonDetailInfo = applyUserGuards<
        {},
        { id: string },
        {
            person: Person & {
                personIdsOnlySameFather: string[],
                personIdsOnlySameMother: string[],
                personIdsSameBothFatherAndMother: string[],
                childIds: string[]
            }
        }
    >(async ({ query: { id } }) => {
        const person = await personDAO.findOne({ where: { id } });
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
    }, CanReadGuard);

    const getFamilyTreeInfo = applyUserGuards<
        {},
        { subjectId?: string, level: string },
        {
            ancestor: ExtendedPerson,
            subjectId: string,
        }
    >(async ({ query: { subjectId, level } }) => {
        const levelInt = parseInt(level || "3");
        if (isNaN(levelInt)) return CommonResponse.BAD_REQUEST;
        
        if (!subjectId) {
            const thongTinGiaPha = await ttgpDASO.get();

            if (!thongTinGiaPha.idToTien) {
                return CommonResponse.BAD_REQUEST;
            }
            
            subjectId = thongTinGiaPha.idToTien;
        }

        const people = await personDAO.findAll();

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
                if (!childrenIdsOf[person.id]) {
                    console.log(childrenIdsOf, person, person.id, childrenIdsOf);
                }
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
        };
    }, CanReadGuard);

    const createPerson = applyUserGuards<
        CreatePersonParams,
        {},
        { createdPersonId: string }
    >(async ({ body: data }) => {
        // to do: Check params, check trùng, tồn tại,...
        // Check xem nếu có bố, mẹ thì giới tính bố, mẹ có phải nam hay nữ không

        const newPerson: Person = {
            ...data.person,
            id: uuid(),
            birthdate: data.person.birthdate ? shortenDateString(data.person.birthdate) : null,
            deathdate: data.person.deathdate ? shortenDateString(data.person.deathdate) : null,
            createdAt: nowDate()
        };
        await personDAO.create(newPerson);

        const promises: Promise<any>[] = [];

        if (data.role) {
            const { roleName, roleWithTargetPersonId } = data.role;
            if (roleName == "father") {
                newPerson.gender = Gender.MALE; // Đảm bảo giới tính đúng
                promises.push(
                    personDAO.update({ fatherId: newPerson.id }, { where: { id: roleWithTargetPersonId } })
                );
            }
            else if (roleName == "mother") {
                newPerson.gender = Gender.FEMALE; // Đảm bảo giới tính đúng
                promises.push(
                    personDAO.update({ motherId: newPerson.id }, { where: { id: roleWithTargetPersonId } })
                );
            }
            // Check nếu role là child thì gán id bố và mẹ lại bằng roleWithTargetPersonId
            // Hiện tại code vẫn OK vì dựa vào giá trị từ frontend trả về
        }

        // Đảm bảo 1 người chỉ có 1 bạn đời
        if (newPerson.spouseId) {
            const spouse = await personDAO.findByPk(newPerson.spouseId);
            if (spouse) {
                promises.push(
                    personDAO.update({ spouseId: newPerson.id }, { where: { id: spouse.id } })
                );
                if (spouse.spouseId) {
                    promises.push(
                        personDAO.update({ spouseId: null }, { where: { id: spouse.spouseId } })
                    );
                }
            }
        }

        // to do: Create FieldVal with for all people FieldDef

        await Promise.all(promises);

        return {
            data: {
                createdPersonId: newPerson.id,
            },
            status: 200,
        };
    }, CanWriteGuard);

    const deletePerson = applyUserGuards<
        {},
        { id: string },
        { msg: string }
    >(async ({ query: { id } }) => {
        if (!id) return CommonResponse.BAD_REQUEST;

        const [person, ttgp] = await Promise.all([
            personDAO.findByPk(id),
            ttgpDASO.get()
        ]);
        if (!person) return CommonResponse.BAD_REQUEST;
        if (ttgp.idToTien == id) return CommonResponse.BAD_REQUEST;

        await Promise.all([
            personDAO.update({ fatherId: null }, { where: { fatherId: id } }),
            personDAO.update({ motherId: null }, { where: { motherId: id } }),
            personDAO.update({ spouseId: null }, { where: { spouseId: id } }),
        ]);

        await personDAO.destroy({ where: { id } });

        // to do: FieldVal & FieldDef

        return CommonResponse.OK;
    }, CanWriteGuard);

    const updatePerson = applyUserGuards<
        Partial<Person> & { id: string },
        {},
        { msg: string }
    >(async ({ body: data }) => {
        // to do: Validate data
        // to do: Validate data

        const person = await personDAO.findOne({ where: { id: data.id } });
        if (!person) return CommonResponse.BAD_REQUEST;

        await Promise.all(Object.entries(data).map(async ([_field, value]) => {
            const field = _field as keyof typeof data;

            if (field == "gender" && value != person.gender) {
                await Promise.all([
                    personDAO.update({ fatherId: null }, { where: { fatherId: person.id } }),
                    personDAO.update({ motherId: null }, { where: { motherId: person.id } })
                ]);
            }
            else if (field == "fatherId" && value != person.fatherId) {
                // Pass
            }
            else if (field == "motherId" && value != person.motherId) {
                // Pass;
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
                    } else {
                        data.spouseId = null;
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
    }, CanWriteGuard);

    const statistic = applyUserGuards<
        {},
        {},
        {
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
        }
    >(async () => {
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

        function extractNormalDayMonthYear(date: DateInputDB): [day: number, month: number, year: number] {
            if (isSufixedLunarDate(date)) {
                const temp = sufixedLunarDateToNormalDate(date);
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

            if (person.birthdate) {
                const [d, m, y] = extractNormalDayMonthYear(
                    convertDateStoredDBToDateInputDB(person.birthdate)
                );
                let age = ny - y;
                if (nm > m || (nm == m && nd >= d)) {
                    age += 1;
                }
                if (age < 0) age = 0;
                increaseKeyValue(birthYears, y);

                if (person.status == LifeStatus.ALIVE) {
                    increaseKeyValue(agesOfLiving, age);
                    if (!checkIfMissingMonth(person.birthdate)) {
                        increaseKeyValue(birthMonths, m);
                    }
                }
            }

            if (person.status == LifeStatus.DEAD) {
                if (person.deathdate) {
                    const [d, m, y] = extractNormalDayMonthYear(convertDateStoredDBToDateInputDB(person.deathdate));

                    if (person.birthdate) {
                        const [bd, bm, by] = extractNormalDayMonthYear(convertDateStoredDBToDateInputDB(person.birthdate));
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
    }, CanReadGuard);

    const analyzeRelationship = applyUserGuards<
        {},
        { id1: string, id2: string },
        { data: [string, string] }
    >(async ({ query: { id1, id2 } }) => {
        const [p1, p2] = await Promise.all([
            personDAO.findOne({ where: { id: id1 } }),
            personDAO.findOne({ where: { id: id2 } })
        ]);

        if (!p1 || !p2) return CommonResponse.BAD_REQUEST;

        // Do somethings

        return {
            data: {
                data: ["Không rõ", "Không rõ"]
            },
            status: 200
        };
    }, CanReadGuard);

    type GetEventsParams = {
        startDate?: StandardNormalDate;
        endDate?: StandardNormalDate;
        allPeople: boolean;
        personIds?: string;
        eventTypes?: string;
    };

    // Không dùng GET, vì nếu truy vấn theo person IDs có thể sẽ quá dài
    const getEvents = applyUserGuards<
        GetEventsParams,
        {},
        { events: Event[] }
    >(async ({ body: { startDate, endDate, allPeople, personIds, eventTypes } }) => {
        if (!allPeople && typeof personIds != "string") return CommonResponse.BAD_REQUEST;

        const people = await (async () => {
            const people = await personDAO.findAll();
            if (allPeople) {
                return people;
            }

            const validPersonIds = new Set(personIds!.split(","));
            return people.filter(p => validPersonIds.has(p.id));
        })();
        
        if (!isSomeValueStandardNormalDate(startDate)) {
            startDate = todayDate();
        }

        if (!isSomeValueStandardNormalDate(endDate)) {
            endDate = datePlusDay(startDate, 366);
        }

        const events = extractEvents(startDate, endDate, people, eventTypes);

        return {
            data: { events },
            status: 200
        };
    }, CanReadGuard);

    const updateThongTinGiaPha = applyUserGuards<
        Partial<ThongTinGiaPha>,
        {}
    >(async ({ body: data }) => {
        // to do: Validate data

        const keys = keysModel(data);

        if (data.idToTien && keys.includes("idToTien")) {
            const toTien = await personDAO.findByPk(data.idToTien);
            if (!toTien) return CommonResponse.BAD_REQUEST;
        }

        await ttgpDASO.update(data);

        return {
            data: {},
            status: 200
        };
    }, CanWriteGuard);

    return {
        getAllPeopleBaseInfo,
        getPersonDetailInfo,
        getFamilyTreeInfo,
        createPerson,
        deletePerson,
        updatePerson,
        statistic,
        analyzeRelationship,
        getEvents,
        updateThongTinGiaPha
    };
}
