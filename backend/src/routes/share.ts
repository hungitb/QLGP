
import { Router } from "express";

import { userDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getShareController from "../controller/share";

const router = Router();
const shareController = getShareController(userDAO);

router.get("/", wrapHandlerAdvance(shareController.shared));
router.post("/", wrapHandlerAdvance(shareController.addShare));
router.patch("/", wrapHandlerAdvance(shareController.updateShare));
router.delete("/", wrapHandlerAdvance(shareController.deleteShare));

export default router;
