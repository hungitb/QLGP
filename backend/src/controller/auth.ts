import { v4 as uuidv4 } from "uuid";

import { CommonMessages, AuthMessages, generateSessionToken, CommonResponse } from "./utils";
import type { ControllerHandlerResult as CHR } from "./utils";
import type { User } from "../model/User";
import type { IDAO } from "../model/IDAO";
import { Gender, LifeStatus, Person } from "../model/Person";
import { EventSetting, EventTargetType, allEventTypes } from "../model/EventSetting";

export default function getAuthController(userDAO: IDAO<User>, personDAO: IDAO<Person>, eventSettingDAO: IDAO<EventSetting>) {
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

    type RegisterParams = { username: string, password: string, fullname: string, gender: Gender };
    
    async function register({ username, password, fullname, gender }: RegisterParams, loggedInUser: User | null): Promise<CHR<{ msg: string }>> {
        const user = await userDAO.findOne({ where: { username } })
        if (user) return {
            data: { msg: AuthMessages.USERNAME_ALREADY_EXISTS },
            status: 409
        };

        const newUser: User = {
            id: uuidv4(),
            username,
            password,
            sessionExpiry: null,
            sessionToken: null
        };

        const newPerson: Partial<Person> = {
            id: uuidv4(),
            ownerUserId: newUser.id,
            isStandForUser: true,
            callname: fullname,
            gender,
            status: LifeStatus.ALIVE
        };

        const newEventSetting: EventSetting = {
            userId: newUser.id,
            targetType: EventTargetType.ALL,
            types: allEventTypes.filter(et => !et.default).map(et => et.value).join(","),
            specificPersonIds: "",
            numGenerationsAbove: 3,
            numGenerationsBelow: 3,
            includePeopleEqualGeneration: true
        }

        await Promise.all([
            userDAO.create(newUser),
            personDAO.create(newPerson as Person),
            eventSettingDAO.create(newEventSetting)
        ]);

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
