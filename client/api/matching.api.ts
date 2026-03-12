import { apiClient } from "@/lib/api-client";

export interface Match {
  match_id: string;
  match_score: number;
  status: string;
  conversation_id?: string;
  expires_at?: string;
  initiated_by: string;
  travel_listing?: {
    id: string;
    traveler: {
      id: string;
      display_name: string;
      trust_score: number;
      total_deliveries_as_traveler: number;
      badges: string[];
    };
    departure_date: string;
    origin_city: string;
    destination_city: string;
    available_capacity_kg: number;
    price_per_kg: number;
    flat_fee?: number;
    currency: string;
    is_verified_flight: boolean;
  };
  shipment_request?: {
    id: string;
    sender: {
      id: string;
      display_name: string;
      trust_score: number;
      total_shipments_as_sender: number;
      badges: string[];
    };
    pickup_deadline: string;
    origin_city: string;
    destination_city: string;
    declared_weight_kg: number;
    offered_price: number;
    currency: string;
    item_description: string;
    images?: { url: string }[];
  };
  payment_requested_amount?: number;
}

export interface MatchesResponse {
  matches: Match[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export const matchingApi = {
  // Get matches for a specific shipment
  getMatchesForShipment: async (
    shipmentId: string,
    params?: {
      page?: number;
      limit?: number;
      min_score?: number;
      status?: string;
    }
  ): Promise<MatchesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.min_score) searchParams.append("min_score", params.min_score.toString());
    if (params?.status) searchParams.append("status", params.status);

    const response = await apiClient.get(
      `matches/for-shipment/${shipmentId}?${searchParams.toString()}`
    );
    return response.data.data;
  },

  // Get matches for a specific travel listing
  getMatchesForListing: async (
    listingId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<MatchesResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.status) searchParams.append("status", params.status);

    const response = await apiClient.get(
      `matches/for-listing/${listingId}?${searchParams.toString()}`
    );
    return response.data.data;
  },

  // Get all matches for user's shipments (aggregated)
  getAllMatchesForMyShipments: async (limit = 4): Promise<Match[]> => {
    try {
      // First get user's shipments
      const shipmentsResponse = await apiClient.get("shipments/mine");
      const shipments = shipmentsResponse.data.data.requests || [];
      
      // Get matches for each shipment and aggregate
      const allMatches: Match[] = [];
      for (const shipment of shipments.slice(0, 3)) { // Limit to first 3 shipments to avoid too many requests
        try {
          const matchesResponse = await matchingApi.getMatchesForShipment(shipment.id, { limit: 2 });
          if (matchesResponse && matchesResponse.matches) {
            allMatches.push(...matchesResponse.matches);
          }
        } catch (error) {
          // Continue if one fails
          console.warn(`Failed to get matches for shipment ${shipment.id}:`, error);
        }
      }
      
      return allMatches.slice(0, limit);
    } catch (error) {
      console.warn('Failed to get matches for shipments:', error);
      return [];
    }
  },

  // Get all matches for user's travel listings (aggregated)
  getAllMatchesForMyListings: async (limit = 4): Promise<Match[]> => {
    try {
      // First get user's travel listings
      const listingsResponse = await apiClient.get("travel-listings/mine");
      const listings = listingsResponse.data.data.listings || listingsResponse.data.data || [];
      
      // Get matches for each listing and aggregate
      const allMatches: Match[] = [];
      for (const listing of listings.slice(0, 3)) { // Limit to first 3 listings to avoid too many requests
        try {
          const matchesResponse = await matchingApi.getMatchesForListing(listing.id, { limit: 2 });
          if (matchesResponse && matchesResponse.matches) {
            allMatches.push(...matchesResponse.matches);
          }
        } catch (error) {
          // Continue if one fails
          console.warn(`Failed to get matches for listing ${listing.id}:`, error);
        }
      }
      
      return allMatches.slice(0, limit);
    } catch (error) {
      console.warn('Failed to get matches for listings:', error);
      return [];
    }
  },

  // Sender request match
  senderRequest: async (data: {
    travel_listing_id: string;
    shipment_request_id: string;
    message?: string;
  }) => {
    const response = await apiClient.post("matches/sender-request", data);
    return response.data.data;
  },

  // Traveler offer match
  travelerOffer: async (data: {
    shipment_request_id: string;
    travel_listing_id: string;
    message?: string;
  }) => {
    const response = await apiClient.post("matches/traveler-offer", data);
    return response.data.data;
  },

  // Accept match
  acceptMatch: async (matchId: string) => {
    const response = await apiClient.post(`matches/${matchId}/accept`);
    return response.data.data;
  },

  // Reject match
  rejectMatch: async (matchId: string, reason?: string) => {
    const response = await apiClient.post(`matches/${matchId}/reject`, { reason });
    return response.data.data;
  },

  // Request payment
  requestPayment: async (matchId: string, data: {
    amount: number;
    currency: string;
    message?: string;
  }) => {
    const response = await apiClient.post(`matches/${matchId}/request-payment`, data);
    return response.data.data;
  },

  // Cancel match
  cancelMatch: async (matchId: string, reason?: string) => {
    const response = await apiClient.post(`matches/${matchId}/cancel`, { reason });
    return response.data.data;
  }
};