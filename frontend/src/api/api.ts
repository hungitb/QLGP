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
      // Check cho chắc thôi, có thể sẽ không xảy ra
      if (window.location.pathname != "/auth/login") {
        window.location.href = "/auth/login?next=" + window.location.pathname;
      }
      return;
    }
    return Promise.reject(error);
  }
);

export default api;
