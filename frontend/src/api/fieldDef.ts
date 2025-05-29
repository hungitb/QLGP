import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  wrapGetApi,
  wrapPostApi,
} from "./utils";
import getFieldDefController from "../../../backend/src/controller/fieldDef";
import {
  fieldDefDAO,
  fieldValDAO,
  personDAO,
  userDAO,
  wrapApi,
} from "../../../backend/src/DAO/fake/FakeDAO";

const fieldDefController = getFieldDefController(
  fieldDefDAO,
  fieldValDAO,
  personDAO
);

export const fieldDefApi = wrapApi({
  getAllFieldDefs: wrapGetApi<typeof fieldDefController.getAllFieldDefs>(
    async (data) => {
      if (useBackend) {
        return await wrapAxiosCall(() => api.get("/field_def"));
      }

      return await fieldDefController.getAllFieldDefs({
        body: {},
        query: data,
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  createFieldDef: wrapPostApi<typeof fieldDefController.createFieldDef>(
    async (data) => {
      if (useBackend) {
        return await wrapAxiosCall(() => api.post("/field_def", data));
      }

      return await fieldDefController.createFieldDef({
        body: data,
        query: {},
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  updateFieldDef: wrapPostApi<typeof fieldDefController.updateFieldDef>(
    async (data) => {
      if (useBackend) {
        return await wrapAxiosCall(() => api.patch("/field_def", data));
      }

      return await fieldDefController.updateFieldDef({
        body: data,
        query: {},
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
  deleteFieldDef: wrapGetApi<typeof fieldDefController.deleteFieldDef>(
    async (data) => {
      if (useBackend) {
        return await wrapAxiosCall(() =>
          api.delete("/field_def", { params: data })
        );
      }

      return await fieldDefController.deleteFieldDef({
        body: {},
        query: data,
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
});

export const fieldValApi = wrapApi({
  updateFieldVal: wrapPostApi<typeof fieldDefController.updateFieldVal>(
    async (data) => {
      if (useBackend) {
        return await wrapAxiosCall(() => api.patch("/field_val", data));
      }

      return await fieldDefController.updateFieldVal({
        body: data,
        query: {},
        user: await getLoggedInUserLocalStorage(),
      });
    }
  ),
});
