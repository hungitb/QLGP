import type { AxiosResponse } from "axios";

type ApiResponseWrapper<K extends object> = [
  data: {
    [attr in keyof K]?: K[attr];
  } & { msg?: string },
  status: number
];

export const useBackend = process.env.QLGP_USE_BACKEND == "true";

export function wrapAxiosCall(
  callback: () => Promise<AxiosResponse>
): Promise<[data: any, status: number]> {
  return new Promise((resolve) => {
    callback()
      .then((response) => resolve([response.data, response.status]))
      .catch((error) => {
        if (error.response) {
          resolve([error.response.data, error.response.status]);
        }
        resolve([null, 0]); // Network error treat return code as 0
      });
  });
}

export type { ApiResponseWrapper };
