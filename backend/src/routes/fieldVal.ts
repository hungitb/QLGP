import { Router } from "express";

import { fieldDefDAO, fieldValDAO, personDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getFieldDefController from "../controller/fieldDef";

const fieldValRouter = Router();
const fieldDefController = getFieldDefController(fieldDefDAO, fieldValDAO, personDAO);

fieldValRouter.patch("/", wrapHandlerAdvance(fieldDefController.updateFieldVal));

export default fieldValRouter;