
import { Router } from "express";

import { personDAO } from "../DAO";
import { wrapHandlerAdvance } from "./utils";
import getPersonController from "../controller/person";

const router = Router();
const personController = getPersonController(personDAO);

router.post("", wrapHandlerAdvance(personController, "createPerson"));
router.delete("", wrapHandlerAdvance(personController, "deletePerson"));
router.patch("", wrapHandlerAdvance(personController, "updatePerson"));
router.get("/all", wrapHandlerAdvance(personController, "getAllPeopleBaseInfo"));
router.get("/detail", wrapHandlerAdvance(personController, "getPersonDetailInfo"));
router.get("/tree", wrapHandlerAdvance(personController, "getFamilyTreeInfo"));
router.get("/statistic", wrapHandlerAdvance(personController, "statistic"));
router.get("/analyze_relationship", wrapHandlerAdvance(personController, "analyzeRelationship"));

export default router;
