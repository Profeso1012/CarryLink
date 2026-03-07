import React from "react";
import { useQuery } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  Package, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  MoreVertical,
  Scale,
  ShieldAlert,
  Gavel
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Dispute {
  id: string;
  booking_id: string;
  type: "item_not_received" | "item_damaged" | "delayed_delivery" | "other";
  status: "open" | "under_review" | "resolved" | "cancelled";
  description: string;
  created_at: string;
  booking?: {
    shipment_title: string;
    counterparty_name: string;
  };
}

function DisputeStatusBadge({ status }: { status: Dispute["status"] }) {
  const styles: Record<Dispute["status"], { color: string, bg: string }> = {
    open: { color: "text-red-600", bg: "bg-red-100" },
    under_review: { color: "text-amber-600", bg: "bg-amber-100" },
    resolved: { color: "text-green-600", bg: "bg-green-100" },
    cancelled: { color: "text-gray-500", bg: "bg-gray-100" }
  };

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none", styles[status].bg, styles[status].color)}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function Disputes() {
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["disputes"],
    queryFn: async () => {
      const response = await apiClient.get("/disputes/mine");
      return response.data.data as Dispute[];
    }
  });

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Dispute Resolution</h2>
            <p className="text-gray-500">Manage and track reports regarding delivery issues or damaged items.</p>
          </div>
          
          <Button 
            className="bg-carry-darker text-white px-6 py-2.5 rounded-sm font-bold text-sm flex items-center justify-center gap-2 hover:bg-carry-dark transition-all self-start"
          >
            <ShieldAlert className="w-4 h-4" />
            Open New Dispute
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Neutral Mediation</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Fair & unbiased resolution</span>
            </div>
          </Card>
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Admin Oversight</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Active case monitoring</span>
            </div>
          </Card>
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Escrow Safety</span>
              <span className="text-sm font-bold text-carry-darker tracking-tight">Refunds for proven issues</span>
            </div>
          </Card>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Recent Disputes</h3>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : disputes && disputes.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Dispute Details</th>
                    <th className="px-6 py-4">Booking</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Opened</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-sm bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-carry-darker text-[14px]">{d.type.replace(/_/g, " ")}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter truncate max-w-[200px]">{d.description}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-carry-darker">{d.booking?.shipment_title}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">With {d.booking?.counterparty_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <DisputeStatusBadge status={d.status} />
                      </td>
                      <td className="px-6 py-5 text-xs font-medium text-gray-500">
                        {new Date(d.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Button variant="ghost" size="sm" className="text-carry-light font-bold text-xs uppercase tracking-widest">
                          View Case
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No active disputes</h3>
                <p className="text-gray-500 max-w-sm">We hope you never have to see one! If any issues arise with a delivery, you can open a dispute here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
