import { v4 as uuidv4 } from "uuid";
import { IDAO } from "../model/IDAO";
import { User } from "../model/User";
import { ControllerHandlerResult as CHR, CommonResponse, IsAdminGuard, SafeOmit, UserInfo, applyUserGuards, badRequetWithMsg } from "./utils";
import { DEFAUT_ADMIN_USERNAME } from "./auth";
import { nowDate, sortByStdDate } from "../utils/DateUtils";

export type SharedUserInfo = SafeOmit<User, "sessionToken" | "sessionExpiry" | "password">;

export default function getShareController(userDAO: IDAO<User>) {
    const shared = applyUserGuards<
        {},
        {},
        {
            users: SharedUserInfo[]
        }
    >(async () => {
        const users = await userDAO.findAll();

        const filtered = users.filter(user => user.username != DEFAUT_ADMIN_USERNAME).map(user => ({
            id: user.id,
            username: user.username,
            permission: user.permission,
            note: user.note,
            createdAt: user.createdAt
        }));

        return {
            data: {
                users: sortByStdDate("createdAt", filtered)
            },
            status: 200
        };
    }, IsAdminGuard);

    const addShare = applyUserGuards<
        {
            username: string,
            perm: "read" | "write",
            password: string,
            note: string
        },
        {},
        {}
    >(async ({ body: { username, perm, password, note } }) => {
        const existed = await userDAO.findOne({ where: { username } });
        if (existed) return badRequetWithMsg("Tên người dùng đã tồn tại!");

        perm = perm == "write" ? "write" : "read";

        await userDAO.create({
            id: uuidv4(),
            username,
            password,
            permission: perm,
            sessionToken: null,
            sessionExpiry: null,
            note,
            createdAt: nowDate()
        });

        return {
            data: {},
            status: 200
        };
    }, IsAdminGuard);

    const updateShare = applyUserGuards<
        { userId: string, permission?: "read" | "write", note?: string },
        {},
        {}
    >(async ({ body: { userId, permission, note } }) => {
        if (!permission && typeof note != "string") return CommonResponse.BAD_REQUEST;
        if (typeof userId != "string") return CommonResponse.BAD_REQUEST;
        if (permission && (permission != "read" && permission != "write")) return CommonResponse.BAD_REQUEST;
        if (note && typeof note != "string") return CommonResponse.BAD_REQUEST;

        const existsShare = await userDAO.findOne({ where: { id: userId } });
        if (!existsShare) {
            return CommonResponse.BAD_REQUEST;
        }
        if (existsShare.username == DEFAUT_ADMIN_USERNAME) {
            return CommonResponse.BAD_REQUEST;
        }

        const updateObj: Partial<User> = {
            ...(permission ? { permission: permission == "write" ? "write" : "read" } : {}),
            ...(note ? { note } : {})
        };

        await userDAO.update(updateObj, { where: { id: userId } });

        return {
            data: {},
            status: 200
        };
    }, IsAdminGuard);

    const deleteShare = applyUserGuards<
        {},
        { userId: string },
        {}
    >(async ({ query: { userId } }) => {
        if (!userId) {
            return CommonResponse.BAD_REQUEST;
        }

        const existsShare = await userDAO.findOne({ where: { id: userId } });
        if (!existsShare) {
            return CommonResponse.BAD_REQUEST;
        }
        if (existsShare.username == DEFAUT_ADMIN_USERNAME) {
            return CommonResponse.BAD_REQUEST;
        }
        
        await userDAO.destroy({ where: { id: userId } });

        return {
            data: {},
            status: 200
        };
    }, IsAdminGuard);

    return {
        shared, addShare, updateShare, deleteShare
    };
}
