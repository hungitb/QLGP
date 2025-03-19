
import { Router } from "express";

import { userDAO, shareDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getShareController from "../controller/share";

const router = Router();
const shareController = getShareController(shareDAO, userDAO);

router.get("/search", wrapHandlerAdvance(shareController, "searchUser"));
router.get("/", wrapHandlerAdvance(shareController, "shared"));
router.post("/", wrapHandlerAdvance(shareController, "addShare"));
router.patch("/", wrapHandlerAdvance(shareController, "changePerm"));
router.delete("/", wrapHandlerAdvance(shareController, "deleteShare"));

export default router;
