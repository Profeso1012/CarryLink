import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Package,
  MapPin,
  Calendar,
  Loader2,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Booking {
  id: string;
  status: "pending_payment" | "payment_held" | "in_transit" | "delivered" | "completed" | "disputed" | "cancelled";
  shipment_title?: string;
  origin_city: string;
  destination_city: string;
  total_amount: number;
  currency: string;
  traveler_name?: string;
  sender_name?: string;
  created_at: string;
  updated_at: string;
}

export default function Bookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      const response = await apiClient.get("/bookings");
      const data = response.data.data;
      return (Array.isArray(data) ? data : data?.bookings || []) as Booking[];
    }
  });

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "pending_payment":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "payment_held":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "in_transit":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "delivered":
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "disputed":
        return "bg-red-50 text-red-700 border-red-200";
      case "cancelled":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: Booking["status"]) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in_transit":
        return <Clock className="w-4 h-4" />;
      case "disputed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredBookings = bookings?.filter((booking) => {
    const matchesSearch = 
      booking.shipment_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.origin_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.destination_city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = !filterStatus || booking.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  }) || [];

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">My Bookings</h2>
            <p className="text-sm text-gray-500 mt-1">Track and manage all your shipment bookings</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="border-carry-light/10 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-carry-light"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={!filterStatus ? "default" : "outline"}
                  onClick={() => setFilterStatus(null)}
                  className={cn(
                    !filterStatus ? "bg-carry-light text-white" : "text-carry-muted border-gray-200"
                  )}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "in_transit" ? "default" : "outline"}
                  onClick={() => setFilterStatus("in_transit")}
                  className={cn(
                    filterStatus === "in_transit" ? "bg-carry-light text-white" : "text-carry-muted border-gray-200"
                  )}
                  size="sm"
                >
                  In Transit
                </Button>
                <Button
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  onClick={() => setFilterStatus("completed")}
                  className={cn(
                    filterStatus === "completed" ? "bg-carry-light text-white" : "text-carry-muted border-gray-200"
                  )}
                  size="sm"
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-carry-light" />
            </div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="border-carry-light/10 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-carry-darker text-lg">
                            {booking.shipment_title || "Shipment"}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4 text-carry-light" />
                            <span className="font-medium">{booking.origin_city} → {booking.destination_city}</span>
                          </div>
                        </div>
                        <Badge className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          getStatusColor(booking.status)
                        )}>
                          <span className="inline-flex items-center gap-1.5">
                            {getStatusIcon(booking.status)}
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Amount</span>
                          <p className="text-sm font-bold text-carry-darker mt-0.5">
                            {booking.currency === "USD" ? "$" : "₦"}{booking.total_amount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Traveler</span>
                          <p className="text-sm font-bold text-carry-darker mt-0.5">{booking.traveler_name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Sender</span>
                          <p className="text-sm font-bold text-carry-darker mt-0.5">{booking.sender_name || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Date</span>
                          <p className="text-sm font-bold text-carry-darker mt-0.5">
                            {new Date(booking.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-auto">
                      <Button
                        asChild
                        className="w-full md:w-auto bg-carry-light hover:bg-carry-light/90 text-white font-bold text-xs uppercase tracking-widest h-10"
                      >
                        <Link to={`/account/booking/${booking.id}`}>
                          View Details
                          <ArrowRight className="w-3.5 h-3.5 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-carry-light/10 shadow-sm">
              <CardContent className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-carry-darker mb-2">No Bookings Yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You haven't made any bookings yet. Browse listings and send offers to get started.
                </p>
                <Button asChild className="bg-carry-light hover:bg-carry-light/90 text-white font-bold text-xs uppercase tracking-widest">
                  <Link to="/browse/listings">Browse Listings</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
