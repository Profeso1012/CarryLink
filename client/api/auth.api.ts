import { apiClient } from "@/lib/api-client";
import { User } from "@/store/auth-store";
import { cookieUtils } from "@/lib/cookie-utils";

export interface RegisterRequest {
  email: string;
  phone_number: string;
  password?: string; // registration may happen in steps
  first_name: string;
  last_name: string;
  country_of_residence: string;
  recaptcha_token?: string;
  _gotcha?: string; // Honeypot field
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
  };
}

export const authApi = {
  register: async (data: RegisterRequest) => {
    console.log("[AUTH API DEBUG] Sending registration request with data:", data);
    const response = await apiClient.post("/auth/register", data);
    return response.data;
  },

  verifyEmail: async (email: string, otp: string) => {
    const response = await apiClient.post("/auth/verify-email", { email, otp });
    return response.data;
  },

  sendPhoneOTP: async (email: string) => {
    const response = await apiClient.post("/auth/send-phone-otp", { email });
    return response.data;
  },

  verifyPhone: async (email: string, otp: string): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/verify-phone", { email, otp });
    return response.data;
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<{ data: { user: User } }> => {
    const response = await apiClient.get("/users/me");
    return response.data;
  },

  logout: async () => {
    const refresh_token = cookieUtils.get("refresh_token");
    if (refresh_token) {
      await apiClient.post("/auth/logout", { refresh_token });
    }
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (email: string, otp: string, new_password: string) => {
    const response = await apiClient.post("/auth/reset-password", { 
      email, 
      otp, 
      new_password 
    });
    return response.data;
  },

  resendEmailVerification: async (email: string) => {
    const response = await apiClient.post("/auth/resend-email-verification", { email });
    return response.data;
  },
};
