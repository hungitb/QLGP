
import { Router } from "express";

import { personDAO, eventSettingDAO } from "../DAO";
import { canWriteGraphGuard, hasGraphGuard, wrapHandlerAdvance } from "./utils";
import getEventController from "../controller/event";

const router = Router();
const eventController = getEventController(eventSettingDAO, personDAO);

router.patch("", wrapHandlerAdvance(eventController, "updateEventSetting", canWriteGraphGuard));
router.get("/all", wrapHandlerAdvance(eventController, "getEvents", hasGraphGuard));

export default router;
