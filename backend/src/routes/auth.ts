
import { Router } from "express";

import { userDAO } from "../DAO/database";
import { getLoggedInUser, wrapHandler } from "./utils";
import getAuthController from "../../../general/controller/auth";

const router = Router();
const authController = getAuthController(userDAO);

router.get("/me", wrapHandler(async (req, res) => {
    const user = await getLoggedInUser(req);
    res.status(200).json({ user });
}));

router.post("/login", wrapHandler(async (req, res) => {
    const [data, status] = await authController.login(req.body, null);
    if (status == 200) {
        const { sessionToken } = data as { sessionToken: string };
        delete (data as { sessionToken?: string }).sessionToken;
        res.cookie("sessionToken", sessionToken, { httpOnly: true });
    }
    res.status(status).json(data);
}));

router.post("/register", wrapHandler(async (req, res) => {
    const [data, status] = await authController.register(req.body, null);
    res.status(status).json(data);
}));

router.post("/logout", wrapHandler(async (req, res) => {
    res.clearCookie("sessionToken");
    const [data, status] = await authController.logout(req.body, null);
    res.status(status).json(data);
}));

export default router;
