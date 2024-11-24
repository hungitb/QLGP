import api from "./api";
import {
  useBackend,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getPersonController, {
  CreatePersonParams,
} from "../../../general/controller/person";
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
  async getFamilyTreeInfo(data: { subjectId?: string; level: number }) {
    if (useBackend) {
      // to do
    }

    return await personController.getFamilyTreeInfo(
      stringifyValuesOfObject(data) as {
        subjectId?: string;
        level: string;
      },
      await getLoggedInUserLocalStorage()
    );
  },
  async createPerson(data: CreatePersonParams) {
    if (useBackend) {
      // to do
    }

    return await personController.createPerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async deletePerson(data: { id: string }) {
    if (useBackend) {
      // to do
    }

    return await personController.deletePerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async updatePerson(data: Partial<Person> & { id: string }) {
    if (useBackend) {
      // to do
    }

    return await personController.updatePerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async statistic() {
    if (useBackend) {
      // to do
    }

    return await personController.statistic(
      {},
      await getLoggedInUserLocalStorage()
    );
  },
};
