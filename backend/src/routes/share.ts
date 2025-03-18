
import { Router } from "express";

import { userDAO, shareDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getShareController from "../controller/share";

const router = Router();
const shareController = getShareController(shareDAO, userDAO);

router.get("/search", wrapHandlerAdvance(shareController, "searchUser"));
router.get("/shared", wrapHandlerAdvance(shareController, "shared"));

export default router;
