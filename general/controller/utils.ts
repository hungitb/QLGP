
type ControllerResultWrapper<K extends object> = [data: K | { msg: string }, status: number]

export enum CommonMessages {
    INTERNAL_SERVER_ERROR = "Server đang bị lỗi, vui lòng thử lại sau",
    OK = "OK",
    NOK = "Not OK"
}

export enum AuthMessages {
    USERNAME_ALREADY_EXISTS = "Tên người dùng đã tồn tại",
    USER_NAME_DOES_NOT_EXIST = "Tên người dùng không tồn tại",
    WRONG_PASSWORD = "Sai mật khẩu"
}

export async function generateSessionToken() {
    return Math.round(Math.random()*10e10).toString();
}

export type { ControllerResultWrapper }
