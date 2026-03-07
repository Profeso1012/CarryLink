import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Weight, 
  DollarSign, 
  Search, 
  Filter, 
  ArrowRight, 
  Loader2, 
  MoreVertical,
  Plus,
  Plane
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

  return (
    <Badge className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border-none", styles[status] || "bg-gray-100 text-gray-700")}>
      {status.replace("_", " ")}
    </Badge>
  );
}

export default function MyTrips() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: trips, isLoading } = useQuery({
    queryKey: ["my-trips", activeTab],
    queryFn: async () => {
      const response = await apiClient.get("/travel-listings/mine");
      return response.data.data as Trip[];
    }
  });

  const filteredTrips = trips?.filter(t => activeTab === "all" || t.status === activeTab) || [];

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">My Trips</h2>
            <p className="text-gray-500">Track and manage your upcoming international flights.</p>
          </div>
          
          <Link 
            to="/account/post-trip" 
            className="bg-carry-light text-white px-6 py-2.5 rounded-sm font-bold text-sm flex items-center justify-center gap-2 hover:bg-carry-light/90 transition-all shadow-sm self-start"
          >
            <Plus className="w-4 h-4" />
            Post New Trip
          </Link>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 border-b border-gray-100 w-full lg:w-auto">
              {["all", "active", "completed", "cancelled"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative whitespace-nowrap",
                    activeTab === tab ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab === "all" ? "All Trips" : tab.replace("_", " ")}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Filter by city or ID..." 
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
            ) : filteredTrips.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Flight Route</th>
                    <th className="px-6 py-4">Departure / Arrival</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Earning Rate</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right"></th>
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
                          <div className="flex flex-col gap-0.5">
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
                          <span className="text-xs font-bold text-carry-darker">
                            {new Date(trip.departure_date).toLocaleDateString()}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">
                            {new Date(trip.arrival_date).toLocaleDateString()} Arrival
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-carry-darker">{trip.remaining_capacity}kg / {trip.luggage_capacity}kg</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Available Weight</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-carry-darker">{trip.price_per_kg} {trip.currency}/kg</span>
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
              <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                  <Plane className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No trips posted yet</h3>
                <p className="text-gray-500 max-w-sm">You haven't posted any travel listings yet. Share your flight details to start earning from your luggage space.</p>
                <Link to="/account/post-trip" className="text-carry-light font-bold hover:underline uppercase tracking-widest text-xs">
                  Post Your First Trip
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
