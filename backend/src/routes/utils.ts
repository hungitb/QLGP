
import type { Request, Response, NextFunction } from "express";

import { userDAO, shareDAO } from "../DAO";
import {  DetailUser, type ControllerHandlerResult as CHR } from "../controller/utils";

export async function getLoggedInUser(req: Request): Promise<DetailUser | null> {
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
}, K extends keyof T>(controller: T, method: K, ...guards: Guard[]) {
    return wrapHandlerSimple(async (req, res) => {
        const user = await getLoggedInUser(req);

        for (let i = 0; i < guards.length; i++) {
            const result = await guards[i].check({ loggedInUser: user });
            if (result) {
                const { status, data } = result;
                res.status(status).json(data);
                return;
            }
        }

        const { data, status } = await controller[method](req.body, user);
        res.status(status).json(data);
    });
}

type GuardInput = {
    loggedInUser: DetailUser | null;
}

class Guard {
    readonly check: (data: GuardInput) => Promise<{ status: number, data: Record<string, any> } | void>;
    constructor(check: (data: GuardInput) => Promise<{ status: number, data: Record<string, any> } | void>) {
        this.check = check;
    }
}

export const hasGraphGuard = new Guard(async ({ loggedInUser }) => {
    if (!loggedInUser) {
        return {
            status: 401,
            data: { msg: "Unauthorized" }
        };
    }
    if (!loggedInUser.ownGraph && !loggedInUser.useGraphOfUserId) {
        return {
            status: 403,
            data: { msg: "Forbidden" }
        };
    }
});

export const canWriteGraphGuard = new Guard(async ({ loggedInUser }) => {
    if (!loggedInUser) {
        return {
            status: 401,
            data: { msg: "Unauthorized" }
        };
    }
    if (!loggedInUser.ownGraph) {
        if (!loggedInUser.useGraphOfUserId || loggedInUser.perm != "write") {
            return {
                status: 403,
                data: { msg: "Forbidden" }
            };
        }
    }
});
