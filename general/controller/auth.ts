
// import bcrypt from "bcrypt"
import { v4 as uuidv4 } from "uuid"

import type { ControllerResult } from "./utils"
import type { Account } from "../model/Account"
import type { IDAO } from "../model/IDAO"

enum Message {
    OK = "OK",
    NOK = "NOK",
    USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
    USER_NAME_DOES_NOT_EXIST = "USER_NAME_DOES_NOT_EXIST",
    WRONG_PASSWORD = "WRONG_PASSWORD"
}

export default function getAuthController(accountDAO: IDAO<Account>) {
    // async function isUserIdExist({ userId }: { userId: string }): Promise<ControllerResult> {
    //     const exist = !!(await accountDAO.findByPk(userId))
    //     return exist ? [{ message: Message.OK }, 200] : [{ message: Message.NOK }, 400]
    // }

    // async function checkAccount({ username, hashedPassword }: { username: string, hashedPassword: string }): Promise<ControllerResult> {
    //     const account = await accountDAO.findByPk(username)

    //     if (!account) {
    //         return [{ message: Message.USER_NAME_DOES_NOT_EXIST }, 400]
    //     }

    //     if (account.hashedPassword != hashedPassword) {
    //         return [{ message: Message.WRONG_PASSWORD }, 400]
    //     }

    //     return [{ message: Message.OK }, 200]
    // }

    async function signUp({ username, password }: { username: string, password: string }): Promise<ControllerResult> {
        const account = await accountDAO.findByPk(username)

        if (account) return [{ message: Message.USERNAME_ALREADY_EXISTS }, 409]

        const bcrypt = {
            hashSync(a: string, b: string) {
                return a + b
            }
        }

        const hashedPassword = bcrypt.hashSync(password, "QLGP")

        const newAccount = {
            userId: uuidv4(),
            username,
            hashedPassword
        }

        await accountDAO.create(newAccount)

        // if (!account) {
        //     return [{ message: Message.USER_NAME_DOES_NOT_EXIST }, 400]
        // }

        // if (account.hashedPassword != hashedPassword) {
        //     return [{ message: Message.WRONG_PASSWORD }, 400]
        // }

        return [{ message: Message.OK }, 200]
    }

    return {
        signUp
    }
}
