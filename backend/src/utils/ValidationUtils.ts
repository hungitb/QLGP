export function isStringPureInterger(s: string, numZeroPrefixAllowed = 0) {
    // numZeroPrefixAllowed: Số số 0 được phép đứng ở đầu, numZeroPrefixAllowed == 0 tương đương không được phép

    while (s.startsWith("0") && s != "0") { // Cẩn thận remove số 0 của "0"
        if (numZeroPrefixAllowed <= 0) return false;
        numZeroPrefixAllowed--;
        s = s.slice(1);
    }
    
    if (isNaN(parseInt(s))) return false;

    if (s != parseInt(s).toString()) {
        return false;
    }

    return true;
}
