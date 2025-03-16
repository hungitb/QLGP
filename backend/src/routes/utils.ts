
import type { Request, Response, NextFunction } from "express";

import { userDAO } from "../DAO";
import {  type ControllerHandlerResult as CHR } from "../controller/utils";
import { User } from "../model/User";

export async function getLoggedInUser(req: Request) {
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
        userDAO.update({
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

export function wrapHandlerAdvance<T extends {
    [method: string]: (data: any, loggedInUser: User | null) => Promise<CHR<any>>
}, K extends keyof T>(controller: T, method: K) {
    return wrapHandlerSimple(async (req, res) => {
        const user = await getLoggedInUser(req);
        const { data, status } = await controller[method](req.body, user);
        res.status(status).json(data);
    });
}
