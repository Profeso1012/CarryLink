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
    const response = await apiClient.post("/kyc/initiate", data);
    return response.data;
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
