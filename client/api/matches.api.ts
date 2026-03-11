import { apiClient } from "@/lib/api-client";

export interface TravelerProfile {
  id: string;
  display_name: string;
  trust_score: number;
  total_deliveries_as_traveler: number;
  badges?: string[];
}

export interface TravelListing {
  id: string;
  traveler: TravelerProfile;
  departure_date: string;
  origin_city: string;
  destination_city: string;
  available_capacity_kg: number;
  price_per_kg: number;
  flat_fee?: number | null;
  currency: string;
  is_verified_flight: boolean;
}

export interface SenderProfile {
  id: string;
  display_name: string;
  trust_score: number;
}

export interface ShipmentRequestData {
  id: string;
  sender: SenderProfile;
  sender_display_name: string;
  destination_city: string;
  declared_weight_kg: number;
}

export interface Match {
  match_id: string;
  match_score: number;
  status: string;
  conversation_id?: string;
  expires_at?: string;
  initiated_by: "system" | "sender" | "traveler";
  travel_listing?: TravelListing;
  shipment_request?: ShipmentRequestData;
  payment_requested_amount?: number | null;
}

export interface MatchesResponse {
  matches: Match[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SenderRequestPayload {
  listing_id: string;
  shipment_id: string;
  message?: string;
}

export interface TravelerOfferPayload {
  shipment_id: string;
  listing_id: string;
  message?: string;
}

export interface SenderRequestResponse {
  success: boolean;
  data: {
    match_id: string;
    status: string;
    listing: {
      id: string;
      traveler_display_name: string;
      departure_date: string;
    };
    message: string;
  };
}

export interface TravelerOfferResponse {
  success: boolean;
  data: {
    match_id: string;
    status: string;
    shipment: {
      id: string;
      sender_display_name: string;
      destination_city: string;
    };
    message: string;
  };
}

export interface MatchAcceptResponse {
  success: boolean;
  data: {
    match_id: string;
    status: string;
    conversation_id: string;
    message: string;
  };
}

export interface MatchRejectPayload {
  reason?: string;
}

export interface MatchRejectResponse {
  success: boolean;
  data: {
    match_id: string;
    status: string;
  };
}

export interface PaymentRequestPayload {
  amount: number;
  currency: string;
}

export interface PaymentRequestResponse {
  success: boolean;
  data: {
    match_id: string;
    booking_id: string;
    conversation_id: string;
    amount: number;
    currency: string;
    status: string;
    message: string;
  };
}

export interface MatchCancelPayload {
  reason?: string;
}

export interface MatchCancelResponse {
  success: boolean;
  data: {
    match_id: string;
    status: string;
  };
}

export const matchesApi = {
  // Sender initiates a match with a traveler
  senderRequest: async (payload: SenderRequestPayload): Promise<SenderRequestResponse> => {
    const response = await apiClient.post("/api/v1/matches/sender-request", payload);
    return response.data;
  },

  // Traveler initiates a match with a sender
  travelerOffer: async (payload: TravelerOfferPayload): Promise<TravelerOfferResponse> => {
    const response = await apiClient.post("/api/v1/matches/traveler-offer", payload);
    return response.data;
  },

  // Accept a match (either party accepts the approach)
  accept: async (matchId: string): Promise<MatchAcceptResponse> => {
    const response = await apiClient.post(`/api/v1/matches/${matchId}/accept`);
    return response.data;
  },

  // Reject a match
  reject: async (matchId: string, payload: MatchRejectPayload): Promise<MatchRejectResponse> => {
    const response = await apiClient.post(`/api/v1/matches/${matchId}/reject`, payload);
    return response.data;
  },

  // Request payment (traveler sends payment request)
  requestPayment: async (matchId: string, payload: PaymentRequestPayload): Promise<PaymentRequestResponse> => {
    const response = await apiClient.post(`/api/v1/matches/${matchId}/request-payment`, payload);
    return response.data;
  },

  // Cancel a match
  cancel: async (matchId: string, payload: MatchCancelPayload): Promise<MatchCancelResponse> => {
    const response = await apiClient.post(`/api/v1/matches/${matchId}/cancel`, payload);
    return response.data;
  },

  // Get matches for a shipment
  getForShipment: async (shipmentId: string, options?: {
    page?: number;
    limit?: number;
    min_score?: number;
    status?: string;
  }): Promise<MatchesResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.min_score) params.append("min_score", options.min_score.toString());
    if (options?.status) params.append("status", options.status);

    const response = await apiClient.get(
      `/api/v1/matches/for-shipment/${shipmentId}?${params.toString()}`
    );
    return response.data.data;
  },

  // Get matches for a listing
  getForListing: async (listingId: string, options?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<MatchesResponse> => {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.status) params.append("status", options.status);

    const response = await apiClient.get(
      `/api/v1/matches/for-listing/${listingId}?${params.toString()}`
    );
    return response.data.data;
  },
};
