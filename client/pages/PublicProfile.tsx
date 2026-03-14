import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  User, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Calendar, 
  Package, 
  Plane, 
  Loader2, 
  CheckCircle2,
  Clock,
  ArrowRight,
  MessageSquare,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PublicProfile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("listings");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: async () => {
      const response = await apiClient.get(`/users/${id}`);
      return response.data.data;
    }
  });

  const { data: userActivity } = useQuery({
    queryKey: ["user-activity", id],
    queryFn: async () => {
      const [listingsRes, shipmentsRes] = await Promise.all([
        apiClient.get(`/travel-listings/browse?limit=50&page=1`),
        apiClient.get(`/shipments/browse?limit=50&page=1`)
      ]);

      // Filter results by user_id on client side
      const allListings = listingsRes.data.data?.listings || [];
      const allShipments = shipmentsRes.data.data?.shipments || [];

      const userListings = allListings.filter((listing: any) => listing.user_id === id || listing.traveler?.id === id);
      const userShipments = allShipments.filter((shipment: any) => shipment.user_id === id || shipment.sender?.id === id);

      return {
        listings: userListings,
        shipments: userShipments,
        listingsCount: userListings.length,
        shipmentsCount: userShipments.length
      };
    },
    enabled: !!id
  });

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

  if (!profile) {
    return (
      <div className="min-h-screen bg-carry-bg flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Info className="w-12 h-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-carry-darker">Profile Not Found</h2>
          <p className="text-gray-500 mt-2">The user profile you are looking for does not exist.</p>
          <Button asChild className="mt-6">
            <Link to="/">Return Home</Link>
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
          
          {/* Profile Header Card */}
          <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm overflow-hidden">
            <div className="h-32 bg-carry-darker relative">
              <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full shadow-md">
                <div className="w-24 h-24 rounded-full bg-carry-bg border-4 border-white flex items-center justify-center overflow-hidden">
                  {profile.avatar_url || profile.profile?.avatar_url ? (
                    <img src={profile.avatar_url || profile.profile?.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-carry-light" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 max-w-2xl">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-carry-darker">{profile.display_name}</h1>
                    {profile.kyc_status === 'approved' && (
                      <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.country_of_residence || "Nigeria"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Joined {new Date(profile.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-carry-muted leading-relaxed">
                  {profile.bio || "No bio provided."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {profile.badges?.map((badge: string) => (
                    <Badge key={badge} variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-carry-light/20 text-carry-light bg-carry-light/5">
                      {badge.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="w-full md:w-auto space-y-4">
                <div className="bg-gray-50 rounded-sm p-6 flex flex-col items-center justify-center text-center min-w-[200px]">
                  <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest mb-1">Trust Score</span>
                  <div className="text-3xl font-black text-carry-light">
                    {profile.trust_score}/100
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < Math.round((profile.rating || 0) / 20) ? 'fill-current' : ''}`}
                      />
                    ))}
                    <span className="text-[10px] font-bold text-gray-500 ml-1">({profile.rating ? (profile.rating / 20).toFixed(1) : 'N/A'}/5)</span>
                  </div>
                </div>
                <Button className="w-full bg-carry-darker hover:bg-carry-darker/90 text-white font-bold h-12 uppercase tracking-widest text-xs">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message User
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 border-t border-gray-100">
              <div className="p-6 text-center border-r border-gray-100">
                <span className="block text-xl font-black text-carry-darker">{profile.total_trips_as_traveler || profile.total_deliveries_as_traveler || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Travels Done</span>
              </div>
              <div className="p-6 text-center border-r border-gray-100">
                <span className="block text-xl font-black text-carry-darker">{profile.total_shipments_as_sender || profile.total_deliveries_as_sender || 0}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items Sent</span>
              </div>
              <div className="p-6 text-center border-r border-gray-100">
                <span className="block text-xl font-black text-carry-darker">{profile?.success_rate ? `${Math.round(profile.success_rate)}%` : 'N/A'}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Success Rate</span>
              </div>
              <div className="p-6 text-center">
                <span className="block text-xl font-black text-carry-darker">{profile?.average_rating ? `${profile.average_rating.toFixed(1)}/5` : 'N/A'}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Average Rating</span>
              </div>
            </div>
          </div>

          {/* Activity Tabs */}
          <div className="space-y-6">
            <Tabs defaultValue="listings" className="w-full" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between border-b border-gray-100 pb-px">
                <TabsList className="bg-transparent h-auto p-0 gap-8">
                  <TabsTrigger
                    value="listings"
                    className="bg-transparent border-none p-0 pb-4 rounded-none font-bold text-[11px] uppercase tracking-widest text-gray-400 data-[state=active]:text-carry-light data-[state=active]:shadow-[0_2px_0_0_#1DA1F2] transition-all"
                  >
                    Active Listings ({userActivity?.listings?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="shipments"
                    className="bg-transparent border-none p-0 pb-4 rounded-none font-bold text-[11px] uppercase tracking-widest text-gray-400 data-[state=active]:text-carry-light data-[state=active]:shadow-[0_2px_0_0_#1DA1F2] transition-all"
                  >
                    Active Shipments ({userActivity?.shipments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="bg-transparent border-none p-0 pb-4 rounded-none font-bold text-[11px] uppercase tracking-widest text-gray-400 data-[state=active]:text-carry-light data-[state=active]:shadow-[0_2px_0_0_#1DA1F2] transition-all"
                  >
                    Reviews ({profile?.review_count || 0})
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="pt-8">
                <TabsContent value="listings" className="mt-0 space-y-4 outline-none">
                  {userActivity?.listings?.length ? (
                    userActivity.listings.map((listing: any) => (
                      <div key={listing.id} className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light">
                            <Plane className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 font-bold text-carry-darker">
                              {listing.origin_city}
                              <ArrowRight className="w-3 h-3 text-carry-light/40" />
                              {listing.destination_city}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                              <span>Departing: {new Date(listing.departure_date).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                              <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                              <span>{listing.available_capacity_kg}kg available</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-carry-muted uppercase block">Starting From</span>
                            <span className="text-lg font-black text-carry-light">{listing.price_per_kg} {listing.currency}/kg</span>
                          </div>
                          <Button asChild variant="outline" className="font-bold text-[10px] uppercase tracking-widest h-10 px-6">
                            <Link to={`/listings/${listing.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center bg-white rounded-sm border border-dashed border-gray-100">
                      <Plane className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No active travel listings at the moment.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="shipments" className="mt-0 space-y-4 outline-none">
                  {userActivity?.shipments?.length ? (
                    userActivity.shipments.map((shipment: any) => (
                      <div key={shipment.id} className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light overflow-hidden">
                            {shipment.images?.[0]?.url ? (
                              <img src={shipment.images[0].url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-6 h-6" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-carry-darker leading-tight">{shipment.title || shipment.item_description}</h4>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-bold uppercase tracking-tight">
                              <span>{shipment.origin_city} &rarr; {shipment.destination_city}</span>
                              <div className="w-1 h-1 rounded-full bg-gray-200"></div>
                              <span>Deadline: {new Date(shipment.pickup_deadline).toLocaleDateString([], { day: '2-digit', month: 'short' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-carry-muted uppercase block">Offer Reward</span>
                            <span className="text-lg font-black text-carry-light">{shipment.offered_price} {shipment.currency}</span>
                          </div>
                          <Button asChild variant="outline" className="font-bold text-[10px] uppercase tracking-widest h-10 px-6">
                            <Link to={`/shipments/${shipment.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center bg-white rounded-sm border border-dashed border-gray-100">
                      <Package className="w-8 h-8 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">No active shipment requests at the moment.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reviews" className="mt-0 outline-none">
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-sm border border-gray-100 p-6 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-xs font-bold text-carry-light">JD</div>
                            <div>
                              <h5 className="font-bold text-carry-darker text-sm">John Doe</h5>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">March 2025 · Sender</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-carry-muted leading-relaxed italic">
                          "{profile.display_name} was extremely professional and communicated every step of the way. My package arrived safely and even earlier than expected. Highly recommend!"
                        </p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
