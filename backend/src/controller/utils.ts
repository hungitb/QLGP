import { IDAO } from "../model/IDAO";
import { ThongTinGiaPha } from "../model/ThongTinGiaPha";
import { User } from "../model/User";
import { DEFAUT_ADMIN_USERNAME } from "./auth";

type RequestInputQuery = Record<string, string>;
type RequestInputBody = Record<string, any>;

export type SafeExclude<T, K extends T> = Exclude<T, K>;
export type SafeOmit<T, K extends keyof T> = Omit<T, K>;
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};

export type UserInfo = SafeOmit<User, "sessionToken" | "sessionExpiry" | "password" | "note"> & {
    thongTinGiaPha: ThongTinGiaPha;
};

export interface RequestInput<Body extends RequestInputBody, Query extends RequestInputQuery, UserCanNull extends boolean> {
    user: UserCanNull extends true ? User | null : User;
    query: {
        [key in keyof Query]: Query[key] | undefined;
    };
    body: Body;
};

export type ControllerHandlerResult<K extends object> = {
    data: K | { msg: string };
    status: number;
};

export type ControllerHandler<
    Body extends RequestInputBody = {},
    Query extends RequestInputQuery = {},
    Output extends object = {},
    UserCanNull extends boolean = true
> = (input: RequestInput<Prettify<Body>, Prettify<Query>, UserCanNull>) => Promise<ControllerHandlerResult<Output>>;

export type Controller = Record<string, ControllerHandler<any, any, any>>;

export function keysModel<K extends object>(obj: K): (keyof K)[] {
    return Object.keys(obj) as (keyof K)[];
}

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
    BAD_REQUEST = "Bad request!",
    FORBIDDEN = "Forbidden"
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
    FORBIDDEN: { data: { msg: CommonMessages.FORBIDDEN }, status: 403 },
    BAD_REQUEST: { data: { msg: CommonMessages.BAD_REQUEST }, status: 400 },
    401: { data: { msg: CommonMessages.UNAUTHORIZED }, status: 401 },
    UNAUTHORIZED: { data: { msg: CommonMessages.UNAUTHORIZED }, status: 401 },
    OK: { data: { msg: CommonMessages.OK }, status: 200 }
}

export function badRequetWithMsg(msg: string) {
    return {
        data: { msg },
        status: 400
    };
}

type UserGuard = {
    type: "UserGuard",
    handler: (input: RequestInput<any, any, false>) => Promise<ControllerHandlerResult<{ msg: string }> | void>;
};

export const CanWriteGuard: UserGuard = {
    type: "UserGuard",
    handler: async (input) => {
        if (
            input.user.permission != "admin" &&
            input.user.permission != "write"
        ) {
            return CommonResponse.FORBIDDEN;
        }
    }
};

export const IsAdminGuard: UserGuard = {
    type: "UserGuard",
    handler: async (input) => {
        if (input.user.permission != "admin") return CommonResponse.FORBIDDEN;
    }
};

export function applyUserGuards<
    Body extends RequestInputBody,
    Query extends RequestInputQuery,
    Output extends object = {}
>(handler: ControllerHandler<Body, Query, Output, false>, ...guards: UserGuard[]) {
    const newHandler: ControllerHandler<Body, Query, Output | { msg: string }, true> = async (input: RequestInput<Body, Query, true>) => {
        const user = input.user;
        if (!user) return CommonResponse.UNAUTHORIZED;
        
        for (const g of guards) {
            const result = await g.handler({ ...input, user });
            if (result) return result;
        }
        return handler(input as RequestInput<Body, Query, any> as RequestInput<Body, Query, false>);
    };

    return newHandler;
}

export async function runPromisesInBatchs<T>(promiseFactories: (() => Promise<T>)[], batchSize: number): Promise<T[]> {
    const result: T[] = [];
    for (let i = 0; i < Math.ceil(promiseFactories.length/batchSize); i++) {
        const temp: (() => Promise<T>)[] = [];
        for (let j = 0; j < batchSize; j++) {
            const index = i*batchSize + j;
            if (index < promiseFactories.length) {
                temp.push(promiseFactories[index]);
            } else {
                break;
            }
        }
        result.push(
            ...(
                await Promise.all(temp.map(t => t()))
            )
        );
    }
    return result;
}

export function wrapControllerWithInitialScript<T extends Controller>(controller: T, script: () => Promise<void>): T {
    let initialDone = false;
    let rejectedException: any;

    script()
    .then(() => {
        initialDone = true;
    }).catch((e) => {
        rejectedException = e;
    });

    const waitInitial = () => new Promise<void>(resolve => {
        const check = () => {
            if (initialDone) {
                resolve();
            } else if (rejectedException) {
                throw rejectedException;
            } else {
                setTimeout(check, 10);
            }
        }
        check();
    });

    Object.entries(controller).forEach(([handlerName, handler]) => {
        (controller as any)[handlerName] = async (...data: any[]) => {
            await waitInitial();

            return await handler(...(data as [any]));
        };
    });

    return controller;
}

export const usernamePasswordRules = [
    (v: string) => !!v || "Không được để trống",
    (v: string) =>
      (5 <= v.length && v.length <= 12) || "Độ dài phải từ 5 đến 12 ký tự",
    (v: string) =>
      /^[a-zA-Z0-9]+$/.test(v) || "Chỉ được chứa a-z, A-Z và 0-9",
];
