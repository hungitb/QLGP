
import type { Request, Response, NextFunction } from "express";

import { userDAO } from "../DAO/database";
import type { User } from "../../../general/model/User";

export async function getLoggedInUser(req: Request) {
    const sessionToken = req.cookies?.sessionToken;
    if (!sessionToken) return null;

    const user = await userDAO.findOne({ where: { sessionToken } });
    if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) {
        return null;
    }

    user.sessionExpiry = Date.now() + parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;
    userDAO.update({
        sessionExpiry: user.sessionExpiry
    }, {
        where: { userId: user.userId }
    })

    return user;
}

export function wrapHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    }
}
