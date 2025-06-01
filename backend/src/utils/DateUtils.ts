
import { getLunarDate } from "./amlich-hnd"
import { isStringPureInterger } from "./ValidationUtils";

export type StdDate = string & { __type__: "StdDate" };

export function nowDate(): StdDate {
    const tempDate = new Date();
    const now = new Date(tempDate.getTime() + (tempDate.getTimezoneOffset()*60000) + 3600000*7); // Convert to UTC+7

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

    const timezone = "+07:00";

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezone}` as StdDate;
}

export function sortByStdDate<Key extends string, Obj extends { [K in Key]: StdDate }>(key: Key, objs: Obj[], order: "asc" | "desc" = "asc"): Obj[] {
    const times = objs.map(o => new Date(o[key]).getTime());

    const indixes = objs.map((_, i) => i);
    indixes.sort((i1, i2) => {
        const n1 = times[i1];
        const n2 = times[i2];

        const asc = order == "asc";

        if (isNaN(n1) && isNaN(n2)) {
            return 0;
        }
        if (isNaN(n1)) {
            return 1;
        }
        if (isNaN(n2)) {
            return -1;
        }

        return asc ? (n1 - n2) : (n2 - n1);
    });

    return indixes.map(i => objs[i]);
}

export function userFriendlyDateFormat(stdDate: StdDate) {
    const date = new Date(stdDate);

    if (isNaN(date.getTime())) {
      return `NaN`;
    }

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year} ${hours}h${minutes}`;
}

export type YearOnlyDate = string & { __typeYearOnlyDate__: true }; // "1954", "2003"
export type MonthAndYearDate = string & { __typeMonthAndYearDate__: true }; // "4/1975", "9/2003"
export type StandardFormDate = string & { __typeStandardFormDate__: true };
export type StandardNormalDate = StandardFormDate & { __typeCompleteNormalDate__: true }; // "12/8/2005", "1/1/2025"
export type StandardLunarDate = StandardFormDate & { __typeStandardLunarDate__: true }; // "1/4/2004", "30/2/2005"
export type SufixedLunarDate = string & { __typeSufixedLunarDate__: true }; // "1/4/2004AL", "30/2/2005AL"
export type AdvanceSufixedLunarDate = string & { __typeAdvanceSufixedLunarDate__: true }; // "1/4/2004AL19/5/2004", "30/2/2005AL8/4/2005"
export type DateInputDB = YearOnlyDate | MonthAndYearDate | StandardNormalDate | SufixedLunarDate;
export type DateStoredDB = YearOnlyDate | MonthAndYearDate | StandardNormalDate | AdvanceSufixedLunarDate;

export function isDateStoredDB(date: unknown): date is DateStoredDB {
    if (typeof date != "string") {
        return false;
    }

    if (date.includes("AL")) {
        const parts = date.split("AL");
        if (parts.length != 2) {
            return false;
        }
        const [left, right] = parts;

        const msg = lunarDateValidationMessage(left);
        if (msg) {
            return false;
        }

        const msg2 = nonLunarDateValidationMessage(right);
        if (msg2) {
            return false;
        }

        if (sufixedLunarDateToNormalDate((left + "AL") as SufixedLunarDate) != right) {
            return false;
        }

        return true;
    }

    const t1 = nonLunarDateValidationMessage(date);
    if (!t1) return true;

    const t2 = nonLunarDateValidationMessage(date, { isMissingDay: true });
    if (!t2) return true;

    const t3 = nonLunarDateValidationMessage(date, { isMissingMonth: true });
    if (!t3) return true;

    return false;
}

export function convertAdvanceSufixedLunarDateToSufixedLunarDate(date: AdvanceSufixedLunarDate): SufixedLunarDate {
    return date.split("AL")[0] + "AL" as SufixedLunarDate;
}

