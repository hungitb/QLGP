import { v4 as uuidv4 } from "uuid";

import { CommonMessages, AuthMessages, generateSessionToken, CommonResponse } from "./utils";
import type { ControllerHandlerResult as CHR } from "./utils";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export default function getAuthController(userDAO: IDAO<User>) {
    async function login({ username, password }: { username: string, password: string }, loggedInUser: User | null): Promise<CHR<{ msg: string, sessionToken: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (!user) return {
            data: { msg: AuthMessages.USER_NAME_DOES_NOT_EXIST },
            status: 400
        }

        if (user.password != password) {
            return {
                data: { msg: AuthMessages.WRONG_PASSWORD },
                status: 400
            }
        }

        user.sessionToken = process.env.QLGP_USE_BACKEND == "true" ? (await generateSessionToken()) : user.username
        user.sessionExpiry = Date.now() + parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;

        userDAO.update({
            sessionToken: user.sessionToken,
            sessionExpiry: user.sessionExpiry
        }, {
            where: { id: user.id }
        })

        return {
            data: {
                sessionToken: user.sessionToken,
                msg: CommonMessages.OK
            },
            status: 200
        }
    }

    async function register({ username, password }: { username: string, password: string }, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (user) return {
            data: { msg: AuthMessages.USERNAME_ALREADY_EXISTS },
            status: 409
        }

        const newUser: User = {
            id: uuidv4(),
            username,
            password,
            sessionExpiry: null,
            sessionToken: null
        }

        await userDAO.create(newUser);

        return CommonResponse.OK;
    }

    async function logout(data: {}, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        if (!loggedInUser) {
            return CommonResponse.OK;
        }

        await userDAO.update({
            sessionExpiry: null,
            sessionToken: null
        },
        { where: { id: loggedInUser.id } })

        return CommonResponse.OK;
    }

    return {
        register, login, logout
    }
}
