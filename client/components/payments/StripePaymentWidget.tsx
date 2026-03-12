import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { paymentsApi } from "@/api/payments.api";
import { apiClient } from "@/lib/api-client";

interface StripePaymentWidgetProps {
  bookingId: string;
  amount: number;
  currency: string;
  onSuccess?: () => void;
}

export default function StripePaymentWidget({
  bookingId,
  amount,
  currency,
  onSuccess,
}: StripePaymentWidgetProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cardNumber || !cardExpiry || !cardCvc || !cardholder) {
      setError("Please fill in all card details");
      return;
    }

    try {
      setIsProcessing(true);

      // This is a simplified flow - in production, you'd use Stripe Elements/Payment Element
      // For now, we're simulating a token creation and payment confirmation
      const response = await apiClient.post(`/bookings/${bookingId}/confirm-payment`, {
        amount,
        currency,
        card: {
          number: cardNumber.replace(/\s/g, ""),
          exp_month: parseInt(cardExpiry.split("/")[0]),
          exp_year: parseInt("20" + cardExpiry.split("/")[1]),
          cvc: cardCvc,
          holder_name: cardholder,
        },
      });

      if (response.data.success) {
        toast.success("Payment processed successfully!");
        // Clear form
        setCardNumber("");
        setCardExpiry("");
        setCardCvc("");
        setCardholder("");
        onSuccess?.();
      } else {
        setError(response.data.data?.message || "Payment failed");
      }
    } catch (err: any) {
      console.error("Stripe payment error:", err);
      setError(err.response?.data?.message || "Payment processing failed. Please try again.");
      toast.error("Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-600 uppercase">Cardholder Name</label>
        <Input
          type="text"
          placeholder="John Doe"
          value={cardholder}
          onChange={(e) => setCardholder(e.target.value)}
          className="h-12"
          disabled={isProcessing}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-600 uppercase">Card Number</label>
        <Input
          type="text"
          placeholder="4111 1111 1111 1111"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
          maxLength={19}
          className="h-12 font-mono"
          disabled={isProcessing}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">Expiry Date</label>
          <Input
            type="text"
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            maxLength={5}
            className="h-12 font-mono"
            disabled={isProcessing}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-600 uppercase">CVC</label>
          <Input
            type="text"
            placeholder="123"
            value={cardCvc}
            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
            maxLength={4}
            className="h-12 font-mono"
            disabled={isProcessing}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isProcessing}
        className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12 uppercase tracking-widest text-xs"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          `Pay ${amount.toFixed(2)} ${currency}`
        )}
      </Button>

      <p className="text-[10px] text-gray-400 text-center font-medium">
        Your payment is secure and encrypted. No card details are stored.
      </p>
    </form>
  );
}
