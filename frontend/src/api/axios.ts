import axios from "axios";

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => inMemoryAccessToken;

// Resolve base URL from env with fallback to production backend + /api/v1 prefix
const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://api.nexusspace.tech";

const baseURL = rawBaseUrl.endsWith("/api/v1")
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/$/, "")}/api/v1`;

const api = axios.create({
  baseURL,
  withCredentials: true, // Crucial for sending/receiving HttpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach in-memory access token if available
api.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: Silently refresh access token on 401 response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Avoid infinite loops on auth endpoints or already retried requests
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh-token") &&
      !originalRequest.url?.includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        // Trigger token refresh using HttpOnly cookie automatically
        const res = await api.post("/auth/refresh-token");
        const newAccessToken = res.data.data?.accessToken;

        if (newAccessToken) {
          setAccessToken(newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // Retry original request with fresh token
          return api(originalRequest);
        }
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;