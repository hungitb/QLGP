import {
    compareTwoDateString,
    datePlusDay,
    dateValidationMessage,
    lunarDateToNormalDate,
    normalDateToLunarDate,
    todayDate,
    normalDatePlusOneMonth,
    normalDateMinusDay
} from "../utils/DateUtils";
import { LifeStatus, type Person } from "../model/Person";

export enum EventTargetType {
    ALL = "ALL",
    SPECIFIC_PEOPLE = "SPECIFIC_PEOPLE",
    PEOPLE_IN_FAMILY_TREE_LEVEL_TWO = "PEOPLE_IN_FAMILY_TREE_LEVEL_TWO",
    PEOPLE_IN_FAMILY_TREE_LEVEL_THREE = "PEOPLE_IN_FAMILY_TREE_LEVEL_THREE",
};

export enum EventType {
    BIRTHDATE = "BIRTHDATE",
    BIRTHDAY = "BIRTHDAY",
    DEATHDATE = "DEATHDATE",
    DEATHDAY = "DEATHDAY",
    GIO_7_NGAY = "GIO_7_NGAY",
    GIO_49_NGAY = "GIO_49_NGAY",
    GIO_100_NGAY = "GIO_100_NGAY",
    LE_DAY_THANG_LICH_AM = "LE_DAY_THANG_LICH_AM",
    LE_DAY_THANG_LICH_DUONG = "LE_DAY_THANG_LICH_DUONG",
    LE_CUNG_THOI_NOI_LICH_AM = "LE_CUNG_THOI_NOI_LICH_AM",
    LE_CUNG_THOI_NOI_LICH_DUONG = "LE_CUNG_THOI_NOI_LICH_DUONG"
};

// Event default sẽ luôn mặc định là có và không thể sửa
export const allEventTypes: { text: string, value: EventType, desc: string, default?: true }[] = [
  {
    text: "Ngày sinh",
    value: EventType.BIRTHDATE,
    desc: "Ngày sinh",
    default: true,
  },
  {
    text: "Ngày mất",
    value: EventType.DEATHDATE,
    desc: "Ngày mất",
    default: true,
  },
  {
    text: "Sinh nhật",
    value: EventType.BIRTHDAY,
    desc: "Sinh nhật, sự kiện này diễn ra một năm một lần",
  },
  {
    text: "Giỗ năm",
    value: EventType.DEATHDAY,
    desc: "Ngày giỗ, sự kiện này diễn ra một năm một lần",
  },
  {
    text: "Giỗ 7 ngày",
    value: EventType.GIO_7_NGAY,
    desc: "Hay còn gọi là cúng thất tuần là một nghi lễ quan trọng trong phong tục ma chay.",
  },
  {
    text: "Giỗ 49 ngày",
    value: EventType.GIO_49_NGAY,
    desc: "Giỗ 49 ngày là một nghi lễ tâm linh quan trọng trong văn hóa Việt Nam.",
  },
  {
    text: "Giỗ 100 ngày",
    value: EventType.GIO_100_NGAY,
    desc: "Giỗ 100 ngày là một nghi lễ quan trọng, thể hiện lòng thành kính và tưởng nhớ đến người đã khuất.",
  },
  // {
  //   text: "Lễ đầy tháng (lịch âm)",
  //   value: EventType.LE_DAY_THANG_LICH_AM,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc đầu tiên trong cuộc đời của một đứa trẻ.",
  // },
  // {
  //   text: "Lễ đầy tháng (lịch dương)",
  //   value: EventType.LE_DAY_THANG_LICH_DUONG,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc đầu tiên trong cuộc đời của một đứa trẻ.",
  // },
  // {
  //   text: "Lễ cúng thôi nôi (lịch âm)",
  //   value: EventType.LE_CUNG_THOI_NOI_LICH_AM,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc tròn một tuổi của trẻ sơ sinh",
  // },
  // {
  //   text: "Lễ cúng thôi nôi (lịch dương)",
  //   value: EventType.LE_CUNG_THOI_NOI_LICH_DUONG,
  //   desc: "Là nghi thức truyền thống đánh dấu cột mốc tròn một tuổi của trẻ sơ sinh",
  // },
];

export type Event = {
    normalDate: string;
    type: EventType;
    personId: string;
    explain?: string;
};

export function extractEvents(startDate: string, endDate: string, people: Person[], eventTypesString?: string): Event[] {
    const events: Event[] = [];

    const isCompleteDate = (date: string) => date.split("/").length == 3;
    const isInTimeRange = (date: string) => {
        if (!startDate || !endDate) return false;
        return compareTwoDateString(date, startDate) >= 0 && compareTwoDateString(date, endDate) <= 0;
    }
    const eventTypes = new Set(eventTypesString ? eventTypesString.split(",") : allEventTypes.map(e => e.value));
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

            if (eventTypes.has(EventType.BIRTHDAY)) {
                // Math.max(sy, y + 1): Tránh sinh nhật và ngày sinh cùng xuất hiện
                for (let year = Math.max(sy, y + 1); year <= ey; year++) {
                    let explain: string | undefined = undefined;
                    let date = `${d}/${m}/${year}`;

                    if (d == 29 && m == 2 && dateValidationMessage(date)) {
                        // Sinh ngày 29/2 nhưng năm đang xét không có ngày này, nên sẽ lùi 1 ngày
                        date = `28/2/${year}`;
                        explain = `Sinh nhật bị lùi 1 ngày do năm ${year} không có ngày 29/2`;
                    }

                    if (isInTimeRange(date) && (person.status != LifeStatus.DEAD || (!person.deathdate) || compareTwoDateString(date, person.deathdate) <= 0)) {
                        events.push({
                            type: EventType.BIRTHDAY,
                            normalDate: date,
                            personId: person.id,
                            explain
                        });
                    }
                }
            }

            // if (eventTypes.has(EventType.LE_CUNG_THOI_NOI_LICH_DUONG)) {
            //     const temp = normalDatePlusOneMonth(birthdate);
            //     // Chưa có nam lùi 1 nữ lùi 2
            //     if (temp[0]) {
            //         if (isInTimeRange(temp[0])) {
            //             const [d, m, y] = birthdate.split("/").map(s => parseInt(s));
            //             const [d2, m2, y2] = m == 12 ? [d, 1, y + 1] : [d, m + 1, y]; // For explain purpose (if has)

            //             events.push({
            //                 type: EventType.LE_CUNG_THOI_NOI_LICH_DUONG,
            //                 normalDate: temp[0],
            //                 personId: person.id,
            //                 explain: temp[1] ? `Đã bị lùi ${temp[1]} ngày do không tồn tại ngày ${d2}/${m2}/${y2} trong lịch dương` : undefined
            //             });
            //         }
            //     }
            // }
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

            if (isInTimeRange(datePlusDay(deathdate, 7))) {
                events.push({
                    type: EventType.GIO_7_NGAY,
                    normalDate: datePlusDay(deathdate, 7),
                    personId: person.id
                });
            }

            if (isInTimeRange(datePlusDay(deathdate, 49))) {
                events.push({
                    type: EventType.GIO_49_NGAY,
                    normalDate: datePlusDay(deathdate, 49),
                    personId: person.id
                });
            }

            if (isInTimeRange(datePlusDay(deathdate, 100))) {
                events.push({
                    type: EventType.GIO_100_NGAY,
                    normalDate: datePlusDay(deathdate, 100),
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

    return events;
}
