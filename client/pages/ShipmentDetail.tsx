import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  MapPin,
  Package,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Star,
  Info,
  CheckCircle2,
  AlertCircle,
  Share2,
  Flag,
  User,
  ExternalLink,
  X,
  Plus,
  Camera,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shipmentsApi } from "@/api/shipments.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    console.log("[ShipmentDetail] mounted — id:", id);
  }, [id]);

  const { data: shipment, isLoading, error, refetch } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      console.log("[ShipmentDetail] fetching /shipments/", id);
      const result = await shipmentsApi.getById(id!);
      console.log("[ShipmentDetail] response:", result);
      return result;
    },
    enabled: !!id,
  });

  const handleSendRequest = () => {
    if (!isAuthenticated) {
      toast.error("Please login to send a request");
      return;
    }
    navigate(`/browse/listings?shipment_id=${id}`);
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

  if (error || !shipment) {
    console.error("[ShipmentDetail] error or no data:", error);
    return (
      <div className="min-h-screen bg-carry-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-carry-darker">Shipment Not Found</h2>
          <p className="text-gray-500 mt-2">
            This shipment request does not exist or has been removed.
          </p>
          <Button asChild className="mt-6">
            <Link to="/browse/shipments">Browse Other Shipments</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  console.log("[ShipmentDetail] rendering shipment:", shipment);

  const isOwner = user?.id === shipment.sender?.id;

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />

      <main className="flex-1 pt-[120px] pb-20">
        <div className="max-w-6xl mx-auto px-6 space-y-8">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/browse/shipments" className="hover:text-carry-light transition-colors">
              Shipment Requests
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-carry-darker font-medium">Shipment Details</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Header Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5">

                  {/* Image Section */}
                  <div className="md:col-span-2 bg-gray-50/50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100 min-h-[300px]">
                    <div className="relative w-full aspect-square bg-white rounded-sm border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm mb-4">
                      {shipment.images?.length > 0 ? (
                        <img
                          src={activeImage || shipment.images[0].url}
                          alt={shipment.item_description}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-carry-light/40" />
                      )}
                    </div>
                    {shipment.images?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {shipment.images.map((img: any) => (
                          <button
                            key={img.id}
                            onClick={() => setActiveImage(img.url)}
                            className={cn(
                              "w-12 h-12 rounded-sm border-2 overflow-hidden transition-all",
                              activeImage === img.url ||
                                (!activeImage && shipment.images[0].url === img.url)
                                ? "border-carry-light"
                                : "border-transparent hover:border-gray-300"
                            )}
                          >
                            <img src={img.url} className="w-full h-full object-cover" alt="" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="md:col-span-3 p-8 space-y-6 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                          Open Request
                        </Badge>
                        {isOwner && (
                          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            My Shipment
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-black text-carry-darker leading-tight">
                        {shipment.item_description}
                      </h1>
                      <div className="flex items-center gap-2 font-bold text-carry-darker text-sm">
                        <MapPin className="w-4 h-4 text-carry-light" />
                        {shipment.origin_city} → {shipment.destination_city}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                          Declared Weight
                        </span>
                        <span className="text-lg font-bold text-carry-darker">
                          {shipment.declared_weight_kg} kg
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                          Pickup Deadline
                        </span>
                        <span className="text-lg font-bold text-carry-darker">
                          {new Date(shipment.pickup_deadline).toLocaleDateString([], {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-carry-darker">Item Details</h3>
                </div>
                <p className="text-base text-carry-darker leading-relaxed">
                  {shipment.item_description || "No detailed description provided."}
                </p>
                {shipment.special_instructions && (
                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-sm">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest mb-1">
                      Special Instructions
                    </p>
                    <p className="text-sm text-amber-900">{shipment.special_instructions}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Reward Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">
                    Offered Reward
                  </span>
                  <div className="text-4xl font-black text-carry-light">
                    {shipment.offered_price} {shipment.currency}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight pt-2">
                    Full payment held in escrow
                  </p>
                </div>

                {!isOwner ? (
                  <Button
                    onClick={handleSendRequest}
                    className="w-full h-14 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs shadow-md"
                  >
                    Find a Traveler
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button asChild variant="outline" className="w-full h-12 font-bold uppercase tracking-widest text-xs border-carry-light/20 text-carry-light">
                      <Link to="/account/my-shipments">Manage My Shipments</Link>
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase">
                      This is your shipment.
                    </p>
                  </div>
                )}

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

              {/* Sender Profile Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-carry-bg border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                      {shipment.sender?.avatar_url ? (
                        <img
                          src={shipment.sender.avatar_url}
                          alt={shipment.sender.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-carry-light" />
                      )}
                    </div>
                    {(shipment.sender?.trust_score ?? 0) > 80 && (
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        <ShieldCheck className="w-5 h-5 text-green-500 fill-green-50" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-carry-darker">
                      {shipment.sender?.display_name || "Sender"}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      Verified Sender
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-400 font-bold uppercase">Trust Score</span>
                    <span className="text-carry-light font-black">
                      {shipment.sender?.trust_score ?? "—"}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-carry-light"
                      style={{ width: `${shipment.sender?.trust_score ?? 0}%` }}
                    />
                  </div>
                </div>

                <Button variant="outline" asChild className="w-full font-bold text-[11px] uppercase tracking-widest h-10">
                  <Link to={`/profile/${shipment.sender?.id}`}>
                    View Full Profile
                    <ExternalLink className="w-3.5 h-3.5 ml-2" />
                  </Link>
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
