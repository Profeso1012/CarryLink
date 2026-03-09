import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  MapPin,
  Calendar,
  Package,
  ShieldCheck,
  ChevronRight,
  Loader2,
  Star,
  ArrowRight,
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Share2,
  Flag,
  User,
  ExternalLink,
  Weight,
  Layers,
  Plane,
  X,
  Plus,
  Trash2,
  Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: shipment, isLoading, refetch } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      const response = await apiClient.get(`/shipments/${id}`);
      return response.data.data;
    }
  });

  const isOwner = user?.id === shipment?.sender?.id;

  const addImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      return apiClient.post(`/shipments/${id}/images`, formData);
    },
    onSuccess: () => {
      toast.success("Images added successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add images");
    },
    onSettled: () => setIsUploading(false)
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => apiClient.delete(`/shipments/${id}/images/${imageId}`),
    onSuccess: () => {
      toast.success("Image removed successfully!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete image");
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const currentImagesCount = shipment?.images?.length || 0;
    if (currentImagesCount + files.length > 5) {
      toast.error("A shipment can have at most 5 images.");
      return;
    }

    setIsUploading(true);
    addImagesMutation.mutate(Array.from(files));
  };

  const { data: myListings } = useQuery({
    queryKey: ["my-active-listings"],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const response = await apiClient.get("/travel-listings/mine?status=active");
      const data = response.data.data;
      return (Array.isArray(data) ? data : data?.listings || []) as any[];
    },
    enabled: isAuthenticated && isBidModalOpen
  });

  const initiateMatchMutation = useMutation({
    mutationFn: (listingId: string) => apiClient.post("/matches", {
      travel_listing_id: listingId,
      shipment_request_id: id,
      suggested_by: "traveler"
    }),
    onSuccess: () => {
      toast.success("Proposal sent! The sender has been notified.");
      setIsBidModalOpen(false);
      navigate("/account/matches");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send proposal");
    }
  });

  const handleBidToCarry = () => {
    if (!isAuthenticated) {
      toast.error("Please login to make a proposal");
      return;
    }
    // Check if user has KYC approved (traveler requirements)
    if (user?.kyc_status !== 'approved') {
      toast.error("Identity verification required to carry items. Please complete KYC.");
      navigate("/account/kyc");
      return;
    }
    setIsBidModalOpen(true);
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

  if (!shipment) {
    return (
      <div className="min-h-screen bg-carry-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-carry-darker">Shipment Not Found</h2>
          <p className="text-gray-500 mt-2">The shipment request you are looking for does not exist or has been removed.</p>
          <Button asChild className="mt-6">
            <Link to="/browse/shipments">Browse Other Shipments</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      
      <main className="flex-1 pt-[120px] pb-20">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-gray-400">
            <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/browse/shipments" className="hover:text-carry-light transition-colors">Shipment Requests</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-carry-darker font-medium">Shipment Details</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-5">
                  {/* Image Section */}
                  <div className="md:col-span-2 bg-gray-50/50 flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100 min-h-[350px]">
                    <div className="relative group w-full aspect-square bg-white rounded-sm border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm mb-4">
                      {shipment.images?.length > 0 ? (
                        <img
                          src={activeImage || shipment.images[0].url}
                          alt={shipment.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-carry-light/40" />
                      )}
                    </div>

                    {/* Image Gallery Thumbnails */}
                    {shipment.images?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-2">
                        {shipment.images.map((img: any) => (
                          <div key={img.id} className="relative group">
                            <button
                              onClick={() => setActiveImage(img.url)}
                              className={cn(
                                "w-12 h-12 rounded-sm border-2 overflow-hidden transition-all",
                                (activeImage === img.url || (!activeImage && shipment.images[0].url === img.url))
                                  ? "border-carry-light"
                                  : "border-transparent hover:border-gray-300"
                              )}
                            >
                              <img src={img.url} className="w-full h-full object-cover" alt="" />
                            </button>
                            {isOwner && (
                              <button
                                onClick={() => deleteImageMutation.mutate(img.id)}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}

                        {isOwner && shipment.images.length < 5 && (
                          <label className="w-12 h-12 rounded-sm border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 cursor-pointer hover:border-carry-light hover:text-carry-light transition-all">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    )}

                    {!shipment.images?.length && isOwner && (
                      <label className="flex items-center gap-2 text-carry-light font-bold text-xs uppercase tracking-widest cursor-pointer hover:underline mt-2">
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                        Add Photos
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="md:col-span-3 p-8 space-y-6 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            Open Request
                          </Badge>
                          <Badge className="bg-carry-bg text-carry-muted hover:bg-carry-bg border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            {shipment.category?.name || "General Item"}
                          </Badge>
                        </div>
                        {isOwner && (
                          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            My Shipment
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-black text-carry-darker leading-tight">
                        {shipment.title || shipment.item_description}
                      </h1>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2 font-bold text-carry-darker">
                          <MapPin className="w-4 h-4 text-carry-light" />
                          {shipment.origin_city} &rarr; {shipment.destination_city}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">Declared Weight</span>
                        <span className="text-lg font-bold text-carry-darker">{shipment.declared_weight_kg} kg</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block">Pickup Deadline</span>
                        <span className="text-lg font-bold text-carry-darker">
                          {new Date(shipment.pickup_deadline).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Item Description & Requirements */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-carry-darker">Item Details & Requirements</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm text-carry-muted font-bold uppercase tracking-widest">Full Description</p>
                    <p className="text-base text-carry-darker leading-relaxed">
                      {shipment.item_description || "No detailed description provided."}
                    </p>
                  </div>

                  <hr className="border-gray-50" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-carry-muted uppercase tracking-widest">Item Dimensions</p>
                      <div className="flex items-center gap-4 text-sm font-bold text-carry-darker">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Length</span>
                          <span>{shipment.length_cm || "10"}cm</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Width</span>
                          <span>{shipment.width_cm || "10"}cm</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Height</span>
                          <span>{shipment.height_cm || "10"}cm</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[11px] font-bold text-carry-muted uppercase tracking-widest">Delivery Expectations</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span className="text-sm text-carry-darker">Careful handling required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Reward & Sender */}
            <div className="space-y-6">
              {/* Reward & Sender Card (Mobile and Desktop) */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block mb-1">Offered Reward</span>
                  <div className="text-4xl font-black text-carry-light">
                    {shipment.offered_price} {shipment.currency}
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight pt-2">Full payment held in escrow</p>
                </div>

                {!isOwner ? (
                  <Button
                    onClick={handleBidToCarry}
                    className="w-full h-14 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs shadow-md"
                  >
                    Bid to Carry
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-14 font-bold uppercase tracking-widest text-xs border-carry-light/20 text-carry-light"
                    >
                      <Link to={`/account/my-shipments`}>Manage All My Shipments</Link>
                    </Button>
                    <p className="text-[10px] text-center text-gray-400 font-bold uppercase">This is your shipment request.</p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 pt-2">
                  <button className="flex items-center gap-2 text-[11px] font-bold text-carry-muted uppercase tracking-widest hover:text-carry-light transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <div className="w-[1px] h-4 bg-gray-100"></div>
                  <button className="flex items-center gap-2 text-[11px] font-bold text-carry-muted uppercase tracking-widest hover:text-red-500 transition-colors">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              {/* Sender Profile Card */}
              <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-carry-bg border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                        {shipment.sender.avatar_url ? (
                          <img src={shipment.sender.avatar_url} alt={shipment.sender.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-8 h-8 text-carry-light" />
                        )}
                      </div>
                      {shipment.sender.is_verified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <ShieldCheck className="w-5 h-5 text-green-500 fill-green-50" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-carry-darker">{shipment.sender.display_name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Verified Sender</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-sm text-center">
                      <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-black">5.0</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Avg Rating</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-sm text-center">
                      <div className="text-sm font-black text-carry-darker mb-1">12</div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Shipments</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-400 font-bold uppercase">Trust Score</span>
                      <span className="text-carry-light font-black">{shipment.sender.trust_score || 85}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-carry-light" style={{ width: `${shipment.sender.trust_score || 85}%` }}></div>
                    </div>
                  </div>

                  <Button variant="outline" asChild className="w-full font-bold text-[11px] uppercase tracking-widest h-10">
                    <Link to={`/profile/${shipment.sender.id}`}>
                      View Full Profile
                      <ExternalLink className="w-3.5 h-3.5 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bid Modal */}
      <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-carry-darker text-white">
            <DialogTitle className="text-2xl font-black">Propose to Carry</DialogTitle>
            <DialogDescription className="text-gray-300">
              Select your travel listing to bid on {shipment.sender.display_name}'s shipment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">Your Active Listings</label>
              
              {myListings && myListings.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                  {myListings.map((listing) => (
                    <button
                      key={listing.id}
                      onClick={() => setSelectedListingId(listing.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-sm border transition-all text-left group",
                        selectedListingId === listing.id 
                          ? "border-carry-light bg-carry-bg ring-1 ring-carry-light" 
                          : "border-gray-100 bg-white hover:border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-sm flex items-center justify-center transition-colors",
                        selectedListingId === listing.id ? "bg-carry-light text-white" : "bg-gray-50 text-gray-400 group-hover:text-carry-light"
                      )}>
                        <Plane className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-carry-darker text-sm truncate">{listing.origin_city} &rarr; {listing.destination_city}</h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Departing: {new Date(listing.departure_date).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-carry-light block">{listing.available_capacity_kg}kg</span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Available</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-gray-100 rounded-sm text-center">
                  <Plane className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">You don't have any active travel listings.</p>
                  <Button asChild variant="link" className="text-carry-light font-bold text-xs uppercase mt-2">
                    <Link to="/account/post-trip">Post a Trip</Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 rounded-sm flex gap-3">
              <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-500 leading-relaxed">
                By proposing, you're offering to carry this item at the price requested. The sender can accept your offer or start a chat to negotiate.
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsBidModalOpen(false)}
              className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
            >
              Cancel
            </Button>
            <Button 
              disabled={!selectedListingId || initiateMatchMutation.isPending}
              onClick={() => selectedListingId && initiateMatchMutation.mutate(selectedListingId)}
              className="flex-1 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12"
            >
              {initiateMatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
