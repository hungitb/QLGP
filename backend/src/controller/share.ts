import { v4 as uuidv4 } from "uuid";
import { IDAO } from "../model/IDAO";
import { Share } from "../model/Share";
import { User } from "../model/User";
import { DetailUser, ControllerHandlerResult as CHR, CommonResponse, badRequetWithMsg } from "./utils";

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
        const usernames = allUsers
            .map(user => user.username)
            .filter(username => username != loggedInUser.username)
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

    async function addShare({ username, perm }: { username: string, perm: "read" | "write" }, loggedInUser: DetailUser | null): Promise<CHR> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;
        if (!loggedInUser.ownGraph) return CommonResponse.FORBIDDEN;
        
        if (loggedInUser.username == username) {
            return badRequetWithMsg("Không thể chia sẻ cho bản thân!");
        }

        const user = await userDAO.findOne({ where: { username } });
        if (!user) return CommonResponse.BAD_REQUEST;

        if (user.ownGraph) {
            return badRequetWithMsg(`Không thể chia sẻ do ${username} đã có gia phả của riêng họ!`);
        }

        const existsShare = await shareDAO.findOne({ where: { to: user.id } });
        if (existsShare) {
            if (existsShare.from == loggedInUser.id) {
                return badRequetWithMsg("Bạn đã chia sẻ với người này rồi!");
            }
            return badRequetWithMsg(`Không thể chia sẻ do ${username} đã được người khác chia sẻ trước rồi!`);
        }

        await shareDAO.create({
            id: uuidv4(),
            from: loggedInUser.id,
            to: user.id,
            perm
        });

        return {
            data: {},
            status: 200
        };
    }

    async function changePerm({ userId, perm }: { userId: string, perm: "read" | "write" }, loggedInUser: DetailUser | null): Promise<CHR> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;
        if (!loggedInUser.ownGraph) return CommonResponse.FORBIDDEN;

        const existsShare = await shareDAO.findOne({ where: { from: loggedInUser.id, to: userId } });
        if (!existsShare) {
            return CommonResponse.BAD_REQUEST;
        }

        perm = perm == "write" ? "write" : "read";

        if (existsShare.perm != perm) {
            await shareDAO.update({ perm }, { where: { id: existsShare.id } });
        }

        return {
            data: {},
            status: 200
        };
    }

    async function deleteShare({ userId }: { userId: string }, loggedInUser: DetailUser | null): Promise<CHR> {
        if (!loggedInUser) return CommonResponse.UNAUTHORIZED;
        if (!loggedInUser.ownGraph) return CommonResponse.FORBIDDEN;

        await shareDAO.destroy({ where: { from: loggedInUser.id, to: userId } });

        return {
            data: {},
            status: 200
        };
    }

    return {
        searchUser, shared, addShare, changePerm, deleteShare
    };
}
