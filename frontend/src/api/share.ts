import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  wrapGetApi,
  wrapPostApi,
} from "./utils";
import getShareController from "../../../backend/src/controller/share";
import { userDAO, wrapApi } from "../../../backend/src/DAO/fake/FakeDAO";

const shareController = getShareController(userDAO);

export const shareApi = wrapApi({
  shared: wrapGetApi<typeof shareController.shared>(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/share"));
    }

    return await shareController.shared({
      body: {},
      query: data,
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  addShare: wrapPostApi<typeof shareController.addShare>(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.post("/share", data));
    }

    return await shareController.addShare({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  updateShare: wrapPostApi<typeof shareController.updateShare>(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.patch("/share", data));
    }

    return await shareController.updateShare({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  deleteShare: wrapGetApi<typeof shareController.deleteShare>(async (data) => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.delete("/share", { params: data }));
    }

    return await shareController.deleteShare({
      body: {},
      query: data,
      user: await getLoggedInUserLocalStorage(),
    });
  }),
});
