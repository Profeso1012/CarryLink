import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string | null;
  role: "user" | "admin" | "superadmin";
  kyc_status: "not_started" | "pending" | "under_review" | "approved" | "rejected" | "expired";
  is_email_verified: boolean;  // Changed from email_verified to is_email_verified
  is_phone_verified: boolean;  // Changed from phone_verified to is_phone_verified
  trust_score?: number;
  profile?: {
    country_of_residence: string;
    avatar_url?: string;
  };
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => {
        console.log("[AUTH STORE DEBUG] Setting user:", user);
        if (user) {
          console.log("[AUTH STORE DEBUG] User email_verified:", user.email_verified);
          console.log("[AUTH STORE DEBUG] User is_email_verified:", user.is_email_verified);
        }
        if (user && user.profile?.avatar_url && !user.avatar_url) {
          user.avatar_url = user.profile.avatar_url;
        }
        set({ user, isAuthenticated: !!user });
      },
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          // Call backend logout API to revoke tokens
          import("@/lib/api-client").then(({ apiClient }) => {
            apiClient.post("/auth/logout", { refresh_token: refreshToken }).catch(() => {
              // If logout API fails, still clear local storage
              console.warn("Backend logout failed, clearing local storage anyway");
            });
          });
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
