import { v4 as uuidv4 } from "uuid";

import { CommonMessages, AuthMessages, generateSessionToken, CommonResponse } from "./utils";
import type { ControllerHandlerResult as CHR, DetailUser } from "./utils";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";
import { Gender, LifeStatus, Person } from "../model/Person";

export default function getAuthController(userDAO: IDAO<User>, personDAO: IDAO<Person>) {
    async function login({ username, password }: { username: string, password: string }, loggedInUser: DetailUser | null): Promise<CHR<{ msg: string, sessionToken: string }>> {
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

        user.sessionToken = process.env.QLGP_USE_BACKEND == "true" ? (await generateSessionToken()) : user.username
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
    }

    type RegisterParams = {
        username: string,
        password: string,
        fullname: string,
        gender: Gender,
        ownGraph: boolean,
    };
    
    async function register({ username, password, fullname, gender, ownGraph }: RegisterParams, loggedInUser: DetailUser | null): Promise<CHR<{ msg: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (user) return {
            data: { msg: AuthMessages.USERNAME_ALREADY_EXISTS },
            status: 409
        };

        const promises: Promise<any>[] = [];

        const newUser: User = {
            id: uuidv4(),
            username,
            password,
            sessionExpiry: null,
            sessionToken: null,
            ownGraph
        };
        promises.push(userDAO.create(newUser));

        if (ownGraph) {
            const newPerson: Partial<Person> = {
                id: uuidv4(),
                ownerUserId: newUser.id,
                isStandForUser: true,
                callname: fullname,
                gender,
                status: LifeStatus.ALIVE
            };

            promises.push(personDAO.create(newPerson as Person));
        }

        await Promise.all(promises);

        return CommonResponse.OK;
    }

    async function logout(data: {}, loggedInUser: DetailUser | null): Promise<CHR<{ msg: string }>> {
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
    };
}
