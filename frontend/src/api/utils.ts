import { type AxiosResponse } from "axios";

import { userDAO, shareDAO } from "../../../backend/src/DAO/fake/FakeDAO";
import {
  DetailUser,
  type ControllerHandlerResult as CHR,
} from "../../../backend/src/controller/utils";

export const sessionTokenKeyStoreLoggedInUserInLocalStorage =
  "QLGP.sessionToken";
export const useBackend = process.env.QLGP_USE_BACKEND == "true";

export async function getLoggedInUserLocalStorage(): Promise<DetailUser | null> {
  const sessionToken = localStorage.getItem(
    sessionTokenKeyStoreLoggedInUserInLocalStorage
  );
  if (!sessionToken) {
    return null;
  }

  const user = await userDAO.findOne({ where: { sessionToken } });
  if (!user) {
    return null;
  }

  if (user.ownGraph) return Object.assign(user, { ownGraph: true } as const);

  const share = await shareDAO.findOne({ where: { to: user.id } });
  if (!share) {
    return Object.assign(user, {
      ownGraph: false,
      useGraphOfUserId: undefined,
    } as const);
  }

  return Object.assign(user, {
    ownGraph: false,
    useGraphOfUserId: share.from,
    perm: share.perm,
  } as const);
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
