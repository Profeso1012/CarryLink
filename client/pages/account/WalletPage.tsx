import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MoreVertical,
  DollarSign,
  TrendingUp,
  Banknote
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Transaction {
  id: string;
  type: "credit" | "debit" | "withdrawal" | "escrow_hold" | "escrow_release";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  description: string;
  created_at: string;
}

interface WalletBalance {
  available_balance: number;
  pending_escrow: number;
  currency: string;
}

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  const styles: Record<Transaction["type"], { icon: any, bg: string, color: string }> = {
    credit: { icon: ArrowDownLeft, bg: "bg-green-50", color: "text-green-500" },
    escrow_release: { icon: ArrowDownLeft, bg: "bg-green-50", color: "text-green-500" },
    debit: { icon: ArrowUpRight, bg: "bg-red-50", color: "text-red-500" },
    withdrawal: { icon: ArrowUpRight, bg: "bg-red-50", color: "text-red-500" },
    escrow_hold: { icon: Clock, bg: "bg-amber-50", color: "text-amber-500" }
  };

  const { icon: Icon, bg, color } = styles[type] || styles.credit;

  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bg)}>
      <Icon className={cn("w-5 h-5", color)} />
    </div>
  );
}

export default function WalletPage() {
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");

  const { data: balanceData, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/balance");
      return response.data.data as WalletBalance;
    }
  });

  const { data: transactions, isLoading: isTxLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const response = await apiClient.get("/wallet/transactions");
      return response.data.data as Transaction[];
    }
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: any) => apiClient.post("/wallet/withdraw", data),
    onSuccess: () => {
      toast.success("Withdrawal request submitted successfully!");
      setWithdrawalAmount("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Withdrawal failed");
    }
  });

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    withdrawalMutation.mutate({
      amount: parseFloat(withdrawalAmount),
      bank_account: bankAccount,
      bank_name: bankName
    });
  };

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Financial Wallet</h2>
            <p className="text-gray-500">Manage your earnings, escrow funds, and withdrawals.</p>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-carry-darker border-none shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-carry-light/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <CardContent className="p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-carry-light/20 flex items-center justify-center text-carry-light">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Available Balance</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white tracking-tighter">
                  {isBalanceLoading ? "---" : `${balanceData?.available_balance.toFixed(2)}`}
                </span>
                <span className="text-lg font-bold text-carry-light">{balanceData?.currency || "USD"}</span>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-white/40">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Active Monetization</span>
                </div>
                <span className="text-xs font-bold text-white/60">Verified</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                  <Clock className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-carry-muted">Pending Escrow</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-carry-darker tracking-tighter">
                  {isBalanceLoading ? "---" : `${balanceData?.pending_escrow.toFixed(2)}`}
                </span>
                <span className="text-sm font-bold text-gray-400">{balanceData?.currency || "USD"}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
                Funds currently held in secure escrow for your active deliveries. Will be released upon delivery confirmation.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-carry-bg border-carry-light/10 shadow-sm overflow-hidden md:col-span-2 lg:col-span-1">
            <CardHeader className="p-6 pb-2 border-none">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-carry-muted flex items-center gap-2">
                <Banknote className="w-4 h-4 text-carry-light" />
                Quick Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <form onSubmit={handleWithdrawal} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-[10px] font-bold uppercase tracking-tighter text-gray-500">Amount to Withdraw</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="0.00" 
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    className="h-9 text-sm font-bold bg-white"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!withdrawalAmount || withdrawalMutation.isPending || (balanceData?.available_balance || 0) <= 0}
                  className="w-full bg-carry-darker text-white font-bold h-10 text-[11px] uppercase tracking-widest hover:bg-carry-dark"
                >
                  {withdrawalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Initiate Payout"}
                </Button>
                <p className="text-[9px] text-gray-400 text-center font-bold tracking-tight uppercase">
                  Processed via Local Bank Transfer
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Transaction History</h3>
            <Button variant="ghost" size="sm" className="text-carry-light font-bold text-xs uppercase tracking-widest">
              Export CSV
            </Button>
          </div>

          <div className="overflow-x-auto">
            {isTxLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Transaction</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date / Time</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <TransactionIcon type={tx.type} />
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-carry-darker text-[14px]">{tx.description}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Ref: {tx.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none",
                          tx.status === "completed" ? "bg-green-100 text-green-700" : 
                          tx.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {tx.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-carry-darker">{new Date(tx.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-[15px] text-carry-darker">
                        {tx.type === "debit" || tx.type === "withdrawal" || tx.type === "escrow_hold" ? "-" : "+"}
                        {tx.amount.toFixed(2)} <span className="text-[10px] text-gray-400">{tx.currency}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No transactions yet</h3>
                <p className="text-gray-500 max-w-sm">Your financial activity will appear here once you start using the platform for deliveries and payments.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
