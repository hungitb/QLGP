
import { Router } from "express";

import { personDAO, ttgpDASO, userDAO } from "../DAO";
import { getLoggedInUser, wrapHandlerAdvance, wrapHandlerSimple } from "./utils";
import getAuthController from "../controller/auth";
import { UserInfo } from "../controller/utils";

const router = Router();
const authController = getAuthController(userDAO);

router.get("/me", wrapHandlerSimple(async (req, res) => {
    const user = await getLoggedInUser(req);
    var userInfo: UserInfo | null = null;

    if (user) {
        userInfo = {
            id: user.id,
            username: user.username,
            permission: user.permission,
            thongTinGiaPha: await ttgpDASO.get()
        };
    }

    res.status(200).json({ user: userInfo });
}));

router.post("/login", wrapHandlerSimple(async (req, res) => {
    const { data, status } = await authController.login({
        user: null,
        query: req.query,
        body: req.body
    });
    if (status == 200) {
        const { sessionToken } = data as { sessionToken: string };
        delete (data as { sessionToken?: string }).sessionToken;
        res.cookie("sessionToken", sessionToken, { httpOnly: true });
    }
    res.status(status).json(data);
}));

router.post("/logout", wrapHandlerSimple(async (req, res) => {
    res.clearCookie("sessionToken");
    const { data, status } = await authController.logout({
        user: null,
        query: req.query,
        body: req.body
    });
    res.status(status).json(data);
}));

router.post("/change-password", wrapHandlerAdvance(authController.changePassword));

export default router;
