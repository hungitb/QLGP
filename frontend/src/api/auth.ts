import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  sessionTokenKeyStoreLoggedInUserInLocalStorage,
  getLoggedInUserLocalStorage,
} from "./utils";
import type { ApiResponseWrapper as ARW } from "./utils";
import getAuthController from "../../../general/controller/auth";
import { userDAO } from "./DAO";

const authController = getAuthController(userDAO);

export const authApi = {
  getLoggedInUser: async (): Promise<
    ARW<{ user: { username: string } | null }>
  > => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/auth/me"));
    }

    return {
      data: { user: await getLoggedInUserLocalStorage() },
      status: 200,
    };
  },
  login: async (data: {
    username: string;
    password: string;
  }): Promise<ARW<{ msg: string }>> => {
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
  }): Promise<ARW<{ msg: string }>> => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/register", data));
    }

    return await authController.register(data, null);
  },
  logout: async (): Promise<ARW<{ msg: string }>> => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/logout"));
    }

    localStorage.removeItem(sessionTokenKeyStoreLoggedInUserInLocalStorage);
    return await authController.logout({}, null);
  },
};
