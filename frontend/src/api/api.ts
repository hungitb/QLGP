import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const pathname = window.location.pathname;
      // Check cho chắc thôi, có thể sẽ không xảy ra
      if (pathname != "/auth/login") {
        if (pathname == "/") {
          window.location.href = "/auth/login";
        } else {
          window.location.href = "/auth/login?next=" + pathname;
        }
      }
      return;
    }
    return Promise.reject(error);
  }
);

export default api;
