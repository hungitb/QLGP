import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  sessionTokenKeyStoreLoggedInUserInLocalStorage,
  getLoggedInUserLocalStorage,
} from "./utils";
import getAuthController from "../../../backend/src/controller/auth";
import {
  userDAO,
  personDAO,
  wrapApi,
} from "../../../backend/src/DAO/fake/FakeDAO";
import { Gender } from "../../../backend/src/model/Person";
import {
  ControllerHandlerResult as CHR,
  DetailUser,
} from "../../../backend/src/controller/utils";

const authController = getAuthController(userDAO, personDAO);

export const authApi = wrapApi({
  getLoggedInUser: async (): Promise<CHR<{ user: DetailUser | null }>> => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/auth/me"));
    }

    return {
      data: { user: await getLoggedInUserLocalStorage() },
      status: 200,
    };
  },
  login: async (data: { username: string; password: string }) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/login", data));
    }

    const response = await authController.login(data, null);
    if (response.status == 200) {
      const { sessionToken } = response.data;
      delete response.data.sessionToken;
      localStorage.setItem(
        sessionTokenKeyStoreLoggedInUserInLocalStorage,
        sessionToken || ""
      );
    }

    return response;
  },
  register: async (data: {
    username: string;
    password: string;
    fullname: string;
    gender: Gender;
    ownGraph: boolean;
  }) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/register", data));
    }

    return await authController.register(data, null);
  },
  logout: async () => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/logout"));
    }

    localStorage.removeItem(sessionTokenKeyStoreLoggedInUserInLocalStorage);
    return await authController.logout({}, null);
  },
});
