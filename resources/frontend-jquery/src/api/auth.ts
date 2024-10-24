
import restAPI from "./restAPI"

const useBackend = (process.env.QLGP_USE_BACKEND == "true")

export const authAPI = {
  getLoggedInUser: (data = {}) => {
    if (useBackend) {
        return restAPI("/api/auth/get_user", data)
    }
  },
  logIn: (data = {}) => {
    if (useBackend) {
        return restAPI("/api/auth/login", data)
    }
  },
  logOut: (data = {}) => {
    if (useBackend) {
        return restAPI("/api/auth/logout", data)
    }
  },
  signUp: (data = {}) => {
    if (useBackend) {
        return restAPI("/api/auth/signup", data)
    }
  }
}
