import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  MoreVertical,
  Plus,
  Plane,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  List,
  Users,
  Package,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Trip {
  id: string;
  origin_city: string;
  origin_country: string;
  destination_city: string;
  destination_country: string;
  status: string;
  luggage_capacity: number;
  remaining_capacity: number;
  price_per_kg: number;
  currency: string;
  departure_date: string;
  arrival_date: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700",
    full: "bg-blue-100 text-blue-700",
    completed: "bg-carry-light/10 text-carry-light",
    cancelled: "bg-gray-100 text-gray-500",
    expired: "bg-amber-100 text-amber-700"
  };

  const labels: Record<string, string> = {
    active: "Active Listing",
    full: "Capacity Full",
    completed: "Completed",
    cancelled: "Cancelled",
    expired: "Expired"
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", styles[status] || "bg-gray-100 text-gray-600")}>
      {labels[status] || status.replace("_", " ")}
    </span>
  );
}

export default function MyTrips() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: trips, isLoading } = useQuery({
    queryKey: ["my-trips"],
    queryFn: async () => {
      const response = await apiClient.get("/travel-listings/mine");
      const data = response.data.data;
      return (Array.isArray(data) ? data : data?.listings || []) as Trip[];
    }
  });

  const { data: shipments } = useQuery({
    queryKey: ["urgent-shipments"],
    queryFn: async () => {
      const response = await apiClient.get("/shipments?limit=4");
      return response.data.data.shipments;
    }
  });

  const filteredTrips = trips?.filter(t => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  }) || [];

  const counts = {
    all: trips?.length || 0,
    active: trips?.filter(t => t.status === "active").length || 0,
    completed: trips?.filter(t => t.status === "completed").length || 0,
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
          <span className="text-carry-darker font-medium">My Trips</span>
        </div>

        {/* ════ DIVISION 1 — Tabs + Search ════ */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-gray-100">
              {[
                { id: "all", label: "All Trips", icon: List },
                { id: "active", label: "Active", icon: Clock, count: counts.active },
                { id: "completed", label: "Completed", icon: CheckCircle2 },
                { id: "cancelled", label: "Cancelled", icon: AlertCircle },
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
                  <option>Trip</option>
                  <option>Shipment</option>
                  <option>Corridor</option>
                </select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Flight ID, destination or airline…"
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
                <option>Upcoming</option>
                <option>Last 30 days</option>
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
            ) : filteredTrips.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Flight Route</th>
                    <th className="px-6 py-4">Departure / Arrival</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Earning Rate</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTrips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
                            <Plane className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 font-bold text-carry-darker text-[14px]">
                              {trip.origin_city}
                              <ArrowRight className="w-3 h-3 text-gray-300" />
                              {trip.destination_city}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {trip.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-carry-darker">{new Date(trip.departure_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{new Date(trip.arrival_date).toLocaleDateString([], { day: '2-digit', month: 'short' })} Arrival</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-bold text-carry-darker">{trip.remaining_capacity}kg / {trip.luggage_capacity}kg</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Available Weight</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-bold text-carry-darker">{trip.price_per_kg} {trip.currency}/kg</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Monetization Rate</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={trip.status} />
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
              <div className="p-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted mb-6">
                  <Plane className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker mb-2">No trips posted yet</h3>
                <p className="text-gray-500 max-w-sm mb-8 leading-relaxed">
                  You haven't posted any travel listings yet. Share your flight details to start earning from your luggage space while helping others send items.
                </p>
                <div className="flex items-center gap-4">
                  <button className="px-6 py-2.5 rounded-sm border border-carry-light/20 text-carry-light font-bold text-xs uppercase tracking-widest hover:bg-carry-light/5 transition-all flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    Switch Account
                  </button>
                  <Link to="/account/post-trip" className="px-6 py-2.5 rounded-sm bg-carry-light text-white font-bold text-xs uppercase tracking-widest hover:bg-[#1aa6d4] transition-all flex items-center gap-2 shadow-sm">
                    <Plus className="w-3.5 h-3.5" />
                    Post Your First Trip
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ════ DIVISION 3 — Urgent Shipments Section ════ */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted flex items-center gap-2">
              <Package className="w-4 h-4 text-carry-light" />
              Urgent Shipments on Your Routes
            </h3>
            <Link to="/browse/shipments" className="text-[11px] font-bold text-carry-light hover:underline uppercase tracking-widest flex items-center gap-1.5">
              Browse all shipments
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shipments && shipments.length > 0 ? shipments.map((shipment: any) => (
              <div key={shipment.id} className="bg-white rounded-sm border border-gray-100 group hover:border-carry-light/50 hover:shadow-md transition-all overflow-hidden flex flex-col">
                <div className="relative h-40">
                  <img 
                    src={`https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=300&fit=crop&q=80`} 
                    alt={shipment.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 right-3 bg-carry-darker/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm">Urgent</span>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="font-bold text-carry-darker text-[15px] mb-2 truncate">{shipment.title}</div>
                  <div className="flex items-center gap-1.5 text-carry-muted font-bold text-[12px] mb-4">
                    <MapPin className="w-3 h-3" />
                    {shipment.origin_city} &rarr; {shipment.destination_city}
                  </div>
                  <hr className="border-gray-100 mb-4" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                      <Star className="w-3 h-3 text-amber-500 fill-current" />
                      Sender Verified
                    </div>
                    <div className="text-carry-light font-bold text-[13px]">{shipment.offered_price} {shipment.currency}</div>
                  </div>
                  <div className="text-[11px] text-gray-400 font-bold mt-auto">
                    Reward for {shipment.weight}kg package
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
