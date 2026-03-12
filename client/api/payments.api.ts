import { apiClient } from "@/lib/api-client";

export interface PaymentInitiateResponse {
  provider: "paystack" | "stripe" | "flutterwave";
  payment_url?: string; // Paystack redirect URL
  reference?: string; // Paystack reference
  client_secret?: string; // Stripe client secret
  publishable_key?: string; // Stripe key
  amount: number;
  currency: string;
}

export interface PayoutAccount {
  id: string;
  provider: "paystack" | "stripe" | "flutterwave";
  bank_name: string;
  account_number_masked: string;
  account_name: string;
  currency: string;
  country: string;
  is_default: boolean;
  is_verified: boolean;
}

export interface WalletBalance {
  available: number;
  pending_release: number;
  held_in_dispute: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  type: "escrow_hold" | "escrow_release" | "platform_fee" | "refund" | "withdrawal" | "deposit" | "bonus";
  amount: number;
  currency: string;
  description: string;
  booking_id?: string;
  created_at: string;
  status: "pending" | "completed" | "failed";
}

export interface WithdrawalResponse {
  withdrawal_reference: string;
  amount: number;
  currency: string;
  new_balance: number;
  status: string;
  estimated_arrival: string;
}

export const paymentsApi = {
  // Initiate payment for a booking
  initiatePayment: async (
    bookingId: string,
    provider: "paystack" | "stripe" | "flutterwave",
    returnUrl?: string
  ): Promise<PaymentInitiateResponse> => {
    const response = await apiClient.post(`/payments/initiate/${bookingId}`, {
      payment_provider: provider,
      return_url: returnUrl || `${window.location.origin}/account/bookings/${bookingId}/payment-return`,
    });
    return response.data.data;
  },

  // Verify payment status
  verifyPayment: async (bookingId: string, reference: string): Promise<{ status: string; booking_id: string }> => {
    const response = await apiClient.get(`/payments/verify/${bookingId}?reference=${reference}`);
    return response.data.data;
  },

  // Get wallet balance
  getWalletBalance: async (): Promise<WalletBalance> => {
    const response = await apiClient.get("/wallet/balance");
    return response.data.data;
  },

  // Get wallet transaction history
  getTransactionHistory: async (limit: number = 20, offset: number = 0): Promise<{ transactions: WalletTransaction[]; total: number }> => {
    const response = await apiClient.get(`/wallet/transactions?limit=${limit}&offset=${offset}`);
    return response.data.data;
  },

  // Verify payout account before saving
  verifyPayoutAccount: async (
    provider: "paystack" | "stripe" | "flutterwave",
    bankCode: string,
    accountNumber: string,
    currency: string,
    country: string
  ): Promise<{ account_name: string; bank_name: string }> => {
    const response = await apiClient.post("/payout-accounts/verify", {
      provider,
      bank_code: bankCode,
      account_number: accountNumber,
      currency,
      country,
    });
    return response.data.data;
  },

  // Save payout account
  savePayoutAccount: async (
    provider: "paystack" | "stripe" | "flutterwave",
    bankCode: string,
    accountNumber: string,
    accountName: string,
    bankName: string,
    currency: string,
    country: string
  ): Promise<PayoutAccount> => {
    const response = await apiClient.post("/payout-accounts", {
      provider,
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName,
      bank_name: bankName,
      currency,
      country,
    });
    return response.data.data;
  },

  // Get all payout accounts
  getPayoutAccounts: async (): Promise<PayoutAccount[]> => {
    const response = await apiClient.get("/payout-accounts");
    return response.data.data.accounts;
  },

  // Delete payout account
  deletePayoutAccount: async (accountId: string): Promise<void> => {
    await apiClient.delete(`/payout-accounts/${accountId}`);
  },

  // Set default payout account
  setDefaultPayoutAccount: async (accountId: string): Promise<PayoutAccount> => {
    const response = await apiClient.put(`/payout-accounts/${accountId}/set-default`);
    return response.data.data;
  },

  // Withdraw funds
  withdraw: async (amount: number, payoutAccountId: string): Promise<WithdrawalResponse> => {
    const response = await apiClient.post("/wallet/withdraw", {
      amount,
      payout_account_id: payoutAccountId,
    });
    return response.data.data;
  },
};
