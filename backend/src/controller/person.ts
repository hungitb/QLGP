import { v4 as uuid } from "uuid";

import { compareTwoDateString, datePlusDay, DateInputDB, isSomeValueStandardNormalDate, isSufixedLunarDate, lunarDateToNormalDate, normalDateToLunarDate, nowDate, shortenDateString, sortByStdDate, StandardNormalDate, sufixedLunarDateToNormalDate, todayDate, convertDateStoredDBToDateInputDB, convertDateInputDBToDateStoredDB, isDateStoredDB } from "../utils/DateUtils";
import { isStringPureInterger } from "../utils/ValidationUtils";
import { CommonResponse, paginateAndSortItems, type PaginateParams, type ControllerHandlerResult as CHR, Controller, ControllerHandler, applyUserGuards, CanWriteGuard, keysModel, SafeOmit } from "./utils";
import { Gender, type Person, PersonAdvanceDAO, RelationshipAnalysisResult, LifeState } from "../model/Person";
import type { User } from "../model/User";
import type { IDAO, IDASO } from "../model/IDAO";
import { extractEvents, type Event } from "./event";
import { ThongTinGiaPha } from "../model/ThongTinGiaPha";
import { FieldDef } from "../model/FieldDef";
import { FieldVal } from "../model/FieldVal";

export type FamilyTreePerson = {
    id: string,
    fatherId: string | null,
    motherId: string | null,
    spouseId: string | null,
    children: {
        child: FamilyTreePerson;
        spouseId: string | null;
    }[];
};

