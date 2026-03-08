import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { 
  Package, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  MoreVertical,
  Plus,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  List,
  ChevronRight,
  Users,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Shipment {
  id: string;
  title?: string;
  item_description: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  status: string;
  weight: number;
  declared_weight_kg?: number;
  offered_price: number;
  currency: string;
  created_at: string;
  images?: { url: string }[];
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

  const labels: Record<string, string> = {
    open: "Open Request",
    pending_payment: "Payment Required",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    disputed: "Disputed"
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", styles[status] || "bg-gray-100 text-gray-600")}>
      {labels[status] || status.replace("_", " ")}
    </span>
  );
}

export default function MyShipments() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: shipments, isLoading } = useQuery({
    queryKey: ["my-shipments"],
    queryFn: async () => {
      const response = await apiClient.get("/shipments/mine");
      // Handle response structure { success: true, data: [...] } or { success: true, data: { shipments: [...] } }
      const data = response.data.data;
      return (Array.isArray(data) ? data : data?.shipments || []) as Shipment[];
    }
  });

  const { data: listings } = useQuery({
    queryKey: ["verified-listings"],
    queryFn: async () => {
      const response = await apiClient.get("/travel-listings?limit=4");
      return response.data.data.listings;
    }
  });

  const filteredShipments = shipments?.filter(s => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return s.status === "open" || s.status === "pending_payment";
    return s.status === activeTab;
  }) || [];

  const counts = {
    all: shipments?.length || 0,
    pending: shipments?.filter(s => s.status === "open" || s.status === "pending_payment").length || 0,
    in_transit: shipments?.filter(s => s.status === "in_transit").length || 0,
    delivered: shipments?.filter(s => s.status === "delivered").length || 0,
    disputed: shipments?.filter(s => s.status === "disputed").length || 0,
  };

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/account/dashboard" className="hover:text-carry-light transition-colors">Account</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-carry-darker font-medium">My Shipments</span>
        </div>

        {/* ════ DIVISION 1 — Tabs + Search ════ */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-gray-100">
              {[
                { id: "all", label: "All Shipments", icon: List },
                { id: "pending", label: "Pending", icon: Clock, count: counts.pending },
                { id: "in_transit", label: "In Transit", icon: Truck },
                { id: "delivered", label: "Delivered", icon: PackageCheck },
                { id: "disputed", label: "Disputed", icon: AlertCircle },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap flex items-center gap-2",
                    activeTab === tab.id ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="bg-carry-light/10 text-carry-light px-1.5 py-0.5 rounded-full text-[9px] min-w-[16px] text-center">
                      {tab.count}
                    </span>
                  )}
                  {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1 flex items-stretch border border-gray-200 rounded-sm overflow-hidden">
                <select className="bg-gray-50 px-3 py-2 text-[13px] font-medium text-carry-darker border-r border-gray-200 outline-none">
                  <option>Shipment</option>
                  <option>Traveler</option>
                  <option>Corridor</option>
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tracking ID, traveler name or route…"
                    className="w-full pl-10 pr-4 py-2 bg-white text-sm outline-none"
                  />
                </div>
              </div>
              <button className="bg-carry-light text-white px-6 py-2 rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-carry-light/90 transition-all flex items-center justify-center gap-2">
                <Search className="w-3.5 h-3.5" />
                Search
              </button>
              <select className="bg-white border border-gray-200 px-3 py-2 rounded-sm text-[13px] font-medium text-carry-darker outline-none">
                <option>All time</option>
                <option>Last 30 days</option>
                <option>Last 6 months</option>
                <option>2025</option>
              </select>
            </div>
          </div>
        </div>

        {/* ════ DIVISION 2 — Data Table or Empty state ════ */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : filteredShipments.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Package Details</th>
                    <th className="px-6 py-4">Route / Created</th>
                    <th className="px-6 py-4">Agreed Price</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredShipments.map((shipment) => (
                    <tr key={shipment.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light shrink-0 overflow-hidden">
                            {shipment.images?.[0]?.url ? (
                              <img src={shipment.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <span className="font-bold text-carry-darker text-[14px] truncate">{shipment.item_description || shipment.title}</span>
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
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(shipment.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-bold text-carry-darker">{shipment.offered_price} {shipment.currency}</span>
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
              /* Empty state matching board.html */
              <div className="p-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted mb-6">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker mb-2">No shipments yet</h3>
                <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                  You haven't sent anything yet. Post your first item request and get matched with a verified traveler heading your way — for up to 68% less than DHL.
                </p>
                <div className="flex items-center gap-4">
                  <button className="px-6 py-2.5 rounded-sm border border-carry-light/20 text-carry-light font-bold text-xs uppercase tracking-widest hover:bg-carry-light/5 transition-all flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    Switch Account
                  </button>
                  <Link to="/account/send-package" className="px-6 py-2.5 rounded-sm bg-carry-light text-white font-bold text-xs uppercase tracking-widest hover:bg-[#1aa6d4] transition-all flex items-center gap-2 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Send a Package
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════ DIVISION 3 — Verified Travelers Section ════ */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted flex items-center gap-2">
              <Users className="w-4 h-4 text-carry-light" />
              Verified Travelers on Your Routes
            </h3>
            <Link to="/browse/listings" className="text-[11px] font-bold text-carry-light hover:underline uppercase tracking-widest flex items-center gap-1.5">
              Browse all travelers
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings && listings.length > 0 ? listings.map((listing: any) => (
              <div key={listing.id} className="bg-white rounded-sm border border-gray-100 group hover:border-carry-light/50 hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="relative h-40">
                  <img 
                    src={listing.user?.avatar_url || `https://images.unsplash.com/photo-${listing.id.length > 10 ? '1573496359142-b8d87734a5a2' : '1560250097-0b93528c311a'}?w=400&h=300&fit=crop&q=80`} 
                    alt={listing.user?.first_name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-carry-light text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">Verified</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="font-bold text-carry-darker text-[15px] mb-2">{listing.user?.first_name} {listing.user?.last_name}</div>
                  <div className="flex items-center gap-1.5 text-carry-muted font-bold text-[12px] mb-4">
                    <MapPin className="w-3 h-3" />
                    {listing.origin_city} &rarr; {listing.destination_city}
                  </div>
                  <hr className="border-gray-100 mb-4" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                      <Calendar className="w-3 h-3" />
                      {new Date(listing.departure_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-carry-light font-bold text-[13px]">${listing.price_per_kg || 10}/kg</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-bold mt-auto">
                    <Star className="w-3 h-3 fill-current" />
                    4.9 · 38 deliveries
                  </div>
                </div>
              </div>
            )) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 h-64 rounded-sm animate-pulse"></div>
              ))
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
