import { apiClient } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  country_of_residence?: string;
  city?: string;
  date_of_birth?: string;
  trust_score: number;
  updated_at: string;
}

export interface UserBadge {
  type: string;
  name: string;
  description: string;
  awarded_at: string;
}

export interface FullUserProfile {
  id: string;
  email: string;
  phone_number?: string;
  role: string;
  status: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  kyc_status: "not_started" | "pending" | "under_review" | "approved" | "rejected" | "expired";
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
  badges: UserBadge[];
}

export interface PublicProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  country_of_residence?: string;
  city?: string;
  trust_score: number;
  kyc_status: string;
  join_date: string;
  total_deliveries: number;
  average_rating: number;
  review_count: number;
  badges: UserBadge[];
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  country_of_residence?: string;
  city?: string;
  date_of_birth?: string;
}

export interface PushTokenRequest {
  token: string;
  platform: "ios" | "android" | "web";
  device_id?: string;
}

export const usersApi = {
  // Get current user's full profile
  getMyProfile: async (): Promise<FullUserProfile> => {
    const response = await apiClient.get("/users/me");
    return response.data.data;
  },

  // Update current user's profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await apiClient.put("/users/me", data);
    return response.data.data;
  },

  // Upload avatar - now takes a Cloudinary URL instead of a file
  uploadAvatar: async (avatarUrl: string): Promise<{ avatar_url: string; profile: UserProfile }> => {
    const response = await apiClient.post("/users/me/avatar", {
      avatar_url: avatarUrl,
    });
    return response.data.data;
  },

  // Get public profile
  getPublicProfile: async (userId: string): Promise<PublicProfile> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data.data;
  },

  // Get current user's badges
  getBadges: async (): Promise<UserBadge[]> => {
    const response = await apiClient.get("/users/me/badges");
    return response.data.data;
  },

  // Register push token
  registerPushToken: async (data: PushTokenRequest): Promise<void> => {
    await apiClient.post("/users/push-token", data);
  },
};
