import React from "react";
import { CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaymentRequestMessageProps {
  bookingId: string;
  amount: number;
  currency: string;
  paymentStatus?: string;
  isMine: boolean;
  isProcessing?: boolean;
  onPayClick: (bookingId: string) => void;
}

export function PaymentRequestMessage({
  bookingId,
  amount,
  currency,
  paymentStatus,
  isMine,
  isProcessing = false,
  onPayClick,
}: PaymentRequestMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[80%] w-full flex flex-col",
        isMine ? "ml-auto items-end" : "mr-auto items-start"
      )}
    >
      <div
        className={cn(
          "rounded-md shadow-sm overflow-hidden",
          isMine ? "bg-carry-light/10 border border-carry-light" : "bg-white border border-carry-light/10"
        )}
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard
              className={cn(
                "w-5 h-5",
                isMine ? "text-carry-darker" : "text-carry-light"
              )}
            />
            <span className={cn("font-bold text-[13px]", isMine ? "text-carry-darker" : "text-carry-darker")}>
              Payment Request
            </span>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-gray-500 font-bold uppercase">Amount</span>
              <div className="text-right">
                <div className="text-2xl font-black text-carry-light">
                  {currency === "USD" ? "$" : "₦"}
                  {amount.toFixed(2)}
                </div>
                <span className="text-[9px] text-gray-400 font-bold uppercase">
                  {currency || "USD"}
                </span>
              </div>
            </div>
          </div>

          {paymentStatus === "completed" ? (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[12px] font-bold uppercase">Payment Complete</span>
            </div>
          ) : !isMine ? (
            <Button
              onClick={() => onPayClick(bookingId)}
              disabled={isProcessing}
              className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12 text-sm uppercase tracking-widest"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                </>
              )}
            </Button>
          ) : (
            <div className="text-center p-3 bg-gray-50 rounded-md">
              <span className="text-[11px] text-gray-500 font-bold uppercase">
                Awaiting payment from sender
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
