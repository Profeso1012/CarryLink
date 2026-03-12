import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentsApi } from "@/api/payments.api";

interface PaystackButtonProps {
  bookingId: string;
  isLoading?: boolean;
}

export default function PaystackButton({ bookingId, isLoading = false }: PaystackButtonProps) {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      const response = await paymentsApi.initiatePayment(bookingId, "paystack");
      
      if (response.payment_url) {
        // Redirect to Paystack checkout
        window.location.href = response.payment_url;
      } else {
        toast.error("Failed to generate payment URL");
      }
    } catch (error: any) {
      console.error("Paystack payment error:", error);
      toast.error(error.response?.data?.message || "Failed to initiate Paystack payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading || isProcessing}
      className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold h-12 uppercase tracking-widest text-xs"
    >
      {isProcessing || isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Processing...
        </>
      ) : (
        "Pay with Paystack"
      )}
    </Button>
  );
}
