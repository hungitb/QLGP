import { v4 as uuid } from "uuid";

import { compareTwoDateString, normalDateToLunarDate } from "../utils/DateUtils";
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

            if (field == "deathday" && normalDateToLunarDate(val as string)) {
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

        let people = await personDAO.findAll({ where: { ownerUserId: loggedInUser.userId } });
        if (data.search) {
            people = filterPeople(people, data.search, data.searchFields);
        }
        let compare: undefined | ((v1: any, v2: any, k1: Person, k2: Person) => number) = undefined;

        if (data.sortBy == "status_deathday") {
            data.sortBy = "status";
            const sortDesc = data.sortDesc == "true";

            compare = (v1, v2, k1, k2) => {
                if (v1 != v2) {
                    return v1 == LifeStatus.ALIVE ? -1 : 1;
                }
                return compareTwoDateString(k1.deathday, k2.deathday, sortDesc);
            }
        }

        if (data.sortBy == "birthday") {
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

    async function getFamilyTreeInfo({ targetPersonId, level }: { targetPersonId?: string, level: string }, loggedInUser: User | null): Promise<CHR<{
        ancestor: ExtendedPerson,
        targetPersonId: string,
        people: Person[]
    }>> {
        const levelInt = parseInt(level);
        if (!loggedInUser || isNaN(levelInt)) return CommonResponse[401];
        if (!targetPersonId) {
            const personStandForUser = await personDAO.findOne({ where: { ownerUserId: loggedInUser.userId, isStandForUser: true } });
            if (!personStandForUser) return CommonResponse[400];
            targetPersonId = personStandForUser.id;
        }

        const people = await personDAO.findAll({ where: { ownerUserId: loggedInUser.userId } });

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

        let ancestor = mapIdToPerson[targetPersonId];
        const consideredAncestorIds = new Set([ancestor.id]);
        const femaleIdsAllowedGetChildren = new Set<string>();

        while(true) {
            if (ancestor.fatherId && (!consideredAncestorIds.has(ancestor.fatherId))) {
                ancestor = mapIdToPerson[ancestor.fatherId];
            }
            else if (levelInt > 2 && ancestor.motherId && (!consideredAncestorIds.has(ancestor.motherId))) {
                ancestor = mapIdToPerson[ancestor.motherId];
                femaleIdsAllowedGetChildren.add(ancestor.id);
            }
            else {
                break;
            }

            consideredAncestorIds.add(ancestor.id);
        }

        const travelsaledPersonIds = new Set([ancestor.id]);
        const queue = [ancestor];
        while (queue.length != 0) {
            const person = queue.pop();
            if (!person) continue; // By pass typescript error

            if (person.gender == Gender.MALE || levelInt > 2) {
                childrenIdsOf[person.id].forEach(childId => {
                    if (!travelsaledPersonIds.has(childId)) {
                        travelsaledPersonIds.add(childId);

                        const child = mapIdToPerson[childId];

                        person.children.push({
                            child,
                            spouseId: person.id == child.fatherId ? child.motherId : child.fatherId,
                        })

                        queue.push(child);
                    }
                })
            }
        }

        return {
            data: {
                ancestor,
                targetPersonId,
                people
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
            ownerUserId: loggedInUser.userId,
            isStandForUser: false,
            ...data.person,
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

        // Đảm bảo 1 người chỉ có 1 vợ/chồng
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
        if (!person || person.ownerUserId != loggedInUser.userId || person.isStandForUser) {
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

    return {
        getAllPeopleBaseInfo,
        getFamilyTreeInfo,
        createPerson,
        deletePerson
    };
}
