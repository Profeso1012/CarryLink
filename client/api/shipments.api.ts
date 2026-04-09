import { apiClient } from "@/lib/api-client";

export interface ShipmentImage {
  id: string;
  url: string;
  display_order: number;
  uploaded_at: string;
}

export interface ShipmentRequest {
  id: string;
  sender_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  pickup_deadline: string;
  delivery_deadline: string;
  item_description: string;
  item_category_id: string;
  item_category_name: string;
  declared_weight_kg: number;
  offered_price: number;
  currency: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string;
  pickup_address?: string;
  delivery_address?: string;
  special_instructions?: string;
  status: "under_review" | "open" | "matched" | "in_transit" | "delivered" | "completed" | "cancelled" | "disputed";
  is_prohibited_check_passed: boolean;
  requires_admin_review: boolean;
  created_at: string;
  updated_at: string;
  images: ShipmentImage[];
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    avatar_url?: string;
    trust_score: number;
  };
}

export interface CreateShipmentRequest {
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  pickup_deadline: string;
  delivery_deadline: string;
  item_description: string;
  item_category_id: string;
  declared_weight_kg: number;
  offered_price: number;
  currency: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_email: string;
  pickup_address?: string;
  delivery_address?: string;
  special_instructions?: string;
}

export interface ShipmentFilters {
  origin_country?: string;
  destination_country?: string;
  origin_city?: string;
  destination_city?: string;
  pickup_deadline_from?: string;
  pickup_deadline_to?: string;
  delivery_deadline_from?: string;
  delivery_deadline_to?: string;
  item_category_id?: string;
  min_weight?: number;
  max_weight?: number;
  min_price?: number;
  max_price?: number;
  currency?: string;
  limit?: number;
  offset?: number;
}

export interface ShipmentsResponse {
  requests: ShipmentRequest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export const shipmentsApi = {
  // Create shipment with images
  create: async (data: CreateShipmentRequest, images?: File[]): Promise<ShipmentRequest> => {
    const formData = new FormData();
    
    // Append all text fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Append images if provided
    if (images && images.length > 0) {
      images.forEach(image => {
        formData.append('images', image);
      });
    }
    
    const response = await apiClient.post("/shipments", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Get shipments with filters
  getAll: async (filters?: ShipmentFilters): Promise<ShipmentsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await apiClient.get(`/shipments?${params.toString()}`);
    return response.data.data;
  },

  // Get single shipment by ID
  getById: async (id: string): Promise<ShipmentRequest> => {
    const response = await apiClient.get(`/shipments/${id}`);
    return response.data.data;
  },

  // Get current user's shipments
  getMine: async (limit?: number, offset?: number): Promise<ShipmentsResponse> => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await apiClient.get(`/shipments/mine?${params.toString()}`);
    return response.data.data;
  },

  // Update shipment
  update: async (id: string, data: Partial<CreateShipmentRequest>): Promise<ShipmentRequest> => {
    const response = await apiClient.patch(`/shipments/${id}`, data);
    return response.data.data;
  },

  // Cancel shipment
  cancel: async (id: string): Promise<ShipmentRequest> => {
    const response = await apiClient.delete(`/shipments/${id}`);
    return response.data.data;
  },

  // Add images to existing shipment
  addImages: async (id: string, images: File[]): Promise<{ images: ShipmentImage[] }> => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('images', image);
    });
    
    const response = await apiClient.post(`/shipments/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  // Delete specific image
  deleteImage: async (shipmentId: string, imageId: string): Promise<void> => {
    await apiClient.delete(`/shipments/${shipmentId}/images/${imageId}`);
  },

  // Check prohibited items
  checkProhibited: async (description: string, categoryId?: string): Promise<{
    is_prohibited: boolean;
    is_allowed: boolean;
    requires_review: boolean;
    message: string;
    matched_items?: string[];
  }> => {
    const response = await apiClient.post("/items/check-prohibited", {
      item_description: description,
      item_category_id: categoryId,
    });
    return response.data.data;
  },
};