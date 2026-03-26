import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Calendar,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Star,
  Info,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Share2,
  Flag,
  User,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { Link as RouterLink } from "react-router-dom";

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    console.log("[ListingDetail] mounted — id:", id);
  }, [id]);

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      console.log("[ListingDetail] fetching /travel-listings/", id);
      const response = await apiClient.get(`/travel-listings/${id}`);
      console.log("[ListingDetail] response:", response.data);
      return response.data.data;
    },
    enabled: !!id,
  });

  const handleSendOffer = () => {
    if (!isAuthenticated) {
      toast.error("Please login to send an offer");
      return;
    }
    if (user?.kyc_status !== "approved") {
      toast.error("You must complete KYC verification to send offers");
      navigate("/account/kyc");
      return;
    }
    navigate(`/account/send-package?listing_id=${id}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-carry-bg flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    console.error("[ListingDetail] error or no data:", error);
    return (
      <div className="min-h-screen bg-carry-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-carry-darker">Listing Not Found</h2>
          <p className="text-gray-500 mt-2">
            This travel listing does not exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/browse/listings">Browse Other Listings</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  console.log("[ListingDetail] rendering listing:", listing);

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />

      <main className="flex-1 pt-[120px] pb-20">
        <div className="max-w-6xl mx-auto px-6 space-y-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/browse/listings" className="hover:text-carry-light transition-colors">Travel Listings</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-carry-darker font-medium">Listing Details</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Header Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                        Active Listing
                      </Badge>
                      {listing.is_verified_flight && (
                        <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                          Verified Flight
                        </Badge>
                      )}
                    </div>
                    <h1 className="text-3xl font-black text-carry-darker leading-tight">
                      Traveling from {listing.origin_city} to {listing.destination_city}
                    </h1>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-carry-light" />
                        <span className="font-medium">
                          Departing:{" "}
                          {new Date(listing.departure_date).toLocaleDateString([], {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-carry-light" />
                        <span className="font-medium">
                          Arriving:{" "}
                          {new Date(listing.arrival_date).toLocaleDateString([], {
                            day: "2-digit",
                            month: "long",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-carry-bg rounded-sm p-6 flex flex-col items-center justify-center text-center min-w-[160px]">
                    <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest mb-1">
                      Price per kg
                    </span>
                    <div className="text-3xl font-black text-carry-light">
                      {listing.price_per_kg} {listing.currency}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                      Starting Rate
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-50">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                      Available Space
                    </span>
                    <span className="text-lg font-bold text-carry-darker">
                      {listing.available_capacity_kg} kg
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                      Airline
                    </span>
                    <span className="text-lg font-bold text-carry-darker">
                      {listing.airline || "Not specified"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                      Flight
                    </span>
                    <span className="text-lg font-bold text-carry-darker">
                      {listing.flight_number || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accepted Categories */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                    <Package className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-carry-darker">What I Can Carry</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.isArray(listing.accepted_categories) &&
                    listing.accepted_categories.map((cat: any, idx: number) => {
                      const name =
                        typeof cat === "object" && cat !== null ? cat.name : String(cat);
                      const catId =
                        typeof cat === "object" && cat !== null ? cat.id : idx;
                      return (
                        <div
                          key={catId}
                          className="flex items-center gap-3 p-4 rounded-sm border border-gray-100 bg-gray-50/30"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          <span className="text-sm font-bold text-carry-darker">{name}</span>
                        </div>
                      );
                    })}
                </div>
                {listing.notes && (
                  <div className="mt-6 p-6 bg-amber-50/50 border border-amber-100 rounded-sm">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0" />
                      <div className="space-y-1 flex-1">
                        <span className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                          Traveler's Notes
                        </span>
                        <p className="text-sm text-amber-900 leading-relaxed">{listing.notes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Action Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-carry-darker">Have a Package?</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Send an offer to this traveler to carry your shipment.
                  </p>
                </div>
                <Button
                  onClick={handleSendOffer}
                  className="w-full h-14 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs shadow-md"
                >
                  Send an Offer
                </Button>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <button className="flex items-center gap-2 text-[11px] font-bold text-carry-muted uppercase tracking-widest hover:text-carry-light transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="w-[1px] h-4 bg-gray-100" />
                  <button className="flex items-center gap-2 text-[11px] font-bold text-carry-muted uppercase tracking-widest hover:text-red-500 transition-colors">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              {/* Traveler Profile Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-carry-bg border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                      {listing.traveler?.avatar_url ? (
                        <img
                          src={listing.traveler.avatar_url}
                          alt={listing.traveler.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-carry-light" />
                      )}
                    </div>
                    {listing.traveler?.badges?.includes("verified_traveler") && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-green-500 fill-green-50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-carry-darker">
                      {listing.traveler?.display_name || "Traveler"}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Verified Traveler
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-sm text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-black">
                        {listing.traveler?.rating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      Avg Rating
                    </span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-sm text-center">
                    <div className="text-sm font-black text-carry-darker mb-1">
                      {listing.traveler?.total_deliveries_as_traveler || 0}
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                      Deliveries
                    </span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-bold uppercase">Trust Score</span>
                    <span className="text-carry-light font-black">
                      {listing.traveler?.trust_score ?? "—"}/100
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-carry-light"
                      style={{ width: `${listing.traveler?.trust_score ?? 0}%` }}
                    />
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full font-bold text-[11px] uppercase tracking-widest h-10">
                  <RouterLink to={`/profile/${listing.traveler?.id}`}>
                    View Full Profile
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </RouterLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
