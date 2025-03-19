
import { Router } from "express";

import { personDAO } from "../DAO";
import { canWriteGraphGuard, hasGraphGuard, wrapHandlerAdvance } from "./utils";
import getPersonController from "../controller/person";

const router = Router();
const personController = getPersonController(personDAO);

router.post("", wrapHandlerAdvance(personController, "createPerson", canWriteGraphGuard));
router.delete("", wrapHandlerAdvance(personController, "deletePerson", canWriteGraphGuard));
router.patch("", wrapHandlerAdvance(personController, "updatePerson", canWriteGraphGuard));
router.get("/all", wrapHandlerAdvance(personController, "getAllPeopleBaseInfo", hasGraphGuard));
router.get("/detail", wrapHandlerAdvance(personController, "getPersonDetailInfo", hasGraphGuard));
router.get("/tree", wrapHandlerAdvance(personController, "getFamilyTreeInfo", hasGraphGuard));
router.get("/statistic", wrapHandlerAdvance(personController, "statistic", hasGraphGuard));
router.get("/analyze_relationship", wrapHandlerAdvance(personController, "analyzeRelationship", hasGraphGuard));

export default router;
