import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { cookieUtils } from "./cookie-utils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
const IS_TEST_MODE = import.meta.env.VITE_APP_ENV === "test";

console.log("[Auth] API Client initialized with base URL:", API_BASE_URL);
if (IS_TEST_MODE) {
  console.log("[DEBUG] API Client in TEST mode - request/response logging enabled");
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request logging for test mode AND KYC debugging
apiClient.interceptors.request.use((config) => {
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, {
    params: config.params,
    data: config.data,
  });
  return config;
});

// Response logging for test mode AND KYC debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE ✓] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error(`[API RESPONSE ✗] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

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

// Request interceptor for attaching the token and fixing URL slashes
apiClient.interceptors.request.use(
  (config) => {
    // If URL starts with a slash, remove it to ensure it's relative to baseURL
    // This prevents axios from treating it as an absolute path from the root
    if (config.url?.startsWith("/")) {
      config.url = config.url.substring(1);
    }

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
      
      const refreshToken = cookieUtils.get("refresh_token");
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
            cookieUtils.set("refresh_token", newRefreshToken, 30);
            
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
          cookieUtils.remove("refresh_token");
          
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
