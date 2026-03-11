import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRequestFormProps {
  matchId: string;
  onSubmit: (amount: number, currency: string) => void;
  isLoading?: boolean;
  suggestedAmount?: number;
  currency?: string;
  onCancel?: () => void;
}

export function PaymentRequestForm({
  matchId,
  onSubmit,
  isLoading = false,
  suggestedAmount = 0,
  currency = "USD",
  onCancel,
}: PaymentRequestFormProps) {
  const [amount, setAmount] = useState<string>(suggestedAmount.toString());
  const [selectedCurrency, setSelectedCurrency] = useState(currency);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!amount || numAmount <= 0) {
      return;
    }
    onSubmit(numAmount, selectedCurrency);
  };

  return (
    <div className="space-y-6 bg-white rounded-sm border border-carry-light/10 shadow-sm p-8">
      <div className="space-y-2">
        <h3 className="text-lg font-bold text-carry-darker flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-carry-light" />
          Send Payment Request
        </h3>
        <p className="text-sm text-gray-500">
          Specify the amount the sender should pay for this shipment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">
            Amount
          </Label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-carry-light font-bold text-lg">
                {selectedCurrency === "USD" ? "$" : "₦"}
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 border-gray-100 focus:border-carry-light text-lg font-bold"
                step="0.01"
                min="0"
                required
              />
            </div>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="px-4 py-2 border border-gray-100 rounded-sm bg-white text-sm font-bold text-carry-darker focus:border-carry-light focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="font-bold uppercase tracking-widest text-xs h-12 border-gray-200 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || isLoading}
            className={cn(
              "bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12",
              !onCancel && "col-span-2"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" /> Send Payment Request
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="p-4 bg-blue-50 rounded-sm flex gap-3">
        <span className="text-[11px] text-blue-700 leading-relaxed">
          💡 Once you send this, the sender will see a payment card in the chat and can pay securely through our platform.
        </span>
      </div>
    </div>
  );
}
