export type ControllerHandlerResult<K extends object> = {
    data: {
      [attr in keyof K]?: K[attr];
    } & { msg?: string };
    status: number;
};

export type PaginateParams = {
    sortBy?: string,
    sortDesc?: string,
    page?: string,
    itemsPerPage?: string,
    search?: string,
    searchFields?: string,
    [key: string]: any;
}

export function paginateAndSortItems<K extends Record<string, any>>(items: K[], paginateParams: PaginateParams, compare?: (v1: any, v2: any, k1: K, k2: K) => number) {
    const { sortBy, sortDesc, page, itemsPerPage } = paginateParams;
    let itemsCopy = items;

    let pageNumber = parseInt(page || "0");
    if (isNaN(pageNumber)) pageNumber = 0;
    let itemsPerPageNumber = parseInt(itemsPerPage || "0");
    if (isNaN(itemsPerPageNumber)) itemsPerPageNumber = 0;
    
    // Trường hợp đặc biệt get all
    if (pageNumber == 1 && itemsPerPageNumber == -1) {
        itemsPerPageNumber = 10e10;
    }

    // Không hợp lệ hoặc vượt quá thì trả về rỗng luôn, không phải sort nữa
    if (page) {
        if (pageNumber <= 0) return [];
        if (itemsPerPageNumber <= 0) return [];
        
        const startIndex = (pageNumber - 1)*itemsPerPageNumber;
        if (startIndex >= items.length) return [];
    }

    if (sortBy) {
        if (!compare) compare = (a: any, b: any) => {
            if (!a.toString) return 1;
            if (!b.toString) return -1;
            return a.toString().localeCompare(b.toString())
        };
        const indices = items.map((v, index) => index)
        if (sortDesc == "true") {
            const _compare = compare;
            compare = (a, b, k1, k2) => (-_compare(a, b, k1, k2));
        }
        indices.sort((a, b) => {
            const v1 = items[a][sortBy];
            const v2 = items[b][sortBy];

            if (!v1) {
                if (!v2) return 0;
                return 1;
            }
            if (!v2) return -1;
            
            if (compare) {
                return compare(v1, v2, items[a], items[b]);
            }

            return 0;
        });
        itemsCopy = indices.map(i => items[i]);
    }

    if (page) {
        const result: K[] = [];
        const startIndex = (pageNumber - 1)*itemsPerPageNumber;
        for (let i = startIndex; i < items.length && (i - startIndex < itemsPerPageNumber); i++) {
            result.push(itemsCopy[i]);
        }
        return result;
    }

    return itemsCopy;
}

export function paginatedItemsAndReturnResponse<K extends Record<string, any>>(items: K[], paginateParams: PaginateParams, key: string, compare?: (a: any, b: any) => number) {
    return {
        data: {
            [key]: paginateAndSortItems(items, paginateParams, compare),
            total: items.length
        },
        status: 200
    }
}

export enum CommonMessages {
    INTERNAL_SERVER_ERROR = "Server đang bị lỗi, vui lòng thử lại sau",
    OK = "OK",
    NOK = "Not OK",
    UNAUTHORIZED = "Unauthorized",
    BAD_REQUEST = "Bad request!"
}

export enum AuthMessages {
    USERNAME_ALREADY_EXISTS = "Tên người dùng đã tồn tại",
    USER_NAME_DOES_NOT_EXIST = "Tên người dùng không tồn tại",
    WRONG_PASSWORD = "Sai mật khẩu"
}

export async function generateSessionToken() {
    return Math.round(Math.random()*10e10).toString();
}

export const CommonResponse = {
    400: { data: { msg: CommonMessages.BAD_REQUEST }, status: 400 },
    401: { data: { msg: CommonMessages.UNAUTHORIZED }, status: 401 },
    OK: { data: { msg: CommonMessages.OK }, status: 200 }
}
