import { v4 as uuid } from "uuid";

import { compareTwoDateString, datePlusDay, dateValidationMessage, lunarDateToNormalDate, normalDateToLunarDate, todayDate } from "../utils/DateUtils";
import { isStringPureInterger } from "../utils/ValidationUtils";
import { CommonResponse, paginateAndSortItems, type PaginateParams, type ControllerHandlerResult as CHR } from "./utils";
import { LifeStatus, Gender, type Person } from "../model/Person";
import { EventTargetType, EventType, type EventSetting } from "../model/EventSetting";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export type Event = {
    normalDate: string;
    type: EventType;
    personId: string;
    explain?: string;
};

export function filterPeople(people: Person[], eventSetting: EventSetting) {
    if (eventSetting.targetType == EventTargetType.ALL) {
        return people;
    }

    const peopleMapping: Record<string, Person> = {};
    const mapIdToChildrenIds: Record<string, string[]> = {};
    people.forEach(person => {
        peopleMapping[person.id] = person;
        [person.fatherId, person.motherId].forEach(id => {
            if (id) {
                if (mapIdToChildrenIds[id]) {
                    mapIdToChildrenIds[id].push(person.id);
                }
                else {
                    mapIdToChildrenIds[id] = [person.id];
                }
            }
        })
    });

    if (eventSetting.targetType == EventTargetType.SPECIFIC_PEOPLE) {
        return eventSetting.specificPersonIds.split(",").map(
            id => peopleMapping[id]
        ).filter(p => p);
    }

    const { numGenerationsAbove, numGenerationsBelow, includePeopleEqualGeneration } = eventSetting;
    const personIds: string[] = [];
    const visited = new Set<string>();

    function travelsal(id: string | null, n = 0, goUp = true) {
        if (n < -numGenerationsAbove || n > numGenerationsBelow || (n == 0 && !includePeopleEqualGeneration)) {
            return;
        }
        if (!id || visited.has(id)) {
            return;
        }
        visited.add(id);
        personIds.push(id);

        const person = peopleMapping[id];

        if (person.gender == Gender.MALE) {
            if (mapIdToChildrenIds[id]) {
                mapIdToChildrenIds[id].forEach(cid => travelsal(cid, n + 1, false));
            }
            travelsal(person.spouseId, n, false);
            if (goUp) {
                travelsal(person.fatherId, n - 1, true);
            }
        } else {
            if (eventSetting.targetType == EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_THREE) {
                if (mapIdToChildrenIds[id]) {
                    mapIdToChildrenIds[id].forEach(cid => travelsal(cid, n + 1, false));
                }
                travelsal(person.spouseId, n, false);
            }
            if (goUp) {
                travelsal(person.fatherId, n - 1, true);
            }
        }
    }
    const personStandForUser = people.find(({ isStandForUser, ownerUserId }) => ownerUserId == eventSetting.userId && isStandForUser);
    if (!personStandForUser) return people;
    travelsal(personStandForUser.id, 0, true);

    return personIds.map(id => peopleMapping[id]);
}

