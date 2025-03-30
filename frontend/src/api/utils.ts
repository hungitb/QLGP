import { type AxiosResponse } from "axios";

import { userDAO } from "../../../backend/src/DAO/fake/FakeDAO";
import {
  ControllerHandler,
  type ControllerHandlerResult as CHR,
} from "../../../backend/src/controller/utils";
import { User } from "../../../backend/src/model/User";

export const sessionTokenKeyStoreLoggedInUserInLocalStorage =
  "QLGP.sessionToken";
export const useBackend = process.env.QLGP_USE_BACKEND == "true";

export async function getLoggedInUserLocalStorage(): Promise<User | null> {
  const sessionToken = localStorage.getItem(
    sessionTokenKeyStoreLoggedInUserInLocalStorage
  );
  if (!sessionToken) {
    return null;
  }

  const user = await userDAO.findOne({ where: { sessionToken } });
  return user;
}

export function wrapGetApi<T extends ControllerHandler<any, any, any>>(
  handler: (data: Parameters<T>[0]["query"]) => ReturnType<T>
) {
  return handler;
}

export function wrapPostApi<T extends ControllerHandler<any, any, any>>(
  handler: (data: Parameters<T>[0]["body"]) => ReturnType<T>
) {
  return handler;
}

export function wrapAxiosCall(
  callback: () => Promise<AxiosResponse>
): Promise<CHR<any>> {
  return new Promise((resolve) => {
    callback()
      .then((response) =>
        resolve({ data: response.data, status: response.status })
      )
      .catch((error) => {
        if (error.response) {
          resolve({ data: error.response.data, status: error.response.status });
        }
        resolve({ data: {}, status: 0 }); // Network error treat return code as 0
      });
  });
}

// Khi dùng fake API cho get, cần chuyển value sang dạng string cho nhất quán
export function stringifyValuesOfObject<K extends Record<string, any>>(
  obj: K
): {
  [attr in keyof K]: K[attr] extends NonNullable<K[attr]> ? string : undefined;
} {
  const newObj: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v?.toString) {
      newObj[k] = v.toString();
    }
  });
  return newObj as any;
}
