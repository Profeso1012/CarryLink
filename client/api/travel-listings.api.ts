import { apiClient } from "@/lib/api-client";

export interface TravelListing {
  id: string;
  traveler_id: string;
  traveler: {
    id: string;
    display_name: string;
    avatar_url?: string;
    trust_score: number;
    total_deliveries_as_traveler: number;
    badges: string[];
  };
  status: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  departure_date: string;
  arrival_date: string;
  airline?: string;
  flight_number?: string;
  total_capacity_kg: number;
  available_capacity_kg: number;
  price_per_kg: number;
  flat_fee?: number;
  currency: string;
  notes?: string;
  is_verified_flight: boolean;
  accepted_categories: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
}

export const travelListingsApi = {
  // Browse public listings
  browse: async (params: {
    origin_country?: string;
    destination_country?: string;
    departure_from?: string;
    departure_to?: string;
    min_capacity_kg?: number;
    max_price_per_kg?: number;
    verified_only?: boolean;
    page?: number;
    limit?: number;
    sort?: string;
  }) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const response = await apiClient.get(`travel-listings?${searchParams.toString()}`);
    return response.data;
  },

  // Get single listing
  getById: async (id: string) => {
    const response = await apiClient.get(`travel-listings/${id}`);
    return response.data.data;
  },

  // Get my listings
  getMine: async (params?: { status?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const response = await apiClient.get(`travel-listings/mine?${searchParams.toString()}`);
    return response.data;
  },

  // Create listing
  create: async (data: Partial<TravelListing>) => {
    const response = await apiClient.post("travel-listings", data);
    return response.data.data;
  },

  // Update listing
  update: async (id: string, data: Partial<TravelListing>) => {
    const response = await apiClient.patch(`travel-listings/${id}`, data);
    return response.data.data;
  },

  // Delete listing
  delete: async (id: string) => {
    const response = await apiClient.delete(`travel-listings/${id}`);
    return response.data;
  }
};