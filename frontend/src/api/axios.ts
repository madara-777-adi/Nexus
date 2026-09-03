import axios from "axios";

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Resolve and sanitize base URL
const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api/v1";

// Ensure trailing slashes are removed
const cleanBaseUrl = rawBaseUrl.replace(/\/$/, "");

// Export single source of truth for API base URL
export const API_BASE_URL = cleanBaseUrl.endsWith("/api/v1")
  ? cleanBaseUrl
  : `${cleanBaseUrl}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Queue and lock to handle concurrent 401 refresh calls cleanly
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Public helper to trigger a clean token refresh from non-Axios callers
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await api.post("/auth/refresh-token");
    const newAccessToken = res.data.data?.accessToken;
    if (newAccessToken) {
      setAccessToken(newAccessToken);
      return newAccessToken;
    }
    return null;
  } catch (error) {
    setAccessToken(null);
    return null;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          return api(originalRequest);
        } else {
          processQueue(error, null);
          window.location.href = "/login";
          return Promise.reject(error);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        if (refreshError?.response?.status === 401) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
