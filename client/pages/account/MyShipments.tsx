import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Weight, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  MoreVertical,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Shipment {
  id: string;
  title: string;
  description: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  status: string;
  weight: number;
  offered_price: number;
  currency: string;
  created_at: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-green-100 text-green-700",
    pending_payment: "bg-amber-100 text-amber-700",
    in_transit: "bg-blue-100 text-blue-700",
    delivered: "bg-carry-light/10 text-carry-light",
    cancelled: "bg-gray-100 text-gray-500",
    disputed: "bg-red-100 text-red-700"
  };

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none", styles[status] || "bg-gray-100 text-gray-700")}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function MyShipments() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["my-shipments", activeTab],
    queryFn: async () => {
      const response = await apiClient.get("/shipments/mine");
      return response.data.data as Shipment[];
    }
  });

  const filteredShipments = shipments?.filter(s => activeTab === "all" || s.status === activeTab) || [];

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">My Shipments</h2>
            <p className="text-gray-500">Track and manage your outgoing delivery requests.</p>
          </div>
          
          <Link 
            to="/account/send-package" 
            className="bg-carry-light text-white px-6 py-2.5 rounded-sm font-bold text-sm flex items-center justify-center gap-2 hover:bg-carry-light/90 transition-all shadow-sm self-start"
          >
            <Plus className="w-4 h-4" />
            New Shipment
          </Link>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 border-b border-gray-100 w-full lg:w-auto">
              {["all", "open", "in_transit", "delivered"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                    activeTab === tab ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab === "all" ? "All Requests" : tab.replace("_", " ")}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter by ID or title..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-carry-light w-full lg:w-64"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-sm text-gray-400 hover:text-carry-light hover:border-carry-light transition-all">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : filteredShipments.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Route</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-carry-darker text-[14px]">{shipment.title}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {shipment.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-carry-muted font-bold text-[13px]">
                            {shipment.origin_city}
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            {shipment.destination_city}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">{shipment.origin_country} → {shipment.destination_country}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-carry-darker">{new Date(shipment.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Created On</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-carry-darker">{shipment.offered_price} {shipment.currency}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Escrow Locked</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={shipment.status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-gray-300 hover:text-carry-darker transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No shipments found</h3>
                <p className="text-gray-500 max-w-sm">You haven't created any shipment requests yet. Start by requesting a delivery for your package.</p>
                <Link to="/account/send-package" className="text-carry-light font-bold hover:underline uppercase tracking-widest text-xs">
                  Create First Shipment Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
