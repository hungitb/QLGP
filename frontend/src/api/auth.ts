import api from "./api";
import {
  useBackend,
  wrapAxiosCall,
  sessionTokenKeyStoreLoggedInUserInLocalStorage,
  getLoggedInUserLocalStorage,
  wrapPostApi,
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
  getThongTinGiaPha,
  UserInfo,
} from "../../../backend/src/controller/utils";
import { ThongTinGiaPha, User } from "../../../backend/src/model/User";

const authController = getAuthController(userDAO);

export const authApi = wrapApi({
  getLoggedInUser: async (): Promise<CHR<{ user: UserInfo | null }>> => {
    if (useBackend) {
      return await wrapAxiosCall(() => api.get("/auth/me"));
    }

    const user = await getLoggedInUserLocalStorage();
    let userInfo: UserInfo | null = null;

    if (user) {
      userInfo = {
        id: user.id,
        username: user.username,
        permission: user.permission,
        thongTinGiaPha: await getThongTinGiaPha(userDAO),
      };
    }

    return {
      data: { user: userInfo },
      status: 200,
    };
  },
  login: wrapPostApi<typeof authController.login>(async (data) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/login", data));
    }

    const response = await authController.login({
      body: data,
      query: {},
      user: null,
    });

    if (response.status == 200 && "sessionToken" in response.data) {
      const { sessionToken } = response.data;
      delete (response.data as any).sessionToken;

      localStorage.setItem(
        sessionTokenKeyStoreLoggedInUserInLocalStorage,
        sessionToken || ""
      );
    }

    return response;
  }),
  logout: wrapPostApi<typeof authController.logout>(async (data) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/logout", data));
    }

    localStorage.removeItem(sessionTokenKeyStoreLoggedInUserInLocalStorage);
    return await authController.logout({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
  changePassword: wrapPostApi<typeof authController.changePassword>(async (data) => {
    if (useBackend) {
      return wrapAxiosCall(() => api.post("/auth/change-password", data));
    }

    return await authController.changePassword({
      body: data,
      query: {},
      user: await getLoggedInUserLocalStorage(),
    });
  }),
});
