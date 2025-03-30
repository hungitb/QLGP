
import type { Request, Response, NextFunction } from "express";

import { userDAO } from "../DAO";
import {  ControllerHandler, UserInfo } from "../controller/utils";
import type { ThongTinGiaPha, User } from "../model/User";

export async function getLoggedInUser(req: Request): Promise<User | null> {
    const sessionToken = req.cookies?.sessionToken;
    if (!sessionToken) return null;

    const now = Date.now();

    const user = await userDAO.findOne({ where: { sessionToken } });
    if (!user || !user.sessionExpiry || user.sessionExpiry < now) {
        return null;
    }

    const sessionDurationMiliseconds = parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;
    
    if (user.sessionExpiry - now < 0.8*sessionDurationMiliseconds) {
        user.sessionExpiry = now + sessionDurationMiliseconds;
        await userDAO.update({
            sessionExpiry: user.sessionExpiry
        }, {
            where: { id: user.id }
        });
    }

    return user;
}

export function wrapHandlerSimple(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    }
}

export function wrapHandlerAdvance(handler: ControllerHandler<any, any, any, true>) {
    return wrapHandlerSimple(async (req, res) => {
        const user = await getLoggedInUser(req);

        const { data, status } = await handler({
            user,
            query: req.query,
            body: req.body
        });
        res.status(status).json(data);
    });
}
