import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  role: "user" | "admin" | "superadmin";
  kyc_status: "not_started" | "pending" | "under_review" | "approved" | "rejected" | "expired";
  email_verified: boolean;
  phone_verified: boolean;
  profile?: {
    avatar_url: string | null;
    country_of_residence: string;
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
      setUser: (user) => set({ user, isAuthenticated: !!user }),
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
