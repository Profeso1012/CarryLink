import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Camera,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { categoriesApi } from "@/api/categories.api";
import { shipmentsApi } from "@/api/shipments.api";
import { dashboardApi } from "@/api/dashboard.api";
import { matchesApi } from "@/api/matches.api";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const { data: shipment, isLoading, refetch } = useQuery({
    queryKey: ["shipment", id],
    queryFn: async () => {
      return shipmentsApi.getById(id!);
    }
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.getAll()
  });

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name || "General Item";
  };

  const isOwner = user?.id === shipment?.sender?.id;

  const { data: matchingListings } = useQuery({
    queryKey: ["matches-for-shipment", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await matchesApi.getForShipment(id, { limit: 10 });
      return response;
    },
    enabled: !!id
  });

  const addImagesMutation = useMutation({
    mutationFn: async (files: File[]) => {
      return shipmentsApi.addImages(id!, files);
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
    mutationFn: (imageId: string) => shipmentsApi.deleteImage(id!, imageId),
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
      return dashboardApi.getMyTrips();
    },
    enabled: isAuthenticated && isBidModalOpen
  });

  const senderRequestMutation = useMutation({
    mutationFn: (listingId: string) => matchesApi.senderRequest({
      listing_id: listingId,
      shipment_id: id!,
      message: requestMessage
    }),
    onSuccess: () => {
      toast.success("Request sent! The traveler will be notified.");
      setIsBidModalOpen(false);
      setSelectedListingId(null);
      setRequestMessage("");
      navigate("/account/matches");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.data?.message || "Failed to send request");
    }
  });

  const updateShipmentMutation = useMutation({
    mutationFn: (data: any) => shipmentsApi.update(id!, data),
    onSuccess: () => {
      toast.success("Shipment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      setIsEditing(null);
      setEditValues({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update shipment");
    }
  });

  const handleSendRequest = () => {
    if (!isAuthenticated) {
      toast.error("Please login to send a request");
      return;
    }
    setIsBidModalOpen(true);
  };

  const handleSubmitRequest = () => {
    if (!selectedListingId) {
      toast.error("Please select a listing");
      return;
    }
    senderRequestMutation.mutate(selectedListingId);
  };

  const handleEdit = (field: string) => {
    setIsEditing(field);
    setEditValues({ [field]: shipment[field] });
  };

  const handleSaveEdit = () => {
    if (isEditing && editValues[isEditing] !== undefined) {
      updateShipmentMutation.mutate({ [isEditing]: editValues[isEditing] });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditValues({});
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
                            {getCategoryName(shipment.item_category_id)}
                          </Badge>
                        </div>
                        {isOwner && (
                          <Badge className="bg-blue-50 text-blue-600 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                            My Shipment
                          </Badge>
                        )}
                      </div>
                      <h1 className="text-3xl font-black text-carry-darker leading-tight relative">
                        {isEditing === 'title' ? (
                          <div className="space-y-2">
                            <Input
                              value={editValues.title || ''}
                              onChange={(e) => setEditValues({...editValues, title: e.target.value})}
                              className="text-2xl font-black"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {shipment.title || shipment.item_description}
                            {isOwner && (
                              <button
                                onClick={() => handleEdit('title')}
                                className="absolute -right-8 top-1 p-1 text-gray-400 hover:text-carry-light transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </h1>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2 font-bold text-carry-darker">
                          <MapPin className="w-4 h-4 text-carry-light" />
                          {shipment.origin_city} &rarr; {shipment.destination_city}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-50 relative">
                      {isEditing === 'weight_deadline' ? (
                        <div className="col-span-2 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase">Declared Weight (kg)</label>
                              <Input
                                type="number"
                                value={editValues.declared_weight_kg || ''}
                                onChange={(e) => setEditValues({...editValues, declared_weight_kg: parseFloat(e.target.value)})}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-bold text-gray-600 uppercase">Pickup Deadline</label>
                              <Input
                                type="date"
                                value={editValues.pickup_deadline || ''}
                                onChange={(e) => setEditValues({...editValues, pickup_deadline: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                          {isOwner && (
                            <button
                              onClick={() => {
                                setIsEditing('weight_deadline');
                                setEditValues({
                                  declared_weight_kg: shipment.declared_weight_kg,
                                  pickup_deadline: shipment.pickup_deadline?.split('T')[0]
                                });
                              }}
                              className="absolute -right-8 top-0 p-2 text-gray-400 hover:text-carry-light transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
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
                      {isEditing === 'item_description' ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editValues.item_description || ''}
                            onChange={(e) => setEditValues({...editValues, item_description: e.target.value})}
                            className="min-h-[100px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <p className="text-base text-carry-darker leading-relaxed">
                            {shipment.item_description || "No detailed description provided."}
                          </p>
                          {isOwner && (
                            <button
                              onClick={() => handleEdit('item_description')}
                              className="absolute -right-8 top-0 p-1 text-gray-400 hover:text-carry-light transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
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
                <div className="space-y-2 relative">
                  <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block mb-1">Offered Reward</span>
                  {isOwner && (
                    <button
                      onClick={() => handleEdit('offered_price')}
                      className="absolute top-0 right-0 p-1 text-gray-400 hover:text-carry-light transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                  {isEditing === 'offered_price' ? (
                    <div className="space-y-2">
                      <Input
                        type="number"
                        value={editValues.offered_price || ''}
                        onChange={(e) => setEditValues({...editValues, offered_price: parseFloat(e.target.value)})}
                        className="text-2xl font-black text-center"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-4xl font-black text-carry-light">
                      {shipment.offered_price} {shipment.currency}
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tight pt-2">Full payment held in escrow</p>
                </div>

                {!isOwner ? (
                  <Button
                    onClick={handleSendRequest}
                    className="w-full h-14 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs shadow-md"
                  >
                    Send a Request
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

      {/* Sender Request Modal */}
      <Dialog open={isBidModalOpen} onOpenChange={setIsBidModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none">
          <DialogHeader className="p-8 bg-carry-darker text-white">
            <DialogTitle className="text-2xl font-black">Send a Request</DialogTitle>
            <DialogDescription className="text-gray-300">
              Select a traveler whose listing matches your shipment route and send them a request.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
            {/* Matching Listings */}
            <div className="space-y-4">
              <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">Matching Travel Listings</label>

              {matchingListings && matchingListings.matches && matchingListings.matches.length > 0 ? (
                <div className="space-y-3">
                  {matchingListings.matches.map((match) => (
                    <button
                      key={match.match_id}
                      onClick={() => setSelectedListingId(match.match_id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-sm border transition-all text-left group",
                        selectedListingId === match.match_id
                          ? "border-carry-light bg-carry-bg ring-1 ring-carry-light"
                          : "border-gray-100 bg-white hover:border-gray-200"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-sm flex items-center justify-center transition-colors shrink-0",
                        selectedListingId === match.match_id ? "bg-carry-light text-white" : "bg-gray-50 text-gray-400 group-hover:text-carry-light"
                      )}>
                        <Plane className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-carry-darker text-sm">
                          {match.travel_listing?.traveler?.display_name || "Traveler"}
                        </h5>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                          {match.travel_listing?.origin_city} → {match.travel_listing?.destination_city}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-carry-light block">
                          Match: {Math.round(match.match_score)}%
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase">
                          {match.travel_listing?.available_capacity_kg}kg available
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 border-2 border-dashed border-gray-100 rounded-sm text-center">
                  <Plane className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No travelers found going to your destination at this time.</p>
                </div>
              )}
            </div>

            {selectedListingId && (
              <>
                {/* Message */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted block ml-1">Message to Traveler (Optional)</label>
                  <textarea
                    placeholder="Introduce yourself and provide any details about your shipment..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="w-full min-h-[100px] p-3 border border-gray-100 rounded-sm focus:border-carry-light focus:outline-none resize-none text-sm"
                  />
                </div>
              </>
            )}

            <div className="p-4 bg-blue-50 rounded-sm flex gap-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Once sent, the traveler will review your request and can accept or start a conversation to discuss details.
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsBidModalOpen(false);
                setSelectedListingId(null);
                setRequestMessage("");
              }}
              className="flex-1 font-bold uppercase tracking-widest text-xs h-12"
            >
              Cancel
            </Button>
            <Button
              disabled={!selectedListingId || senderRequestMutation.isPending}
              onClick={handleSubmitRequest}
              className="flex-1 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs h-12"
            >
              {senderRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Sending...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" /> Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
