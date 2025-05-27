import { Router } from "express";

import { fieldDefDAO, fieldValDAO, personDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getFieldDefController from "../controller/fieldDef";

const router = Router();
const fieldDefController = getFieldDefController(fieldDefDAO, fieldValDAO, personDAO);

router.get("/", wrapHandlerAdvance(fieldDefController.getAllFieldDefs));

export default router;
