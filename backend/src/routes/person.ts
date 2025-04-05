
import { Router } from "express";

import { personDAO, ttgpDASO, userDAO } from "../DAO";
import getPersonController from "../controller/person";
import { wrapHandlerAdvance } from "./utils";
const router = Router();
const personController = getPersonController(personDAO, userDAO, ttgpDASO);

router.post("", wrapHandlerAdvance(personController.createPerson));
router.delete("", wrapHandlerAdvance(personController.deletePerson));
router.patch("", wrapHandlerAdvance(personController.updatePerson));
router.get("/all", wrapHandlerAdvance(personController.getAllPeopleBaseInfo));
router.get("/detail", wrapHandlerAdvance(personController.getPersonDetailInfo));
router.get("/tree", wrapHandlerAdvance(personController.getFamilyTreeInfo));
router.get("/statistic", wrapHandlerAdvance(personController.statistic));
router.get("/analyze_relationship", wrapHandlerAdvance(personController.analyzeRelationship));
// Không dùng GET, vì nếu truy vấn theo person IDs có thể sẽ quá dài
router.post("/events", wrapHandlerAdvance(personController.getEvents));

export default router;
