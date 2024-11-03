import { v4 as uuidv4 } from "uuid";

import type { ControllerResultWrapper as CRW } from "./utils";
import { CommonMessages, AuthMessages, generateSessionToken } from "./utils";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export default function getAuthController(userDAO: IDAO<User>) {
    async function login({ username, password }: { username: string, password: string }, loggedInUser: User | null): Promise<CRW<{ sessionToken: string, msg: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (!user) return [{ msg: AuthMessages.USER_NAME_DOES_NOT_EXIST }, 400]

        if (user.password != password) {
            return [{ msg: AuthMessages.WRONG_PASSWORD }, 400]
        }

        try {
            user.sessionToken = process.env.QLGP_USE_BACKEND == "true" ? (await generateSessionToken()) : user.username
            user.sessionExpiry = Date.now() + parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;

            userDAO.update({
                sessionToken: user.sessionToken,
                sessionExpiry: user.sessionExpiry
            }, {
                where: { userId: user.userId }
            })
        }
        catch {
            return [{ msg: CommonMessages.INTERNAL_SERVER_ERROR }, 500]
        }

        return [{ sessionToken: user.sessionToken, msg: CommonMessages.OK }, 200]
    }

    async function register({ username, password }: { username: string, password: string }, loggedInUser: User | null): Promise<CRW<{ msg: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (user) return [{ msg: AuthMessages.USERNAME_ALREADY_EXISTS }, 409]

        const newUser = {
            userId: uuidv4(),
            username,
            password
        }

        try {
            await userDAO.create(newUser)
        }
        catch {
            return [{ msg: CommonMessages.INTERNAL_SERVER_ERROR }, 500]
        }

        return [{ msg: CommonMessages.OK }, 200]
    }

    async function logout(data = {}, loggedInUser: User | null): Promise<CRW<{ msg: string }>> {
        if (!loggedInUser) {
            return [{ msg: CommonMessages.OK }, 200];
        }

        try {
            await userDAO.update({
                sessionExpiry: null,
                sessionToken: null
            },
            { where: { userId: loggedInUser.userId } })
        }
        catch {
            return [{ msg: CommonMessages.INTERNAL_SERVER_ERROR }, 500]
        }

        return [{ msg: CommonMessages.OK }, 200]
    }

    return {
        register, login, logout
    }
}
