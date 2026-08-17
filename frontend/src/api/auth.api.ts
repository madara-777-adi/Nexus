import api, { setAccessToken } from "./axios";

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  termsAccepted: true;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  password?: string;
}

export interface UpdateUserProfilePayload {
  firstName?: string;
  lastName?: string;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  login: async (payload: LoginPayload) => {
    const response = await api.post("/auth/login", payload);
    if (response.data.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("/auth/refresh-token");
    if (response.data.data?.accessToken) {
      setAccessToken(response.data.data.accessToken);
    }
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateUserProfile: async (payload: UpdateUserProfilePayload) => {
    const response = await api.patch("/auth/me", payload);
    return response.data;
  },

  forgotPassword: async (payload: ForgotPasswordPayload) => {
    const response = await api.post("/auth/forgot-password", payload);
    return response.data;
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    const response = await api.post("/auth/reset-password", payload);
    return response.data;
  },


  changePassword: async (payload: ChangePasswordPayload) => {
    const response = await api.post("/auth/change-password", payload);
    return response.data;
  },

  deleteAccount: async (payload: DeleteAccountPayload) => {
    const response = await api.delete("/auth/me", { data: payload });
    setAccessToken(null);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
    }
  },
};