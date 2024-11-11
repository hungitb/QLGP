
import { getLunarDate } from "./amlich-hnd"
import { isStringPureInterger } from "./ValidationUtils";

const lunarDateYearRangeSupported = [1802, 2198];

// Xử lý trường hợp nếu 0 <= year <= 99 thì sẽ bị coi như là 1900 + year
function createProperlyDateObject(year: number, monthIndex: number, day: number) {
    const dateObj = new Date(year, monthIndex, day);
    if (0 <= year && year <= 99) {
        dateObj.setFullYear(year);
    }
    
    return dateObj;
}

function isInvalidForm(s: string, { isMissingDay = false, isMissingMonth = false, strictYearPadding = true } = {}) {
    const parts = s.split("/");
    const count = parts.length;

    const allPartsAreInt = parts.every(p => isStringPureInterger(p, 1));
    if (!allPartsAreInt) return false;
    
    // Riêng năm thì không được bắt đầu bằng số 0
    if (strictYearPadding && parts[parts.length - 1].startsWith("0")) {
        return false;
    }

    if (isMissingMonth) {
        return count == 1;
    }

    if (isMissingDay) {
        return count == 2;
    }

    return count == 3;
}

export function shortenDateString(date: string) {
    if (isInvalidForm(date)) {
        const [day, month, year] = date.split("/").map(s => parseInt(s))
        return `${day}/${month}/${year}`
    }
    if (isInvalidForm(date, { isMissingDay: true })) {
        const [month, year] = date.split("/").map(s => parseInt(s))
        return `${month}/${year}`
    }
    if (isInvalidForm(date, { isMissingMonth: true })) {
        const [year] = date.split("/").map(s => parseInt(s))
        return `${year}`
    }
    return date;
}

export function normalDateToLunarDate(nd: string) {
    if (dateValidationMessage(nd)) {
        return null;
    }

    const [nday, nmonth, nyear] = nd.split("/").map(s => parseInt(s));
    const { day, month, year } = getLunarDate(nday, nmonth, nyear);

    return `${day}/${month}/${year}`
}

export function lunarDateToNormalDate(ld: string, skipCheckingExistsLunarDate = false) {
    // skipCheckingExistsLunarDate: Tránh gọi đệ quy vô hạn khi gọi dateValidationMessage

    if (dateValidationMessage(ld, { isLunarDate: true }, skipCheckingExistsLunarDate)) {
        return null;
    }

    function timestampCompareLunarDate(timestamp: number) {
        const date = new Date(timestamp);
        const lunarDate = normalDateToLunarDate(`${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`)

        if (!lunarDate) return 1;

        const [lday, lmonth, lyear] = ld.split('/').map(n => parseInt(n))
        const [lday2, lmonth2, lyear2] = lunarDate.split('/').map(n => parseInt(n))

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
    )
    if (!timestamp) {
        return null;
    }

    const date = new Date(timestamp);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export function dateValidationMessage(date: string, { isLunarDate = false, isMissingDay = false, isMissingMonth = false } = {}, skipCheckingExistsLunarDate = false) {
    // skipCheckingExistsLunarDate: Tránh gọi đệ quy vô hạn khi gọi lunarDateToNormalDate

    isMissingMonth = isMissingMonth && (!isLunarDate)
    isMissingDay = (isMissingDay || isMissingMonth) && (!isLunarDate)

    if (!isInvalidForm(date, { isMissingDay, isMissingMonth })) {
        return `Không đúng định dạng "${(isMissingDay ? "" : "ngày/") + (isMissingMonth ? "" : "tháng/") + "năm"}"`
    }

    if (isLunarDate) {
        const [day, month, year] = date.split("/").map(s => parseInt(s));
        if (day < 1 || 31 < day) return "Ngày phải nằm trong khoảng 1-31";
        if (month < 1 || 12 < month) return "Tháng phải nằm trong khoảng 1-12";
        if (year < lunarDateYearRangeSupported[0] || lunarDateYearRangeSupported[1] < year) {
            return `Chỉ hỗ trợ lịch âm từ năm ${lunarDateYearRangeSupported[0]}-${lunarDateYearRangeSupported[1]}`
        }

        if (!skipCheckingExistsLunarDate) {
            if (!lunarDateToNormalDate(date, true)) {
                return "Không tồn tại ngày âm này";
            }
        }
    }
    else {
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
    }

    return null;
}

export function transformDateString(date: string, {
    showLunarDate = true,
    showNormalDate = true
} = {}) {
    if (!date.endsWith("AL")) {
        const lunarDate = normalDateToLunarDate(date);
        if (!lunarDate) return date;

        if (showLunarDate) {
            return `${date} (${lunarDate} AL)`
        }
        return date;
    }

    const lunarDate = date.replace("AL", "");
    const normalDate = lunarDateToNormalDate(lunarDate);

    if (!showNormalDate) return lunarDate + " AL";
    if (!showLunarDate) return normalDate as string;

    return `${normalDate} (${lunarDate} AL)`
}

export function compareTwoDateString(d1: string | null, d2: string | null, desc = false) {
    function dateInfo(d: string | null) {
        if (!d) {
            return {
                isValid: false,
                day: 0, month: 0, year: 0
            };
        }

        const isLunarDate = d.endsWith("AL");
        if (isLunarDate) {
            d = d.replace("AL", "");
        }

        if (!dateValidationMessage(d, { isLunarDate })) {
            if (isLunarDate) {
                d = lunarDateToNormalDate(d) as string;
            }

            const [day, month, year] = d.split("/").map(s => parseInt(s));
            return {
                isValid: true,
                day, month, year
            }
        }

        if (!dateValidationMessage(d, { isLunarDate, isMissingDay: true })) {
            const [month, year] = d.split("/").map(s => parseInt(s));
            return {
                isValid: true,
                day: 0, month, year
            };
        }

        if (!dateValidationMessage(d, { isLunarDate, isMissingMonth: true })) {
            const [year] = d.split("/").map(s => parseInt(s));
            return {
                isValid: true,
                day: 0, month: 0, year
            };
        }

        return {
            isValid: false,
            day: 0, month: 0, year: 0
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
