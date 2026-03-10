import { apiClient } from "@/lib/api-client";

export interface KYCStatusResponse {
  success: boolean;
  data: {
    status: "not_started" | "pending" | "under_review" | "approved" | "rejected" | "expired";
    kyc_id?: string;
    id_type?: string;
    id_country?: string;
    rejection_reason?: string | null;
    expires_at?: string;
    message?: string;
    created_at?: string;
    updated_at?: string;
  };
}

export interface InitiateKYCResponse {
  success: boolean;
  message: string;
  data: {
    kyc_id: string;
    session_id: string;
    verification_url: string;
    session_token: string;
    supported_countries: Array<{
      code: string;
      name: string;
      provider: string;
    }>;
  };
}

export const kycApi = {
  initiate: async (data: {
    id_type: string;
    id_country: string;
    id_number?: string;
  }): Promise<InitiateKYCResponse> => {
    console.log("[KYC DEBUG] Initiating KYC with data:", data);
    console.log("[KYC DEBUG] Request headers will include:", {
      Authorization: `Bearer ${localStorage.getItem('access_token')?.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    });
    
    try {
      const response = await apiClient.post("/kyc/initiate", data);
      console.log("[KYC DEBUG] KYC initiate success:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("[KYC DEBUG] KYC initiate failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  },

  getStatus: async (): Promise<KYCStatusResponse> => {
    const response = await apiClient.get("/kyc/status");
    return response.data;
  },

  submit: async (data: {
    id_type: string;
    id_country: string;
    id_number?: string;
  }) => {
    const response = await apiClient.post("/kyc/submit", data);
    return response.data;
  },
};
