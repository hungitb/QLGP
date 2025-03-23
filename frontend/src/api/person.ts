import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getPersonController, {
  CreatePersonParams,
} from "../../../backend/src/controller/person";
import type { Person } from "../../../backend/src/model/Person";
import { personDAO, wrapApi } from "../../../backend/src/DAO/fake/FakeDAO";
import {
  ControllerHandlerResult as CHR,
  PaginateParams,
} from "../../../backend/src/controller/utils";
import { Event } from "../../../backend/src/controller/event";

const personController = getPersonController(personDAO);

export const personApi = wrapApi({
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
  async analyzeRelationship(data: { id1: string; id2: string }) {
    if (useBackend) {
      return wrapAxiosCall(() =>
        api.get("/person/analyze_relationship", { params: data })
      );
    }

    return await personController.analyzeRelationship(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async getEvents(data: {
    startDate?: string;
    endDate?: string;
    allPeople: boolean;
    personIds?: string;
    eventTypes?: string;
  }): Promise<CHR<{ events: Event[] }>> {
    if (useBackend) {
      return await wrapAxiosCall(() => api.post("/person/events", data));
    }

    return await personController.getEvents(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
});
