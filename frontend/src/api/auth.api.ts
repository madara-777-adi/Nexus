import api from "./axios";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await api.post("/auth/login", payload);
    if (response.data.data?.accessToken) {
      localStorage.setItem("accessToken", response.data.data.accessToken);
      localStorage.setItem("refreshToken", response.data.data.refreshToken);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      await api.post("/auth/logout", { refreshToken });
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};