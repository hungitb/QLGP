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
      return await wrapAxiosCall(() => api.get("/share/shared"));
    }

    return await shareController.shared(
      {},
      await getLoggedInUserLocalStorage()
    );
  },
});
