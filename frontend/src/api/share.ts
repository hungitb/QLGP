import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  getLoggedInUserLocalStorage,
  stringifyValuesOfObject,
} from "./utils";
import getShareController from "../../../backend/src/controller/share";
import {
  shareDAO,
  userDAO,
  wrapApi,
} from "../../../backend/src/DAO/fake/FakeDAO";

const shareController = getShareController(shareDAO, userDAO);

export const shareApi = wrapApi({
  async searchUser(data: { username: string }) {
    if (useBackend) {
      return await wrapAxiosCall(() =>
        api.get("/share/search", { params: data })
      );
    }

    return await shareController.searchUser(
      stringifyValuesOfObject(data) as { username: string },
      await getLoggedInUserLocalStorage()
    );
  },
  async shared() {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/share"));
    }

    return await shareController.shared(
      {},
      await getLoggedInUserLocalStorage()
    );
  },
  async addShare(data: { username: string; perm: "read" | "write" }) {
    if (useBackend) {
      return await wrapAxiosCall(() => api.post("/share", data));
    }

    return await shareController.addShare(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async changePerm(data: { userId: string; perm: "read" | "write" }) {
    if (useBackend) {
      return await wrapAxiosCall(() => api.patch("/share", data));
    }

    return await shareController.changePerm(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
  async deleteShare(data: { userId: string }) {
    if (useBackend) {
      return await wrapAxiosCall(() => api.delete("/share", { params: data }));
    }

    return await shareController.deleteShare(
      data,
      await getLoggedInUserLocalStorage()
    );
  },
});
