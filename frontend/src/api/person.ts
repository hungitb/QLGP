import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
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
      return wrapAxiosCall(() => api.get("/person/all", { params: data }));
    }

    return await personController.getAllPeopleBaseInfo(
      stringifyValuesOfObject(data),
      await getLoggedInUserLocalStorage()
    );
  },
  async getPersonDetailInfo(data: { id: string }) {
    if (useBackend) {
      return wrapAxiosCall(() => api.get("/person/detail", { params: data }));
    }
    return await personController.getPersonDetailInfo(
      stringifyValuesOfObject(data) as { id: string },
      await getLoggedInUserLocalStorage()
    );
  },
  async getFamilyTreeInfo(data: { subjectId?: string; level: number }) {
    if (useBackend) {
      return wrapAxiosCall(() => api.get("/person/tree", { params: data }));
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
      return wrapAxiosCall(() => api.post("/person", data));
    }

    return await personController.createPerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async deletePerson(data: { id: string }) {
    if (useBackend) {
      return wrapAxiosCall(() => api.delete("/person", { params: data }));
    }

    return await personController.deletePerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async updatePerson(data: Partial<Person> & { id: string }) {
    if (useBackend) {
      return wrapAxiosCall(() => api.patch("/person", data));
    }

    return await personController.updatePerson(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async statistic() {
    if (useBackend) {
      return wrapAxiosCall(() => api.get("/person/statistic"));
    }

    return await personController.statistic(
      {},
      await getLoggedInUserLocalStorage()
    );
  },
};
