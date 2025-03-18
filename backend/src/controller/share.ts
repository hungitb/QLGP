import { IDAO } from "../model/IDAO";
import { Share } from "../model/Share";
import { User } from "../model/User";
import { DetailUser, ControllerHandlerResult as CHR, CommonResponse } from "./utils";

export default function getShareController(shareDAO: IDAO<Share>, userDAO: IDAO<User>) {
    async function searchUser({ username }: { username: string }, loggedInUser: DetailUser | null): Promise<CHR<{ usernames: string[] }>> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;
        if (typeof username != "string") return CommonResponse.BAD_REQUEST;

        if (username.length < 4) {
            return {
                data: {
                    usernames: []
                },
                status: 200
            };
        }

        const allUsers = await userDAO.findAll();
        const usernames = allUsers.filter(user => !user.ownGraph)
            .map(user => user.username)
            .filter(_username => _username.includes(username))
            .sort((a, b) => a.length - b.length)
            .filter((_, i) => i < 4);

        return {
            data: { usernames },
            status: 200
        };
    }

    async function shared(data: {}, loggedInUser: DetailUser | null): Promise<CHR<{ users: (User & { perm: "read" | "write" })[] }>> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;
        if (!loggedInUser.ownGraph) return CommonResponse.FORBIDDEN;

        const shares = await shareDAO.findAll({ where: { from: loggedInUser.id } });

        const result = await Promise.all(shares.map(async ({ to, perm }) => {
            const user = (await userDAO.findByPk(to))!;
            return Object.assign(user, { perm });
        }));

        return {
            data: {
                users: result
            },
            status: 200
        };
    }

    return {
        searchUser, shared
    };
}
