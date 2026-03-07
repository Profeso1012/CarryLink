import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  MoreVertical,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  provider: "stripe" | "paystack";
  status: "succeeded" | "pending" | "failed" | "refunded";
  created_at: string;
  booking?: {
    shipment_title: string;
    traveler_name: string;
  };
}

function PaymentStatusBadge({ status }: { status: Payment["status"] }) {
  const styles: Record<Payment["status"], { icon: any, label: string, color: string, bg: string }> = {
    succeeded: { icon: CheckCircle2, label: "Paid", color: "text-green-600", bg: "bg-green-100" },
    pending: { icon: Clock, label: "Processing", color: "text-amber-600", bg: "bg-amber-100" },
    failed: { icon: XCircle, label: "Failed", color: "text-red-600", bg: "bg-red-100" },
    refunded: { icon: Zap, label: "Refunded", color: "text-carry-light", bg: "bg-carry-light/10" }
  };

  const { icon: Icon, label, color, bg } = styles[status] || styles.pending;

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none", bg, color)}>
      <Icon className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}

export default function Payments() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments-history"],
    queryFn: async () => {
      const response = await apiClient.get("/payments/history");
      return response.data.data as Payment[];
    }
  });

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Payment History</h2>
          <p className="text-gray-500">View and manage all your outgoing payments for delivery services.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Escrow Protection</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Active for every transaction</span>
            </div>
          </Card>
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Instant Payouts</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Fast settlements for travelers</span>
            </div>
          </Card>
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Secure Providers</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Stripe & Paystack certified</span>
            </div>
          </Card>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">All Payments</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="ID..." 
                  className="pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-sm text-xs focus:outline-none focus:border-carry-light w-48"
                />
              </div>
              <button className="p-1.5 border border-gray-200 rounded-sm text-gray-400 hover:text-carry-light hover:border-carry-light transition-all">
                <Filter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : payments && payments.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Booking Details</th>
                    <th className="px-6 py-4">Method</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date / Time</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5 min-w-[200px]">
                          <span className="font-bold text-carry-darker text-[14px] truncate">{p.booking?.shipment_title}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Traveler: {p.booking?.traveler_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-carry-muted uppercase tracking-widest">{p.provider}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <PaymentStatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-carry-darker">{new Date(p.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-[15px] text-carry-darker">
                        {p.amount.toFixed(2)} <span className="text-[10px] text-gray-400">{p.currency}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No payments recorded</h3>
                <p className="text-gray-500 max-w-sm">Your payment history as a sender will appear here once you initiate delivery bookings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
