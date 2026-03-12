import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { paymentsApi } from "@/api/payments.api";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WithdrawModal({ open, onOpenChange }: WithdrawModalProps) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const { data: balance } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => paymentsApi.getWalletBalance(),
    enabled: open,
  });

  const { data: accounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ["payout-accounts"],
    queryFn: () => paymentsApi.getPayoutAccounts(),
    enabled: open,
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      paymentsApi.withdraw(parseFloat(amount), selectedAccountId),
    onSuccess: (data) => {
      toast.success(`Withdrawal initiated! Reference: ${data.withdrawal_reference}`);
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
      onOpenChange(false);
      setAmount("");
      setSelectedAccountId("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to withdraw funds");
    },
  });

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(amount) > (balance?.available || 0)) {
      toast.error("Insufficient balance");
      return;
    }

    if (!selectedAccountId) {
      toast.error("Please select a payout account");
      return;
    }

    withdrawMutation.mutate();
  };

  const selectedAccount = accounts?.find((acc) => acc.id === selectedAccountId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
        <DialogHeader className="p-8 bg-carry-darker text-white">
          <DialogTitle className="text-2xl font-black">Withdraw Funds</DialogTitle>
          <DialogDescription className="text-gray-300">
            Transfer money from your wallet to your bank account
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Available Balance */}
          <div className="bg-carry-bg rounded-sm p-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-carry-muted uppercase tracking-widest">Available to Withdraw</span>
              <span className="text-2xl font-black text-carry-light">
                {balance?.available.toFixed(2)} {balance?.currency}
              </span>
            </div>
          </div>

          {/* Withdrawal Amount */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-carry-light font-bold">
                {balance?.currency}
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 h-12 border-gray-100 focus:border-carry-light"
                min="0"
                step="0.01"
                max={balance?.available.toString()}
                disabled={withdrawMutation.isPending}
              />
            </div>
            {amount && parseFloat(amount) > (balance?.available || 0) && (
              <p className="text-xs text-red-600 font-medium">Amount exceeds available balance</p>
            )}
          </div>

          {/* Payout Account Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">
                Payout Account
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-[10px] font-bold uppercase tracking-widest h-7 px-3"
              >
                Manage Accounts
              </Button>
            </div>

            {isAccountsLoading ? (
              <div className="p-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-carry-light" />
              </div>
            ) : accounts && accounts.length > 0 ? (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a payout account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-carry-darker">{account.bank_name}</span>
                        <span className="text-gray-400 text-sm">{account.account_number_masked}</span>
                        {account.is_default && (
                          <Badge className="bg-green-50 text-green-600 text-[9px] font-bold uppercase tracking-tight border-none px-2 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-6 bg-amber-50 border border-amber-200 rounded-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 mb-2" />
                <p className="text-sm text-amber-800 font-medium mb-3">No payout accounts set up</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  Add a Payout Account
                </Button>
              </div>
            )}
          </div>

          {/* Selected Account Details */}
          {selectedAccount && (
            <div className="p-6 bg-gray-50/50 rounded-sm space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-carry-darker">{selectedAccount.account_name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {selectedAccount.bank_name} • {selectedAccount.account_number_masked}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {selectedAccount.currency} • {selectedAccount.country}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
            <div className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-[11px] text-blue-700 space-y-1">
                <p className="font-bold">Processing time:</p>
                <p>Withdrawals typically arrive within 1-2 business days</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={withdrawMutation.isPending}
            className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWithdraw}
            disabled={
              !amount ||
              !selectedAccountId ||
              parseFloat(amount) <= 0 ||
              parseFloat(amount) > (balance?.available || 0) ||
              withdrawMutation.isPending
            }
            className="flex-1 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12"
          >
            {withdrawMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Withdraw ${amount ? parseFloat(amount).toFixed(2) : "0.00"} ${balance?.currency}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
