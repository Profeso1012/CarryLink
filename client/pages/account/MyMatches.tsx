import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Package,
  Plane,
  MessageSquare,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { matchesApi } from "@/api/matches.api";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type MatchType = "shipments" | "listings";

export default function MyMatches() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<MatchType>("shipments");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Get all shipments to fetch matches for them
  const { data: myShipments, isLoading: shipmentsDataLoading } = useQuery({
    queryKey: ["my-shipments"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("shipments/mine");
        const data = response.data.data;
        return (Array.isArray(data) ? data : data?.requests || data?.shipments || []) as any[];
      } catch (error) {
        console.error("Failed to fetch shipments:", error);
        return [];
      }
    },
  });

  // Get all listings to fetch matches for them
  const { data: myListings, isLoading: listingsDataLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("travel-listings/mine");
        const data = response.data.data;
        return (Array.isArray(data) ? data : data?.listings || []) as any[];
      } catch (error) {
        console.error("Failed to fetch listings:", error);
        return [];
      }
    },
  });

  // Fetch matches for shipments (traveler offers)
  const { data: shipmentMatches, isLoading: shipmentsLoading } = useQuery({
    queryKey: ["matches-for-shipments", myShipments],
    queryFn: async () => {
      if (!myShipments || myShipments.length === 0) return [];
      
      const allMatches = [];
      for (const shipment of myShipments.slice(0, 5)) { // Limit to avoid too many requests
        try {
          const response = await matchesApi.getForShipment(shipment.id, { limit: 10 });
          if (response && response.matches) {
            allMatches.push(...response.matches);
          }
        } catch (error) {
          console.warn(`Failed to get matches for shipment ${shipment.id}:`, error);
        }
      }
      return allMatches;
    },
    enabled: activeTab === "shipments" && !!myShipments && myShipments.length > 0,
  });

  // Fetch matches for listings (sender requests)
  const { data: listingMatches, isLoading: listingsLoading } = useQuery({
    queryKey: ["matches-for-listings", myListings],
    queryFn: async () => {
      if (!myListings || myListings.length === 0) return [];
      
      const allMatches = [];
      for (const listing of myListings.slice(0, 5)) { // Limit to avoid too many requests
        try {
          const response = await matchesApi.getForListing(listing.id, { limit: 10 });
          if (response && response.matches) {
            allMatches.push(...response.matches);
          }
        } catch (error) {
          console.warn(`Failed to get matches for listing ${listing.id}:`, error);
        }
      }
      return allMatches;
    },
    enabled: activeTab === "listings" && !!myListings && myListings.length > 0,
  });

  const acceptMatchMutation = useMutation({
    mutationFn: (matchId: string) => matchesApi.respond(matchId, 'accept'),
    onSuccess: (data) => {
      toast.success("Match accepted! Opening chat...");
      if (data.data.conversation_id) {
        navigate(`/account/messages?conversation=${data.data.conversation_id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["matches-for-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["matches-for-listings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.data?.message || "Failed to accept match");
    },
  });

  const rejectMatchMutation = useMutation({
    mutationFn: (matchId: string) =>
      matchesApi.respond(matchId, 'reject', rejectReason),
    onSuccess: () => {
      toast.success("Match rejected");
      setRejectModalOpen(false);
      setSelectedMatchId(null);
      setRejectReason("");
      queryClient.invalidateQueries({ queryKey: ["matches-for-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["matches-for-listings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.data?.message || "Failed to reject match");
    },
  });

  const cancelMatchMutation = useMutation({
    mutationFn: (matchId: string) =>
      matchesApi.cancel(matchId, {}),
    onSuccess: () => {
      toast.success("Match cancelled");
      queryClient.invalidateQueries({ queryKey: ["matches-for-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["matches-for-listings"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.data?.message || "Failed to cancel match");
    },
  });

  const matches = activeTab === "shipments" ? shipmentMatches : listingMatches;
  const isLoading = activeTab === "shipments" ? (shipmentsLoading || shipmentsDataLoading) : (listingsLoading || listingsDataLoading);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      sender_requested: { label: "Sender Requested", color: "bg-blue-50 text-blue-600" },
      traveler_offered: { label: "Traveler Offered", color: "bg-purple-50 text-purple-600" },
      negotiating: { label: "Negotiating", color: "bg-amber-50 text-amber-600" },
      payment_requested: { label: "Payment Requested", color: "bg-green-50 text-green-600" },
      payment_pending: { label: "Payment Pending", color: "bg-orange-50 text-orange-600" },
      confirmed: { label: "Confirmed", color: "bg-green-50 text-green-600" },
      rejected_by_sender: { label: "Rejected by Sender", color: "bg-red-50 text-red-600" },
      rejected_by_traveler: { label: "Rejected by Traveler", color: "bg-red-50 text-red-600" },
      cancelled: { label: "Cancelled", color: "bg-gray-50 text-gray-600" },
      expired: { label: "Expired", color: "bg-gray-50 text-gray-600" },
    };
    const config = statusConfig[status] || { label: status, color: "bg-gray-50 text-gray-600" };
    return (
      <Badge className={`${config.color} hover:${config.color} border-none px-2 py-1 text-[10px] font-bold uppercase tracking-wider`}>
        {config.label}
      </Badge>
    );
  };

  const handleRejectClick = (matchId: string) => {
    setSelectedMatchId(matchId);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedMatchId) {
      rejectMatchMutation.mutate(selectedMatchId);
    }
  };

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Matches</h2>
            <p className="text-gray-500">
              View and manage your matches with senders and travelers.
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-sm self-start">
            <button
              onClick={() => setActiveTab("shipments")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm",
                activeTab === "shipments"
                  ? "bg-white text-carry-light shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              My Shipments
            </button>
            <button
              onClick={() => setActiveTab("listings")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm",
                activeTab === "listings"
                  ? "bg-white text-carry-light shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              My Trips
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
          </div>
        ) : matches && matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <div
                key={match.match_id}
                className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-6 space-y-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {activeTab === "shipments" ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-carry-darker">
                            {match.shipment_request?.sender_display_name || "Sender"}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {match.shipment_request?.destination_city || "Destination"}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                          {match.travel_listing?.traveler?.badges?.includes("verified_traveler") ? (
                            <ShieldCheck className="w-6 h-6" />
                          ) : (
                            <Plane className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-carry-darker">
                            {match.travel_listing?.traveler?.display_name || "Traveler"}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {match.travel_listing?.traveler?.badges?.includes("verified_traveler") && (
                              <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-2 py-0.5 text-[9px] font-bold uppercase">
                                Verified
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              Score: {match.travel_listing?.traveler?.trust_score}/100
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-black text-carry-light">
                        {Math.round(match.match_score)}%
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase">Match Score</span>
                    </div>
                    {getStatusBadge(match.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-50">
                  {activeTab === "shipments" ? (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Route</span>
                        <p className="text-sm font-bold text-carry-darker">
                          {match.travel_listing?.origin_city} → {match.travel_listing?.destination_city}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Departure</span>
                        <p className="text-sm font-bold text-carry-darker flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {match.travel_listing?.departure_date
                            ? new Date(match.travel_listing.departure_date).toLocaleDateString([], {
                                day: "2-digit",
                                month: "short",
                              })
                            : "TBD"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacity</span>
                        <p className="text-sm font-bold text-carry-darker">
                          {match.travel_listing?.available_capacity_kg}kg available
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Price</span>
                        <p className="text-sm font-bold text-carry-light">
                          ${match.travel_listing?.price_per_kg}/kg
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Weight</span>
                        <p className="text-sm font-bold text-carry-darker">
                          {match.shipment_request?.declared_weight_kg}kg
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Destination</span>
                        <p className="text-sm font-bold text-carry-darker">
                          {match.shipment_request?.destination_city || "TBD"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offered Amount</span>
                        <p className="text-sm font-bold text-carry-light">
                          ${match.payment_requested_amount || "Negotiating"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                        <p className="text-sm font-bold text-carry-darker capitalize">
                          {match.status.replace(/_/g, " ")}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-50">
                  {["sender_requested", "traveler_offered"].includes(match.status) && (
                    <>
                      <Button
                        onClick={() => acceptMatchMutation.mutate(match.match_id)}
                        disabled={acceptMatchMutation.isPending}
                        className="bg-carry-light hover:bg-carry-light/90 text-white font-bold text-xs uppercase tracking-widest h-10 px-4"
                      >
                        {acceptMatchMutation.isPending ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin mr-2" /> Accepting...
                          </>
                        ) : (
                          "Accept"
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(match.match_id)}
                        variant="outline"
                        className="font-bold text-xs uppercase tracking-widest h-10 px-4 border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
                      >
                        Reject
                      </Button>
                    </>
                  )}

                  {["negotiating", "payment_requested"].includes(match.status) && match.conversation_id && (
                    <Button
                      onClick={() =>
                        navigate(`/account/messages?conversation=${match.conversation_id}`)
                      }
                      className="bg-carry-light hover:bg-carry-light/90 text-white font-bold text-xs uppercase tracking-widest h-10 px-4"
                    >
                      <MessageSquare className="w-3 h-3 mr-2" /> Open Chat
                    </Button>
                  )}

                  {["negotiating", "payment_requested", "sender_requested", "traveler_offered"].includes(
                    match.status
                  ) && (
                    <Button
                      onClick={() =>
                        cancelMatchMutation.mutate(match.match_id)
                      }
                      disabled={cancelMatchMutation.isPending}
                      variant="outline"
                      className="font-bold text-xs uppercase tracking-widest h-10 px-4 border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200"
                    >
                      {cancelMatchMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin mr-2" /> Canceling...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-2" /> Cancel
                        </>
                      )}
                    </Button>
                  )}

                  {["confirmed", "payment_pending"].includes(match.status) && (
                    <Button
                      disabled
                      className="bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-widest h-10 px-4 cursor-not-allowed"
                    >
                      ✓ Confirmed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-md border border-carry-light/10 p-20 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-carry-darker">No matches yet</h3>
            <p className="text-gray-500 max-w-sm">
              {activeTab === "shipments"
                ? myShipments && myShipments.length > 0 
                  ? "No travelers have offered to carry your shipments yet. Try adjusting your pricing or route details."
                  : "You haven't posted any shipments yet. Create a shipment request to see potential matches with travelers."
                : myListings && myListings.length > 0
                  ? "No senders have requested to use your travel listings yet. Make sure your routes and pricing are competitive."
                  : "You haven't posted any travel listings yet. Create a travel listing to see potential matches with senders."}
            </p>
            <div className="flex gap-3 pt-4">
              {activeTab === "shipments" ? (
                <Link to="/account/send-package" className="px-6 py-3 bg-carry-light text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-carry-light/90 transition-all">
                  Post a Shipment
                </Link>
              ) : (
                <Link to="/account/post-trip" className="px-6 py-3 bg-carry-light text-white rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-carry-light/90 transition-all">
                  Post a Trip
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-carry-darker text-white">
            <DialogTitle className="text-2xl font-black">Reject Match</DialogTitle>
            <DialogDescription className="text-gray-300">
              Tell us why you're rejecting this match (optional).
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-4">
            <Textarea
              placeholder="Enter reason (optional)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px] border-gray-100 focus:border-carry-light resize-none"
            />
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReject}
              disabled={rejectMatchMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-xs h-12"
            >
              {rejectMatchMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Rejecting...
                </>
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AccountLayout>
  );
}