export type RoleOfPersonWithOtherPerson = "father" | "mother" | "spouse" | "child";
export type CreatePersonParams = {
    person: SafeOmit<Person, "id" | "createdAt" | "youngnessLevel">;
    role?: {
        roleName: RoleOfPersonWithOtherPerson;
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

export function getAllDoiDuoi(person: Person, allPeople: Person[]) {
    const childrenMapping: Record<string, string[]> = {};

    allPeople.forEach(person => {
        childrenMapping[person.id] = [];
    });

    allPeople.forEach(person => {
        if (person.fatherId) {
            childrenMapping[person.fatherId].push(person.id);
        }
        if (person.motherId) {
            childrenMapping[person.motherId].push(person.id);
        }
    });

    const doiDuoiIds = new Set<string>();

    function addPerson(personId: string) {
        if (doiDuoiIds.has(personId)) {
            return;
        }

        doiDuoiIds.add(personId);

        childrenMapping[personId].forEach(childId => {
            addPerson(childId);
        });
    }

    childrenMapping[person.id].forEach(childId => {
        addPerson(childId);
    });

    return [...allPeople].filter(p => doiDuoiIds.has(p.id));
}

export function getAllDoiTren(person: Person, allPeople: Person[]) {
    const doiTrenIds = new Set<string>();

    const personMapping: Record<string, Person> = {};
    allPeople.forEach(person => {
        personMapping[person.id] = person;
    });

    function addPerson(person: Person) {
        if (doiTrenIds.has(person.id)) {
            return;
        }

        doiTrenIds.add(person.id);
        
        if (person.fatherId) {
            addPerson(personMapping[person.fatherId]);
        }
        if (person.motherId) {
            addPerson(personMapping[person.motherId]);
        }
    }

    if (person.fatherId) {
        addPerson(personMapping[person.fatherId]);
    }
    if (person.motherId) {
        addPerson(personMapping[person.motherId]);
    }

    return allPeople.filter(p => doiTrenIds.has(p.id));
}

export default function getPersonController(
    personDAO: IDAO<Person>,
    userDAO: IDAO<User>,
    ttgpDASO: IDASO<ThongTinGiaPha>,
    personAdvanceDAO: PersonAdvanceDAO,
    fieldDefDAO: IDAO<FieldDef>,
    fieldValDAO: IDAO<FieldVal>
) {
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
                    return v1 == "ALIVE" ? -1 : 1;
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
    });

    const getPersonDetailInfo = applyUserGuards<
        {},
        { id: string },
        {
            person: Person & {
                personIdsOnlySameFather: string[],
                personIdsOnlySameMother: string[],
                personIdsSameBothFatherAndMother: string[],
                childIds: string[],
                additionalData: (FieldVal & { fieldDef: FieldDef })[],
                thuocGiaPha: boolean,
                doiThu: number | null,
                connectingPathToToTien: Awaited<ReturnType<typeof personAdvanceDAO.findConnectingPath>>
            }
        }
    >(async ({ query: { id } }) => {
        const person = await personDAO.findOne({ where: { id } });
        if (!person) return CommonResponse.BAD_REQUEST;

        const [peopleHasSameFather, peopleHasSameMother, children] = await Promise.all([
            person.fatherId ? personDAO.findAll({ where: { fatherId: person.fatherId } }) : Promise.resolve([]),
            person.motherId ? personDAO.findAll({ where: { motherId: person.motherId } }) : Promise.resolve([]),
            person.gender == "MALE" ?
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

        const fieldVals = await fieldValDAO.findAll({ where: { personId: id } });
        const fieldDefs = await fieldDefDAO.findAllIdsIn(fieldVals.map(fv => fv.fieldDefId));
        const additionalData = fieldVals.map(fv => {
            return {
                ...fv,
                fieldDef: fieldDefs.find(fd => fd.id == fv.fieldDefId)!
            };
        });

        const [
            connectingPathToToTien,
            doiThu,
            thuocGiaPha
        ] = await Promise.all([
            personAdvanceDAO.findConnectingPath(person),
            personAdvanceDAO.findDoiThu(person),
            personAdvanceDAO.isPersonBelongToFamily(person.id)
        ]);
        
        return {
            data: {
                person: {
                    ...person,
                    personIdsOnlySameFather,
                    personIdsOnlySameMother,
                    personIdsSameBothFatherAndMother,
                    childIds: children.sort((p1, p2) => p1.youngnessLevel - p2.youngnessLevel).map(p => p.id),
                    additionalData,
                    connectingPathToToTien,
                    doiThu,
                    thuocGiaPha
                }
            },
            status: 200
        };
    });

    const getFamilyTreeInfo = applyUserGuards<
        {},
        { subjectId?: string, goUp?: string },
        {
            topLevelPerson: FamilyTreePerson,
            subjectId: string,
        }
    >(async ({ query: { subjectId, goUp } }) => {
        const ttgp = await ttgpDASO.get();

        if (subjectId) {
            const temp = await personDAO.findByPk(subjectId);
            if (!temp) {
                return CommonResponse.BAD_REQUEST;
            }
        } else {
            if (!ttgp.idToTien) {
                return CommonResponse.BAD_REQUEST;
            }
            subjectId = ttgp.idToTien;
        }

        const people = await personDAO.findAll();

        const mapIdToOriginPerson: Record<string, Person> = {};
        const mapIdToPerson: Record<string, FamilyTreePerson> = {};
        const childrenIdsOf: Record<string, string[]> = {};
        const fatherIdOf: Record<string, string> = {};
        const motherIdOf: Record<string, string> = {};
        
        people.forEach(person => {
            mapIdToOriginPerson[person.id] = person;
            mapIdToPerson[person.id] = {
                id: person.id,
                fatherId: person.fatherId,
                motherId: person.motherId,
                spouseId: person.spouseId,
                children: []
            };
            childrenIdsOf[person.id] = [];
        });

        const getPersonById = (id: string): FamilyTreePerson => {
            const person = mapIdToPerson[id];
            return Object.assign({}, person, { children: [] });
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

        var topLevelPerson = getPersonById(subjectId);

        // Đi lên cây gia phả, không quan tâm phả hệ hay mẫu hệ
        if (goUp) {
            const consideredAncestorIds = new Set([topLevelPerson.id]);
    
            while(true) {
                const canGoUpToFather = topLevelPerson.fatherId && (!consideredAncestorIds.has(topLevelPerson.fatherId));
                const canGoUpToMother = topLevelPerson.motherId && (!consideredAncestorIds.has(topLevelPerson.motherId));

                // Phả hệ thì ưu tiên đi lên nhánh bố, mẫu hệ ưu tiên đi lên nhánh mẹ
                if (ttgp.type == "phaHe") {
                    if (canGoUpToFather) {
                        topLevelPerson = getPersonById(topLevelPerson.fatherId!);
                    } else if (canGoUpToMother) {
                        topLevelPerson = getPersonById(topLevelPerson.motherId!);
                    } else {
                        break;
                    }
                } else if (ttgp.type == "mauHe") {
                    if (canGoUpToMother) {
                        topLevelPerson = getPersonById(topLevelPerson.motherId!);
                    } else if (canGoUpToFather) {
                        topLevelPerson = getPersonById(topLevelPerson.fatherId!);
                    } else {
                        break;
                    }
                } else {
                    const x: never = ttgp.type;
                    throw Error(`Missing case ttgp.type`);
                }
    
                consideredAncestorIds.add(topLevelPerson.id);
            }
        }

        // Travelsal and update children of person
        function travesal(person: FamilyTreePerson, path?: Set<string>) {
            if (!path) path = new Set([person.id]);
            else path.add(person.id);

            childrenIdsOf[person.id].forEach(childId => {
                if (!path) {
                    // Bypass typescript error
                    throw Error("Path is undefined");
                }

                if (!path.has(childId)) {

                    const child = getPersonById(childId);
                    travesal(child, path);

                    person.children.push({
                        child,
                        spouseId: person.id == child.fatherId ? child.motherId : child.fatherId,
                    });
                }
            });

            person.children.sort((p1, p2) => {
                return mapIdToOriginPerson[p1.child.id].youngnessLevel - mapIdToOriginPerson[p2.child.id].youngnessLevel;
            });

            path.delete(person.id);
        }

        travesal(topLevelPerson);

        return {
            data: {
                topLevelPerson,
                subjectId
            },
            status: 200,
        };
    });

    const checkBasicPersonFields = async (data: Partial<CreatePersonParams["person"]>, isUpdateOperation = false) => {
        if (data.fatherId && data.motherId && data.fatherId == data.motherId) {
            return false;
        }

        if (data.fatherId && data.spouseId && data.fatherId == data.spouseId) {
            return false;
        }

        if (data.motherId && data.spouseId && data.motherId == data.spouseId) {
            return false;
        }

        const [r1, r2, r3] = await Promise.all([
            [data.fatherId, "father"] as const,
            [data.motherId, "mother"] as const,
            [data.spouseId, "spouse"] as const
        ].map(async ([id, type]) => {
            if (id) {
                const p = await personDAO.findByPk(id);
                if (!p) {
                    return false;
                }

                if (type == "father" && p.gender != "MALE") {
                    return false;
                }
                if (type == "mother" && p.gender != "FEMALE") {
                    return false;
                }

                return true;
            }
            return true;
        }));

        if (!r1 || !r2 || !r3) {
            return false;
        }

        if (
            (typeof data.gender == "string" && data.gender != "MALE" && data.gender != "FEMALE") ||
            (typeof data.status == "string" && data.status != "ALIVE" && data.status != "DEAD" && data.status != "UNKNOWN")
        ) {
            return false;
        }

        if (isUpdateOperation) {
            if (data.callname && typeof data.callname != "string") {
                return false;
            }
        } else {
            if (typeof data.callname != "string" || data.callname == "") {
                return false;
            }
        }

        if (data.avatarUrl && typeof data.avatarUrl != "string") {
            return false;
        }

        if (data.birthdate) {
            if (!isDateStoredDB(data.birthdate)) {
                return false;
            }
        }

        if (data.deathdate) {
            if (!isDateStoredDB(data.deathdate)) {
                return false;
            }
        }

        return true;
    };

    const createPerson = applyUserGuards<
        CreatePersonParams,
        {},
        { createdPersonId: string }
    >(async ({ body: data }) => {
        const basicTest = await checkBasicPersonFields(data.person);
        if (!basicTest) {
            return CommonResponse.BAD_REQUEST;
        }

        if (data.role) {
            const p = await personDAO.findByPk(data.role.roleWithTargetPersonId);
            if (!p) {
                return CommonResponse.BAD_REQUEST;
            }

            if (data.role.roleName == "father") {
                if (p.fatherId || data.person.gender != "MALE") {
                    return CommonResponse.BAD_REQUEST;
                }
            }

            if (p.motherId || data.role.roleName == "mother") {
                if (data.person.gender != "FEMALE") {
                    return CommonResponse.BAD_REQUEST;
                }
            }
        }

        const newPerson: Person = {
            ...data.person,
            id: uuid(),
            callname: data.person.callname.trim(),
            birthdate: data.person.birthdate ? shortenDateString(data.person.birthdate) : null,
            deathdate: data.person.deathdate ? shortenDateString(data.person.deathdate) : null,
            createdAt: nowDate(),
            youngnessLevel: Math.round((new Date()).getTime())
        };
        await personDAO.create(newPerson);

        const promises: Promise<any>[] = [];

        if (data.role) {
            const { roleName, roleWithTargetPersonId } = data.role;
            const personThatNewPersonHasRoleTo = (await personDAO.findByPk(roleWithTargetPersonId))!;

            if (roleName == "father") {
                promises.push(
                    personDAO.update({ fatherId: newPerson.id }, { where: { id: roleWithTargetPersonId } })
                );
            }
            else if (roleName == "mother") {
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

        await Promise.all(promises);

        // Field defs for all
        const fieldDefs = await fieldDefDAO.findAll({ where: { isForAll: true } });
        await Promise.all(
            fieldDefs.map(fd => {
                return fieldValDAO.create({
                    id: uuid(),
                    personId: newPerson.id,
                    fieldDefId: fd.id,
                    value: null
                });
            })
        );

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

        // Find field defs that for only current person before clear field vals
        const fieldVals = await fieldValDAO.findAll({ where: { personId: id } });
        const fieldDefIds = fieldVals.map(fv => fv.fieldDefId);
        const fieldDefs = await fieldDefDAO.findAllIdsIn(fieldDefIds);
        const fieldDefForSinglePerson = fieldDefs.filter(fd => !fd.isForAll);

        // Clear field vals
        await fieldValDAO.update({ value: null }, { where: { value: id } });
        await fieldValDAO.destroy({ where: { personId: id } });

        // Clear field defs
        await Promise.all(fieldDefForSinglePerson.map(fd => fieldDefDAO.destroy({ where: { id: fd.id } })));

        return CommonResponse.OK;
    }, CanWriteGuard);

    const updatePerson = applyUserGuards<
        Partial<Person> & { id: string },
        {},
        { msg: string }
    >(async ({ body: data }) => {
        const person = await personDAO.findOne({ where: { id: data.id } });
        if (!person) return CommonResponse.BAD_REQUEST;

        const blacklistPeople = getAllDoiDuoi(person, await personDAO.findAll());
        const blacklistIds = new Set(blacklistPeople.map(p => p.id));
        if (
            (data.fatherId && blacklistIds.has(data.fatherId)) ||
            (data.motherId && blacklistIds.has(data.motherId)) ||
            (data.spouseId && blacklistIds.has(data.spouseId))
        ) {
            return CommonResponse.BAD_REQUEST;
        }

        const basicTest = await checkBasicPersonFields(data, true);
        if (!basicTest) {
            return CommonResponse.BAD_REQUEST;
        }

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
                if (value != "DEAD") {
                    data.deathdate = null;
                }
            }
            else if (field == "deathdate" && value) {
                data.status = "DEAD";
            }
        }));

        await personDAO.update(data, { where: { id: person.id } });

        return CommonResponse.OK;
    }, CanWriteGuard);

    const statistic = applyUserGuards<
        {},
        {},
        {
            status: Record<LifeState, number>,
            gender: Record<Gender, number>,
            agesOfLiving: { [age: string]: number },
            agesOfDeceased: { [age: string]: number },
            birthMonths: { [month: string]: number },
            deathMonths: { [month: string]: number },
            birthYears: { [month: string]: number },
            deathYears: { [month: string]: number },
        }
    >(async () => {
        const status = {
            ALIVE: 0,
            DEAD: 0,
            UNKNOWN: 0
        };
        const gender = {
            MALE: 0,
            FEMALE: 0,
        };
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

                if (person.status == "ALIVE") {
                    increaseKeyValue(agesOfLiving, age);
                    if (!checkIfMissingMonth(person.birthdate)) {
                        increaseKeyValue(birthMonths, m);
                    }
                }
            }

            if (person.status == "DEAD") {
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
    });

    const analyzeRelationship = applyUserGuards<
        {},
        { id1: string, id2: string },
        { data: RelationshipAnalysisResult | null }
    >(async ({ query: { id1, id2 } }) => {
        const [p1, p2] = await Promise.all([
            personDAO.findOne({ where: { id: id1 } }),
            personDAO.findOne({ where: { id: id2 } })
        ]);

        if (!p1 || !p2) return CommonResponse.BAD_REQUEST;

        return {
            data: {
                data: await personAdvanceDAO.relationshipAnalysis(p1, p2)
            },
            status: 200
        };
    });

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
    });

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

    const swapYoungnessLevel = applyUserGuards<
        { ids: string[] },
        {}
    >(async ({ body: { ids } }) => {
        if (!Array.isArray(ids)) {
            return CommonResponse.BAD_REQUEST;
        }

        for (const id of ids) {
            if (typeof id != "string" || id.trim() == "") {
                return CommonResponse.BAD_REQUEST;
            }
        }

        const people = await Promise.all(
            ids.map(id => personDAO.findByPk(id))
        );

        if (people.some(person => !person)) return CommonResponse.BAD_REQUEST;

        const youngnessLevels = people.map(p => p!.youngnessLevel).sort((a, b) => a - b);
        await Promise.all(
            people.map((person, index) => personDAO.update({
                youngnessLevel: youngnessLevels[index] },
                { where: { id: person!.id }
            }))
        );

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
        updateThongTinGiaPha,
        swapYoungnessLevel
    };
}
