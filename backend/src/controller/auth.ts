import { v4 as uuidv4 } from "uuid";

import { CommonMessages, AuthMessages, generateSessionToken, CommonResponse, wrapControllerWithInitialScript, applyUserGuards } from "./utils";
import type { Controller, ControllerHandler } from "./utils";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";

export const DEFAUT_ADMIN_USERNAME = "admin";
export const DEFAUT_ADMIN_PASSWORD = "admin";

export default function getAuthController(userDAO: IDAO<User>) {
    const initialScript = async () => {
        const user = await userDAO.findOne({ where: { username: DEFAUT_ADMIN_USERNAME } });
        if (!user) {
            await userDAO.create({
                id: uuidv4(),
                username: DEFAUT_ADMIN_USERNAME,
                password: DEFAUT_ADMIN_PASSWORD,
                permission: "admin",
                sessionToken: null,
                sessionExpiry: null,
                note: ""
            });
        }
    };

    const login: ControllerHandler<
        { username: string, password: string },
        {},
        {
            sessionToken: string,
            msg: string
        }
    > = async ({ body: { username, password } }) => {
        const user = await userDAO.findOne({ where: { username } });
        if (!user) return {
            data: { msg: AuthMessages.USER_NAME_DOES_NOT_EXIST },
            status: 400
        };

        if (user.password != password) {
            return {
                data: { msg: AuthMessages.WRONG_PASSWORD },
                status: 400
            };
        }

        user.sessionToken = process.env.QLGP_USE_BACKEND == "true" ? (await generateSessionToken()) : user.username;
        user.sessionExpiry = Date.now() + parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;

        await userDAO.update({
            sessionToken: user.sessionToken,
            sessionExpiry: user.sessionExpiry
        }, {
            where: { id: user.id }
        });

        return {
            data: {
                sessionToken: user.sessionToken,
                msg: CommonMessages.OK
            },
            status: 200
        };
    };

    const logout: ControllerHandler = async ({ user }) => {
        if (!user) return CommonResponse.OK;

        await userDAO.update({
            sessionExpiry: null,
            sessionToken: null
        },
        { where: { id: user.id } })

        return CommonResponse.OK;
    }

    const changePassword = applyUserGuards<
        { oldPassword: string, newPassword: string },
        {},
        { msg: string }
    >(async ({ user, body: { oldPassword, newPassword } }) => {
        if (user.password != oldPassword) {
            return {
                data: { msg: AuthMessages.WRONG_PASSWORD },
                status: 400
            };
        }

        await userDAO.update({
            password: newPassword
        }, { where: { id: user.id } });

        return CommonResponse.OK;
    });

    return wrapControllerWithInitialScript(
        {
            login, logout, changePassword
        },
        initialScript
    );
}
