
import type { Request, Response, NextFunction } from "express";

import { userDAO } from "../DAO";
import {  type ControllerHandlerResult as CHR } from "../controller/utils";
import { User } from "../model/User";

export async function getLoggedInUser(req: Request) {
    const sessionToken = req.cookies?.sessionToken;
    if (!sessionToken) return null;

    const user = await userDAO.findOne({ where: { sessionToken } });
    if (!user || !user.sessionExpiry || user.sessionExpiry < Date.now()) {
        return null;
    }

    user.sessionExpiry = Date.now() + parseInt(process.env.QLGP_SESSION_DURATION || "30")*60*1000;
    await userDAO.update({
        sessionExpiry: user.sessionExpiry
    }, {
        where: { id: user.id }
    });

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