export default function getEventController(eventSettingDAO: IDAO<EventSetting>, personDAO: IDAO<Person>) {
    async function getEvents({ startDate, endDate }: { startDate?: string, endDate?: string }, loggedInUser: User | null): Promise<CHR<{ events: Event[], eventSetting: EventSetting }>> {
        if (!loggedInUser) return CommonResponse[401];

        if (!startDate) {
            startDate = todayDate();
        }
        if (!endDate) {
            endDate = datePlusDay(startDate, 600);
        }

        const eventSetting = await eventSettingDAO.findByPk(loggedInUser.id);
        if (!eventSetting) return CommonResponse[400];

        const people = filterPeople(
            await personDAO.findAll({ where: { ownerUserId: loggedInUser.id } }),
            eventSetting
        );
        const events: Event[] = [];

        const isCompleteDate = (date: string) => date.split("/").length == 3;
        const isInTimeRange = (date: string) => {
            if (!startDate || !endDate) return false;
            return compareTwoDateString(date, startDate) >= 0 && compareTwoDateString(date, endDate) <= 0;
        }
        const eventTypes = new Set(eventSetting.types ? eventSetting.types.split(",") : []);
        const [sd, sm, sy] = startDate.split("/").map(s => parseInt(s));
        const [ed, em, ey] = endDate.split("/").map(s => parseInt(s));

        people.forEach(person => {
            if (person.birthdate && isCompleteDate(person.birthdate)) {
                const birthdate = person.birthdate.endsWith("AL") ? lunarDateToNormalDate(person.birthdate.replace("AL", "")) as string : person.birthdate;

                if (isInTimeRange(birthdate)) {
                    events.push({
                        type: EventType.BIRTHDATE,
                        normalDate: birthdate,
                        personId: person.id
                    });
                }
                
                const [d, m, y] = birthdate.split("/").map(s => parseInt(s));

                if (eventTypes.has(EventType.BIRTHDAY) && person.status != LifeStatus.DEAD) {
                    // Math.max(sy, y + 1): Tránh sinh nhật và ngày sinh cùng xuất hiện
                    for (let year = Math.max(sy, y + 1); year <= ey; year++) {
                        let explain: string | undefined = undefined;
                        let date = `${d}/${m}/${year}`;

                        if (d == 29 && m == 2 && dateValidationMessage(date)) {
                            // Sinh ngày 29/2 nhưng năm đang xét không có ngày này, nên sẽ lùi 1 ngày
                            date = `28/2/${year}`;
                            explain = `Sinh nhật bị lùi 1 ngày do năm ${year} không có ngày 29/2`;
                        }

                        if (isInTimeRange(date)) {
                            events.push({
                                type: EventType.BIRTHDAY,
                                normalDate: date,
                                personId: person.id,
                                explain
                            });
                        }
                    }
                }
            }
            if (person.deathdate && isCompleteDate(person.deathdate)) {
                const deathdate = person.deathdate.endsWith("AL") ? lunarDateToNormalDate(person.deathdate.replace("AL", "")) as string : person.deathdate;

                if (isInTimeRange(deathdate)) {
                    events.push({
                        type: EventType.DEATHDATE,
                        normalDate: deathdate,
                        personId: person.id
                    });
                }

                const lunarDeathdate = normalDateToLunarDate(deathdate);
                if (lunarDeathdate) {
                    const [ld, lm, ly] = lunarDeathdate.split("/").map(s => parseInt(s));

                    if (eventTypes.has(EventType.DEATHDAY)) {
                        // Math.max(sy - 1, ly + 1): Tránh ngày giỗ và ngày mất cùng xuất hiện
                        // sy - 1 chứ không phải sy vì có thể nếu chuyển sang lịch âm thì năm có thể giảm
                        for (let year = Math.max(sy - 1, ly + 1); year <= ey; year++) {
                            let explain: string | undefined = undefined;
                            let ldate = `${ld}/${lm}/${year}`;

                            let count = 0; // Số ngày bị lùi, vì có thể có ngày âm không tồn tại ở các năm. Giả dụ 31/4/2000 tồn tại nhưng 31/4/2001 không tồn tại
                            let [tld, tlm, tyear] = [ld, lm ,year];
                            while (count < 10 && dateValidationMessage(ldate, { isLunarDate: true })) {
                                count++;
                                tld--;
                                if (tld == 0) {
                                    tld = 32;
                                    tlm--;
                                    if (tlm == 0) {
                                        tlm = 12;
                                        tyear--;
                                    }
                                }
                                ldate = `${tld}/${tlm}/${tyear}`;
                            }

                            if (dateValidationMessage(ldate, { isLunarDate: true })) {
                                // Sau nhiều lần thử thì vẫn không được, có thể do nằm ngoài vùng hỗ trợ
                                continue;
                            }
    
                            if (count > 0) {
                                explain = `Ngày giỗ bị lùi ${count} ngày do năm ${year} không có ngày ${ld}/${lm}`;
                            }

                            const date = lunarDateToNormalDate(ldate);
                            if (date && isInTimeRange(date)) {
                                events.push({
                                    type: EventType.DEATHDAY,
                                    normalDate: date,
                                    personId: person.id,
                                    explain
                                });
                            }
                        }
                    }

                }
            }
        });

        events.sort((ev1, ev2) => compareTwoDateString(ev1.normalDate, ev2.normalDate));

        return {
            data: { events, eventSetting },
            status: 200,
        }
    }

    async function updateEventSetting(data: Partial<EventSetting>, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;

        if (data.types) {
            const typesArray = data.types.split(",");
            typesArray.sort();
            data.types = typesArray.filter(type => {
                return [EventType.BIRTHDAY, EventType.DEATHDAY].includes(type as any);
            }).join(",");
        }
        if (data.numGenerationsAbove) {
            data.numGenerationsAbove = Math.max(data.numGenerationsAbove, 0);
        }
        if (data.numGenerationsBelow) {
            data.numGenerationsBelow = Math.max(data.numGenerationsBelow, 0);
        }
        if (data.targetType) {
            if (![EventTargetType.ALL,
                EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_THREE,
                EventTargetType.PEOPLE_IN_FAMILY_TREE_LEVEL_TWO,
                EventTargetType.SPECIFIC_PEOPLE
            ].includes(data.targetType)) {
                data.targetType = EventTargetType.ALL;
            }
        }

        eventSettingDAO.update(data, { where: { userId: loggedInUser.id } });

        return CommonResponse.OK;
    }

    return {
        getEvents,
        updateEventSetting
    };
}
