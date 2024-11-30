import { type AxiosResponse } from "axios";

import { userDAO } from "./DAO";
import { type ControllerHandlerResult as CHR } from "../../../backend/src/controller/utils";

export const sessionTokenKeyStoreLoggedInUserInLocalStorage =
  "QLGP.sessionToken";
export const useBackend = process.env.QLGP_USE_BACKEND == "true";

export async function getLoggedInUserLocalStorage() {
  const sessionToken = localStorage.getItem(
    sessionTokenKeyStoreLoggedInUserInLocalStorage
  );
  if (!sessionToken) {
    return null;
  }

  return await userDAO.findOne({ where: { sessionToken } });
}

export function wrapAxiosCall(
  callback: () => Promise<AxiosResponse>
): Promise<CHR<Record<string, any>>> {
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
): { [attr in keyof K]?: string } {
  const newObj: Record<string, any> = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v?.toString) {
      newObj[k] = v.toString();
    }
  });
  return newObj;
}
