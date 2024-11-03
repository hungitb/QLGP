import api from "./api";
import { useBackend, wrapAxiosCall } from "./utils";
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

    const sessionToken = localStorage.getItem("QLGP.sessionToken");
    if (!sessionToken) {
      return [{ user: null }, 200];
    }

    const user = await userDAO.findOne({ where: { sessionToken } });
    if (!user) {
      return [{ user: null }, 200];
    }

    return [{ user }, 200];
  },
  login: async (data: {
    username: string;
    password: string;
  }): Promise<ARW<{ msg: string }>> => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/login", data));
    }

    const [d, status] = await authController.login(data, null);
    if (status == 200) {
      const { sessionToken } = d as { sessionToken: string };
      delete (d as { sessionToken?: string }).sessionToken;
      localStorage.setItem("QLGP.sessionToken", sessionToken);
    }

    return [d, status];
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

    localStorage.removeItem("QLGP.sessionToken");
    return await authController.logout({}, null);
  },
};
