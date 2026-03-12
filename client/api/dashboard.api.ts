import { apiClient } from "@/lib/api-client";

export interface DashboardStats {
  active_shipments: number;
  completed_deliveries: number;
  wallet_balance: number;
  trust_score: number;
  pending_kyc: boolean;
}

export interface RecentBooking {
  id: string;
  status: "pending_payment" | "payment_held" | "in_transit" | "delivered" | "disputed";
  route: string;
  traveler_name?: string;
  sender_name?: string;
  created_at: string;
  expected_delivery?: string;
  tracking_id: string;
}

export interface TravelerRecommendation {
  id: string;
  user: {
    first_name: string;
    last_name: string;
    profile?: {
      avatar_url?: string;
    };
  };
  route: {
    origin_city: string;
    origin_country: string;
    destination_city: string;
    destination_country: string;
  };
  departure_date: string;
  price_per_kg: number;
  available_weight: number;
  trust_score: number;
  completed_deliveries: number;
}

export interface WalletBalance {
  available_balance: number;
  pending_balance: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit" | "escrow_hold" | "escrow_release";
  amount: number;
  currency: string;
  description: string;
  created_at: string;
  booking_id?: string;
}

export const dashboardApi = {
  // Get dashboard overview stats
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get("/users/dashboard-stats");
    return response.data.data;
  },

  // Get recent bookings/shipments
  getRecentBookings: async (limit = 5): Promise<RecentBooking[]> => {
    const response = await apiClient.get(`/bookings?limit=${limit}&sort=created_at:desc`);
    return response.data.data;
  },

  // Get traveler recommendations based on user's location/preferences
  getTravelerRecommendations: async (limit = 4): Promise<TravelerRecommendation[]> => {
    // Use the regular travel listings endpoint with filters instead of non-existent recommendations
    const response = await apiClient.get(`/travel-listings?limit=${limit}&status=active`);
    return response.data.data.listings || response.data.data;
  },

  // Get wallet balance
  getWalletBalance: async (): Promise<WalletBalance> => {
    const response = await apiClient.get("/wallet/balance");
    return response.data.data;
  },

  // Get wallet transactions
  getWalletTransactions: async (limit = 10): Promise<WalletTransaction[]> => {
    const response = await apiClient.get(`/wallet/transactions?limit=${limit}`);
    return response.data.data;
  },

  // Get user's shipments with filtering
  getMyShipments: async (status?: string): Promise<RecentBooking[]> => {
    const params = new URLSearchParams();
    if (status && status !== "all") {
      params.append("status", status);
    }
    const response = await apiClient.get(`/shipments/mine?${params.toString()}`);
    return response.data.data;
  },

  // Get user's travel listings
  getMyTrips: async (): Promise<any[]> => {
    const response = await apiClient.get("/travel-listings/mine");
    return response.data.data;
  },

  // Get matches for user's shipments
  getMyMatches: async (type: "senders" | "travelers"): Promise<any[]> => {
    // For now, return empty array since we need specific shipment/listing IDs for the matching endpoints
    // This should be called with specific IDs from the shipments/listings pages
    return [];
  },

  // Get notifications
  getNotifications: async (unread_only = false): Promise<any[]> => {
    const params = unread_only ? "?unread=true" : "";
    const response = await apiClient.get(`/notifications${params}`);
    return response.data.data;
  },

  // Mark notification as read
  markNotificationRead: async (notificationId: string): Promise<void> => {
    await apiClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.put("/notifications/read-all");
  }
};