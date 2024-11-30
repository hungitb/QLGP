
import { Router } from "express";

import { personDAO, eventSettingDAO } from "../DAO/database";
import { wrapHandlerAdvance } from "./utils";
import getEventController from "../controller/event";

const router = Router();
const eventController = getEventController(eventSettingDAO, personDAO);

router.patch("", wrapHandlerAdvance(eventController, "updateEventSetting"));
router.get("/all", wrapHandlerAdvance(eventController, "getEvents"));

export default router;
