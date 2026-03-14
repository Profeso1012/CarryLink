import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { paymentsApi } from "@/api/payments.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  TrendingUp,
  Lock,
  ArrowDownRight,
  ArrowUpLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import WithdrawModal from "@/components/payments/WithdrawModal";
import { toast } from "sonner";

export default function WalletPage() {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  const { data: balance, isLoading: isBalanceLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () => paymentsApi.getWalletBalance(),
  });

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => paymentsApi.getTransactionHistory(),
  });

  const { data: payoutAccounts, isLoading: isAccountsLoading } = useQuery({
    queryKey: ["payout-accounts"],
    queryFn: () => paymentsApi.getPayoutAccounts(),
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "escrow_release":
      case "deposit":
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case "withdrawal":
      case "escrow_hold":
      case "platform_fee":
        return <ArrowUpLeft className="w-4 h-4 text-red-500" />;
      case "bonus":
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      default:
        return <ArrowDownRight className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string, status: string) => {
    if (status === "failed") return "text-red-600";
    if (status === "pending") return "text-amber-600";

    switch (type) {
      case "escrow_release":
      case "deposit":
      case "bonus":
        return "text-green-600";
      case "withdrawal":
      case "escrow_hold":
      case "platform_fee":
      case "refund":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <AccountLayout>
      <div className="space-y-8 max-w-6xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-carry-darker">Wallet & Payouts</h2>
          <p className="text-gray-500 text-sm">Manage your balance, withdraw funds, and view transaction history</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Available Balance */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-carry-light to-carry-light/80 text-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-90">Available Balance</h3>
                <Wallet className="w-5 h-5 opacity-75" />
              </div>
              {isBalanceLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="text-3xl font-black">
                      {balance?.available.toFixed(2)} {balance?.currency || "USD"}
                    </div>
                    <p className="text-[11px] opacity-75 font-medium">Ready to withdraw</p>
                  </div>
                  <Button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="w-full bg-white text-carry-light hover:bg-gray-100 font-bold h-10 uppercase tracking-widest text-xs mt-4"
                  >
                    Withdraw Now
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Release */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-500/80 text-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-90">Pending Release</h3>
                <TrendingUp className="w-5 h-5 opacity-75" />
              </div>
              {isBalanceLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="text-3xl font-black">
                      {balance?.pending_release.toFixed(2)} {balance?.currency || "USD"}
                    </div>
                    <p className="text-[11px] opacity-75 font-medium">From completed deliveries</p>
                  </div>
                  <Button
                    disabled
                    className="w-full bg-white text-amber-600 hover:bg-gray-100 font-bold h-10 uppercase tracking-widest text-xs mt-4 opacity-50 cursor-not-allowed"
                  >
                    Releasing Soon
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Held in Dispute */}
          <Card className="border-none shadow-sm bg-gradient-to-br from-red-500 to-red-500/80 text-white overflow-hidden">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-widest opacity-90">Held in Dispute</h3>
                <Lock className="w-5 h-5 opacity-75" />
              </div>
              {isBalanceLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="text-3xl font-black">
                      {balance?.held_in_dispute.toFixed(2)} {balance?.currency || "USD"}
                    </div>
                    <p className="text-[11px] opacity-75 font-medium">Waiting for resolution</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-white text-white hover:bg-white/10 font-bold h-10 uppercase tracking-widest text-xs mt-4"
                  >
                    View Disputes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payout Accounts */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Payout Accounts</CardTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-[10px] font-bold uppercase tracking-widest text-carry-light hover:bg-carry-light/10"
              >
                <Link to="/account/payout-accounts">
                  Manage <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isAccountsLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : payoutAccounts && payoutAccounts.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {payoutAccounts.slice(0, 3).map((account) => (
                  <div key={account.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-carry-darker">{account.bank_name}</h4>
                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">
                          {account.account_number_masked}
                        </p>
                      </div>
                    </div>
                    {account.is_default && (
                      <Badge className="bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-tight border-none px-2 py-0.5">
                        Default
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm mb-4">No payout accounts set up</p>
                <Button
                  asChild
                  size="sm"
                  className="bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs"
                >
                  <Link to="/account/payout-accounts">
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Add Account
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Transaction History</CardTitle>
              <span className="text-[10px] font-bold text-gray-400">
                {isTransactionsLoading ? "Loading..." : `${transactions?.total || 0} transactions`}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isTransactionsLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : transactions?.transactions && transactions.transactions.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {transactions.transactions.map((txn) => (
                  <div key={txn.id} className="p-6 flex items-center justify-between hover:bg-gray-50/30 transition-colors group">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {getTransactionIcon(txn.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-carry-darker capitalize">
                          {txn.type.replace(/_/g, " ")}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[11px] text-gray-400 font-medium">
                            {new Date(txn.created_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          <Badge
                            className={cn(
                              "text-[9px] font-bold uppercase tracking-tight px-2 py-0.5",
                              txn.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : txn.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            )}
                          >
                            {txn.status}
                          </Badge>
                        </div>
                        {txn.description && (
                          <p className="text-[10px] text-gray-500 mt-1">{txn.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className={cn("text-sm font-black", getTransactionColor(txn.type, txn.status))}>
                        {["escrow_release", "deposit", "bonus"].includes(txn.type) ? "+" : "-"}
                        {txn.amount.toFixed(2)} {txn.currency}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No transactions yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen} />
    </AccountLayout>
  );
}
