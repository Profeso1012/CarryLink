import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

console.log("[Auth] API Client initialized with base URL:", API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Flag and queue to handle concurrent refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor for attaching the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // If the error is 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("[Auth] Received 401 Unauthorized for:", originalRequest.url);
      
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        console.log("[Auth] Refresh in progress, queueing request:", originalRequest.url);
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient.request(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          console.log("[Auth] Attempting token refresh using refresh_token...");
          // We use basic axios here to avoid interceptors
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refresh_token: refreshToken,
          });
          
          if (response.data?.success) {
            const { access_token, refresh_token: newRefreshToken } = response.data.data;
            console.log("[Auth] Token refresh successful. Rotating tokens.");
            
            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", newRefreshToken);
            
            // Process the queue
            processQueue(null, access_token);
            
            // Update original request
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient.request(originalRequest);
          } else {
            throw new Error("Refresh token call returned success: false");
          }
        } catch (refreshError: any) {
          console.error("[Auth] Refresh token call failed:", refreshError.response?.data || refreshError.message);
          
          // Clear queue and storage
          processQueue(refreshError, null);
          
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          
          // Import useAuthStore dynamically to avoid circular dependency
          import("@/store/auth-store").then(({ useAuthStore }) => {
            console.log("[Auth] Logging out user and clearing store");
            useAuthStore.getState().logout();
          });
          
          // Only redirect if not already on the home page
          if (window.location.pathname !== "/") {
            console.warn("[Auth] Redirecting to login page");
            window.location.href = "/";
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        console.warn("[Auth] No refresh token found in storage, forcing logout");
        // No refresh token available, logout immediately
        import("@/store/auth-store").then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
        });
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
      }
    }
    
    return Promise.reject(error);
  }
);
