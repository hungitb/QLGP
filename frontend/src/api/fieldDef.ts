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

const fieldDefController = getFieldDefController(fieldDefDAO, fieldValDAO, personDAO);

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
});
