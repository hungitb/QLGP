
import type { Request, Response, NextFunction } from "express";

import { userDAO, shareDAO } from "../DAO";
import {  DetailUser, type ControllerHandlerResult as CHR } from "../controller/utils";

export async function getLoggedInUser(req: Request): Promise<DetailUser | null> {
    const sessionToken = req.cookies?.sessionToken;
    if (!sessionToken) return null;

    const now = Date.now();

    const user = await userDAO.findOne({ where: { sessionToken } });
    console.log(user)
    if (!user || !user.sessionExpiry || user.sessionExpiry < now) {
        return null;
    }

    const sessionDurationMiliseconds = parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;
    
    if (user.sessionExpiry - now < 0.8*sessionDurationMiliseconds) {
        user.sessionExpiry = now + sessionDurationMiliseconds;
        userDAO.update({
            sessionExpiry: user.sessionExpiry
        }, {
            where: { id: user.id }
        });
    }

    if (user.ownGraph) return Object.assign(user, { ownGraph: true } as const);

    const share = await shareDAO.findOne({ where: { to: user.id } });
    if (!share) {
        return Object.assign(user, { ownGraph: false, useGraphOfUserId: undefined } as const);
    }

    return Object.assign(user, { ownGraph: false, useGraphOfUserId: share.from, perm: share.perm } as const);
}

export function wrapHandlerSimple(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
    return (req: Request, res: Response, next: NextFunction) => {
        fn(req, res, next).catch(next);
    }
}

export function wrapHandlerAdvance<T extends {
    [method: string]: (data: any, loggedInUser: DetailUser | null) => Promise<CHR<any>>
}, K extends keyof T>(controller: T, method: K) {
    return wrapHandlerSimple(async (req, res) => {
        const user = await getLoggedInUser(req);
        const { data, status } = await controller[method](req.body, user);
        res.status(status).json(data);
    });
}