export function convertSufixedLunarDateToAdvanceSufixedLunarDate(date: SufixedLunarDate): AdvanceSufixedLunarDate {
    console.log(date, date + sufixedLunarDateToNormalDate(date))
    return date + sufixedLunarDateToNormalDate(date) as AdvanceSufixedLunarDate;
}

export function convertDateInputDBToDateStoredDB(date: DateInputDB): DateStoredDB;
export function convertDateInputDBToDateStoredDB(date: DateInputDB | null): DateStoredDB | null;
export function convertDateInputDBToDateStoredDB(date: DateInputDB | null): DateStoredDB | null {
    if (!date) return null;
    if (isSufixedLunarDate(date)) {
        return convertSufixedLunarDateToAdvanceSufixedLunarDate(date);
    }
    return date;
}

export function convertDateStoredDBToDateInputDB(date: DateStoredDB): DateInputDB;
export function convertDateStoredDBToDateInputDB(date: DateStoredDB | null): DateInputDB | null;
export function convertDateStoredDBToDateInputDB(date: DateStoredDB | null): DateInputDB | null {
    if (!date) return null;
    if (isAdvanceSufixedLunarDate(date)) {
        return convertAdvanceSufixedLunarDateToSufixedLunarDate(date);
    }
    return date;
}

export function isAdvanceSufixedLunarDate(date: DateStoredDB): date is AdvanceSufixedLunarDate {
    return date.includes("AL");
}

export function isSufixedLunarDate(date: DateInputDB): date is SufixedLunarDate {
    return date.endsWith("AL");
}

export function isStandardNormalDateOrSufixedLunarDate(date: DateInputDB): date is SufixedLunarDate | StandardNormalDate {
    return date.split("/").length == 3;
}

function isYearOnlyDate(date: DateInputDB): date is YearOnlyDate {
    if (date.endsWith("AL")) return false;
    return date.split("/").length == 1;
}

function isMonthAndYearDate(date: DateInputDB): date is MonthAndYearDate {
    if (date.endsWith("AL")) return false;
    return date.split("/").length == 2;
}

export function isStandardNormalDate(date: DateInputDB): date is StandardNormalDate {
    if (date.endsWith("AL")) return false;
    return date.split("/").length == 3;
}

export function isSomeValueStandardNormalDate(date: unknown): date is StandardNormalDate {
    if (typeof date != "string") return false;
    const msg = nonLunarDateValidationMessage(date);
    if (msg) return false;
    return true;
}

