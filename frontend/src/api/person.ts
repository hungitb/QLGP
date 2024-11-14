import api from "./api";
import {
  useBackend,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getPersonController from "../../../general/controller/person";
import type { Person } from "../../../general/model/Person";
import { personDAO } from "./DAO";
import { PaginateParams } from "../../../general/controller/utils";

const personController = getPersonController(personDAO);

export const personApi = {
  async getAllPeopleBaseInfo(data: PaginateParams = {}) {
    if (useBackend) {
      // to do
    }

    return await personController.getAllPeopleBaseInfo(
      stringifyValuesOfObject(data),
      await getLoggedInUserLocalStorage()
    );
  },
  async getFamilyTreeInfo(data: { targetPersonId?: string; level: number }) {
    if (useBackend) {
      // to do
    }

    return await personController.getFamilyTreeInfo(
      stringifyValuesOfObject(data) as {
        targetPersonId?: string;
        level: string;
      },
      await getLoggedInUserLocalStorage()
    );
  },
};
