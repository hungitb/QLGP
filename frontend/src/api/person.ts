import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
  wrapGetApi,
  wrapPostApi,
} from "./utils";
import getPersonController, {
  CreatePersonParams,
} from "../../../backend/src/controller/person";
import type { Person } from "../../../backend/src/model/Person";
import {
  personDAO,
  ttgpDASO,
  userDAO,
  wrapApi,
} from "../../../backend/src/DAO/fake/FakeDAO";
import {
  ControllerHandlerResult as CHR,
  PaginateParams,
} from "../../../backend/src/controller/utils";
import { Event } from "../../../backend/src/controller/event";

const personController = getPersonController(personDAO, userDAO, ttgpDASO, null as any);

export const personApi = wrapApi({
  getAllPeopleBaseInfo: wrapGetApi<
    typeof personController.getAllPeopleBaseInfo
  >(async (data) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.get("/person/all", { params: data }));
    }

    return await personController.getAllPeopleBaseInfo({
      body: {},
      query: stringifyValuesOfObject(data),
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  getPersonDetailInfo: wrapGetApi<typeof personController.getPersonDetailInfo>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() => api.get("/person/detail", { params: data }));
      }
      return await personController.getPersonDetailInfo({
        body: {},
        query: stringifyValuesOfObject(data),
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  getFamilyTreeInfo: wrapGetApi<typeof personController.getFamilyTreeInfo>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() => api.get("/person/tree", { params: data }));
      }

      return await personController.getFamilyTreeInfo({
        body: {},
        query: stringifyValuesOfObject(data),
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  createPerson: wrapPostApi<typeof personController.createPerson>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() => api.post("/person", data));
      }

      return await personController.createPerson({
        body: data,
        query: {},
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  deletePerson: wrapGetApi<typeof personController.deletePerson>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() => api.delete("/person", { params: data }));
      }

      return await personController.deletePerson({
        body: {},
        query: data,
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  updatePerson: wrapPostApi<typeof personController.updatePerson>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() => api.patch("/person", data));
      }

      return await personController.updatePerson({
        body: data,
        query: {},
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  statistic: wrapGetApi<typeof personController.statistic>(async () => {
    if (useBackend) {
      return wrapAxiosCall(() => api.get("/person/statistic"));
    }

    return await personController.statistic({
      body: {},
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  analyzeRelationship: wrapGetApi<typeof personController.analyzeRelationship>(
    async (data) => {
      if (useBackend) {
        return wrapAxiosCall(() =>
          api.get("/person/analyze_relationship", { params: data })
        );
      }

      return await personController.analyzeRelationship({
        body: {},
        query: stringifyValuesOfObject(data),
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  getEvents: wrapPostApi<typeof personController.getEvents>(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.post("/person/events", data));
    }

    return await personController.getEvents({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  updateThongTinGiaPha: wrapPostApi<
    typeof personController.updateThongTinGiaPha
  >(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() =>
        api.post("/person/thong_tin_gia_pha", data)
      );
    }

    return await personController.updateThongTinGiaPha({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  swapYoungnessLevel: wrapPostApi<
    typeof personController.swapYoungnessLevel
  >(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() =>
        api.post("/person/swap_youngness_level", data)
      );
    }

    return await personController.swapYoungnessLevel({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
});