function getStandardNormalDate(date: Date): StandardNormalDate {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}` as StandardNormalDate;
}

function getDayMonthYearFromStandardFormDate(date: StandardFormDate): [day: number, month: number, year: number] {
    return date.split("/").map(i => Number(i)) as [number, number, number];
}

export function createStandardFormDateFromDayMonthYear(day: number, month: number, year: number) {
    return `${day}/${month}/${year}` as StandardNormalDate;
}

export function convertSufixedLunarDateToStandardLunarDate(date: SufixedLunarDate): StandardLunarDate {
    return date.replace("AL", "") as StandardLunarDate;
}

function convertStandardLunarDateToSufixedLunarDate(date: StandardLunarDate): SufixedLunarDate {
    return date + "AL" as SufixedLunarDate;
}

const lunarDateYearRangeSupported = [1802, 2198];

// Xử lý trường hợp nếu 0 <= year <= 99 thì sẽ bị coi như là 1900 + year
function createProperlyDateObject(year: number, monthIndex?: number, day?: number) {
    const dateObj = new Date(year, monthIndex || 0, day || 1);
    if (0 <= year && year <= 99) {
        dateObj.setFullYear(year);
    }
    
    return dateObj;
}

export function todayDate(): StandardNormalDate {
    const tempDate = new Date();
    const today = new Date(tempDate.getTime() + (tempDate.getTimezoneOffset()*60000) + 3600000*7); // Convert to UTC+7
    const [d, m, y] = [today.getDate(), today.getMonth() + 1, today.getFullYear()];
    return `${d}/${m}/${y}` as StandardNormalDate;
}

export function datePlusDay(normalDate: StandardNormalDate, day: number): StandardNormalDate {
    const [d, m, y] = normalDate.split("/").map(s => parseInt(s));
    const dateObj = createProperlyDateObject(y, m - 1, d);
    const resultDateObj = new Date(
        dateObj.getTime() + day*48*60*60*1000
    );
    const [d2, m2, y2] = [resultDateObj.getDate(), resultDateObj.getMonth() + 1, resultDateObj.getFullYear()];
    return `${d2}/${m2}/${y2}` as StandardNormalDate;
}

export function normalDateMinusDay(normalDate: StandardNormalDate, day: number) {
    const [d, m, y] = normalDate.split("/").map(s => parseInt(s));
    const dateObj = createProperlyDateObject(y, m - 1, d);
    const resultDateObj = new Date(
        dateObj.getTime() - day*48*60*60*1000
    );
    const [d2, m2, y2] = [resultDateObj.getDate(), resultDateObj.getMonth() + 1, resultDateObj.getFullYear()];
    return `${d2}/${m2}/${y2}`;
}

export function normalDatePlusOneMonth(normalDate: StandardNormalDate): [normalDate: StandardNormalDate, numDelayedDays: number] | [null, 0] {
    const [d, m, y] = normalDate.split("/").map(s => parseInt(s));

    let [d2, m2, y2] = m == 12 ? [d, 1, y + 1] : [d, m + 1, y];
    let date = `${d2}/${m2}/${y2}`;
    let count = 0;
    while (count < 10 && nonLunarDateValidationMessage(date)) {
        count++;
        d2--;
        if (d2 == 0) {
            d2 = 32;
            m2--;
            if (m2 == 0) {
                m2 = 12;
                y2--;
            }
        }
        date = `${d2}/${m2}/${y2}`;
    }

    if (nonLunarDateValidationMessage(date)) {
        return [null, 0];
    }

    return [`${d2}/${m2}/${y2}` as StandardNormalDate, count];
}

function dateFormatValidationMessage(date: string, { isMissingDay = false, isMissingMonth = false } = {}) {
    const parts = date.split("/");
    const count = parts.length;

    const invalidMessage = `Không đúng định dạng "${(isMissingDay ? "" : "ngày/") + (isMissingMonth ? "" : "tháng/") + "năm"}"`;

    const allPartsAreInt = parts.every(p => isStringPureInterger(p, 1));
    if (!allPartsAreInt) return invalidMessage;

    if (count > 3) return invalidMessage;

    if (isMissingMonth) {
        return count == 1 ? null : invalidMessage;
    }

    if (isMissingDay) {
        return count == 2 ? null : invalidMessage;
    }

    return count == 3 ? null : invalidMessage;
}

function isInvalidForm(date: string, { isMissingDay = false, isMissingMonth = false } = {}) {
    return !dateFormatValidationMessage(date, { isMissingDay, isMissingMonth });
}

export function shortenDateString(date: DateStoredDB): DateStoredDB {
    if (isAdvanceSufixedLunarDate(date)) {
        const [day, month, year] = getDayMonthYearFromStandardFormDate(
            convertSufixedLunarDateToStandardLunarDate(
                convertAdvanceSufixedLunarDateToSufixedLunarDate(date)
            )
        );
        return convertSufixedLunarDateToAdvanceSufixedLunarDate(
            convertStandardLunarDateToSufixedLunarDate(`${day}/${month}/${year}` as StandardLunarDate)
        );
    }
    if (isInvalidForm(date)) {
        const [day, month, year] = date.split("/").map(s => parseInt(s))
        return `${day}/${month}/${year}` as StandardNormalDate;
    }
    if (isInvalidForm(date, { isMissingDay: true })) {
        const [month, year] = date.split("/").map(s => parseInt(s))
        return `${month}/${year}` as MonthAndYearDate;
    }
    if (isInvalidForm(date, { isMissingMonth: true })) {
        const [year] = date.split("/").map(s => parseInt(s))
        return `${year}` as YearOnlyDate;
    }
    return date;
}

export function normalDateToLunarDate(nd: StandardNormalDate): StandardLunarDate | null {
    const [nday, nmonth, nyear] = nd.split("/").map(s => parseInt(s));
    const { day, month, year } = getLunarDate(nday, nmonth, nyear);

    if (day < 1 || month < 1 || year < 1 || year < lunarDateYearRangeSupported[0] || lunarDateYearRangeSupported[1] < year) {
        return null;
    }

    return `${day}/${month}/${year}` as StandardLunarDate;
}

export function lunarDateToNormalDate(date: StandardLunarDate): StandardNormalDate {
    const stdNormalDate = someValueToNullableNormalDate(date);
    if (stdNormalDate) return stdNormalDate;

    return `1/1/2000` as StandardNormalDate;
}

export function sufixedLunarDateToNormalDate(date: SufixedLunarDate): StandardNormalDate {
    return lunarDateToNormalDate(
        convertSufixedLunarDateToStandardLunarDate(date)
    );
}

function lunarDateFormatValidationMessage(date: string) {
    const formatMsg = dateFormatValidationMessage(date);
    if (formatMsg) return formatMsg;

    const [day, month, year] = date.split("/").map(s => parseInt(s));
    if (day < 1 || 31 < day) return "Ngày phải nằm trong khoảng 1-31";
    if (month < 1 || 12 < month) return "Tháng phải nằm trong khoảng 1-12";
    if (year < lunarDateYearRangeSupported[0] || lunarDateYearRangeSupported[1] < year) {
        return `Chỉ hỗ trợ lịch âm từ năm ${lunarDateYearRangeSupported[0]}-${lunarDateYearRangeSupported[1]}`
    }

    return null;
}

function someValueToNullableNormalDate(ld: string) {
    if (lunarDateFormatValidationMessage(ld)) {
        return null;
    }

    const [lday, lmonth, lyear] = ld.split('/').map(n => parseInt(n));

    function timestampCompareLunarDate(timestamp: number) {
        const lunarDate = normalDateToLunarDate(
            getStandardNormalDate(new Date(timestamp))
        );

        if (!lunarDate) return 1;

        const [lday2, lmonth2, lyear2] = lunarDate.split('/').map(n => parseInt(n));

        if (lday == lday2 && lmonth == lmonth2 && lyear == lyear2) return 0;
        
        if (lyear2 > lyear) return 1;
        if (lyear2 < lyear) return -1;
        if (lmonth2 > lmonth) return 1;
        if (lmonth2 < lmonth) return -1;

        return lday2 > lday ? 1 : -1;
    }

    function find(left: number, right: number): number | null {
        if (right - left < 24*60*60*1000) {
            if (timestampCompareLunarDate(left) == 0) return left;
            if (timestampCompareLunarDate(right) == 0) return right;
            return null;
        }

        const mid = (left + right)/2;
        const compare = timestampCompareLunarDate(mid)
        if (compare == 0) return mid

        if (compare == 1) {
            return find(left, mid)
        } else {
            return find(mid, right)
        }
    }

    const timestamp = find(
        createProperlyDateObject(lunarDateYearRangeSupported[0], 0, 1).getTime(),
        createProperlyDateObject(lunarDateYearRangeSupported[1] + 1, 0, 1).getTime()
    );

    if (!timestamp) {
        return null;
    }

    return getStandardNormalDate(new Date(timestamp));
}

export function lunarDateValidationMessage(date: unknown): string | null {
    if (typeof date != "string") return "Không phải chuỗi";
    const formatMsg = lunarDateFormatValidationMessage(date);
    if (formatMsg) return formatMsg;

    return someValueToNullableNormalDate(date)
        ? null
        : "Không tồn tại ngày âm này";
}

export function nonLunarDateValidationMessage(date: unknown, { isMissingDay = false, isMissingMonth = false } = {}) {
    isMissingDay = isMissingDay || isMissingMonth;
    
    if (typeof date != "string") return "Không phải chuỗi";
    const formatMsg = dateFormatValidationMessage(date, { isMissingDay, isMissingMonth });
    if (formatMsg) return formatMsg;

    if (isMissingMonth) {
        // Any years is treated as valid, skip this!
    }
    else if (isMissingDay) {
        const [month, year] = date.split("/").map(s => parseInt(s));
        if (month < 1 || 12 < month) return "Tháng phải nằm trong khoảng 1-12";
    }
    else {
        const [day, month, year] = date.split("/").map(s => parseInt(s));
        if (day < 1 || 31 < day) return "Ngày phải nằm trong khoảng 1-31";
        if (month < 1 || 12 < month) return "Tháng phải nằm trong khoảng 1-12";
        if (year < 1) return "Năm phải lớn hơn 0";

        const dateObj = createProperlyDateObject(year, month - 1, day);
        if (dateObj.getFullYear() != year || dateObj.getMonth() != month - 1 || dateObj.getDate() != day) {
            return "Không tồn tại ngày này";
        }
    }

    return null;
}

export function transformDateString(date: DateStoredDB, {
    showLunarDate = true,
    showNormalDate = true
} = {}) {
    if (!isAdvanceSufixedLunarDate(date)) {
        if (isStandardNormalDate(date) && showLunarDate) {
            const lunarDate = normalDateToLunarDate(date);
            if (!lunarDate) return date;
            return `${date} (${lunarDate} AL)`;
        }

        return date;
    }

    const lunarDate = convertSufixedLunarDateToStandardLunarDate(
        convertAdvanceSufixedLunarDateToSufixedLunarDate(date)
    );
    const normalDate = lunarDateToNormalDate(lunarDate);

    if (!showNormalDate) return lunarDate + " AL";
    if (!showLunarDate) return normalDate as string;

    return `${normalDate} (${lunarDate} AL)`;
}

export function compareTwoDateString(d1: DateStoredDB | null, d2: DateStoredDB | null, desc = false) {
    // desc: Chỉ sử dụng để quyết định cho trường hợp có date bị null

    function dateInfo(d: DateStoredDB | null) {
        const getInvalidResponse = () => ({
            isValid: false,
            day: 0, month: 0, year: 0
        });

        if (!d) {
            return getInvalidResponse();
        }

        if (isAdvanceSufixedLunarDate(d)) {
            const normalDate = sufixedLunarDateToNormalDate(
                convertAdvanceSufixedLunarDateToSufixedLunarDate(d)
            );
            if (!normalDate) {
                return getInvalidResponse();
            }

            const [day, month, year] = getDayMonthYearFromStandardFormDate(normalDate);
            return {
                isValid: true,
                day, month, year
            };
        }

        const parts = d.split("/").map(i => parseInt(i));
        
        if (parts.length == 3) {
            return {
                isValid: true,
                day: parts[0],
                month: parts[1],
                year: parts[2]
            };
        }

        if (parts.length == 2) {
            return {
                isValid: true,
                day: 0,
                month: parts[0],
                year: parts[1]
            };
        }

        return {
            isValid: true,
            day: 0,
            month: 0,
            year: parts[0]
        };
    }

    const d1Info = dateInfo(d1);
    const d2Info = dateInfo(d2);

    if (!d1Info.isValid) {
        if (d2Info.isValid) {
            return desc ? -1 : 1;
        }
        return 0;
    }

    if (!d2Info.isValid) {
        return desc ? 1 : -1;
    }

    const s1 = d1Info.year*500 + d1Info.month*40 + d1Info.day;
    const s2 = d2Info.year*500 + d2Info.month*40 + d2Info.day;

    if (s1 == s2) return 0;

    return s1 - s2 > 0 ? 1 : -1;
}
