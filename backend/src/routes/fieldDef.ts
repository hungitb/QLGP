import { Router } from "express";

import { fieldDefDAO, fieldValDAO, personDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getFieldDefController from "../controller/fieldDef";

const router = Router();
const fieldDefController = getFieldDefController(fieldDefDAO, fieldValDAO, personDAO);

router.get("/", wrapHandlerAdvance(fieldDefController.getAllFieldDefs));
router.post("/", wrapHandlerAdvance(fieldDefController.createFieldDef));
router.patch("/", wrapHandlerAdvance(fieldDefController.updateFieldDef));
router.delete("/", wrapHandlerAdvance(fieldDefController.deleteFieldDef));

export default router;
