import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { travelListingsApi } from "@/api/travel-listings.api";
import { usersApi } from "@/api/users.api";
import { useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Plane, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  Filter,
  Star,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BrowseListings() {
  const [filters, setFilters] = useState({
    origin_country: "NG",
    destination_country: "GB",
    page: 1,
    limit: 10,
    sort: "newest"
  });

  const [listingsWithUsers, setListingsWithUsers] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["browse-listings", filters],
    queryFn: async () => {
      return travelListingsApi.browse(filters);
    }
  });

  const listings = data?.data?.listings || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 10 };

  // Fetch user profiles for each listing
  useEffect(() => {
    const fetchUsersForListings = async () => {
      if (!listings.length) {
        setListingsWithUsers([]);
        return;
      }

      const listingsWithUserData = await Promise.all(
        listings.map(async (listing: any) => {
          try {
            // Use user_id from API response to fetch user profile
            const userId = listing.user_id || listing.traveler_id;

            // Check if traveler data is already in listing
            if (listing.traveler) {
              return listing;
            }

            const userProfile = await usersApi.getPublicProfile(userId);
            return {
              ...listing,
              traveler: {
                id: userProfile.id,
                display_name: userProfile.display_name,
                avatar_url: userProfile.avatar_url,
                trust_score: userProfile.trust_score,
                total_deliveries_as_traveler: userProfile.total_deliveries || 0,
                badges: userProfile.badges?.map((b: any) => b.type) || []
              }
            };
          } catch (error) {
            const userId = listing.user_id || listing.traveler_id;
            console.error(`Failed to fetch user ${userId}:`, error);
            return {
              ...listing,
              traveler: listing.traveler || {
                id: userId,
                display_name: "Unknown Traveler",
                avatar_url: null,
                trust_score: 0,
                total_deliveries_as_traveler: 0,
                badges: []
              }
            };
          }
        })
      );
      setListingsWithUsers(listingsWithUserData);
    };

    fetchUsersForListings();
  }, [listings]);

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      
      <main className="flex-1 pt-[100px] pb-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-[56px] space-y-8">
          
          {/* Hero / Filter Section */}
          <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1">Origin Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Select 
                    value={filters.origin_country} 
                    onValueChange={(v) => setFilters(f => ({ ...f, origin_country: v }))}
                  >
                    <SelectTrigger className="pl-10 h-12 bg-gray-50/50 border-gray-100 font-medium">
                      <SelectValue placeholder="Select origin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NG">Nigeria (NG)</SelectItem>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                      <SelectItem value="CA">Canada (CA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-center md:pb-3">
                <ArrowRight className="w-5 h-5 text-carry-light rotate-90 md:rotate-0" />
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1">Destination Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Select 
                    value={filters.destination_country} 
                    onValueChange={(v) => setFilters(f => ({ ...f, destination_country: v }))}
                  >
                    <SelectTrigger className="pl-10 h-12 bg-gray-50/50 border-gray-100 font-medium">
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                      <SelectItem value="NG">Nigeria (NG)</SelectItem>
                      <SelectItem value="US">United States (US)</SelectItem>
                      <SelectItem value="CA">Canada (CA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1">Sort By</label>
                <Select 
                  value={filters.sort} 
                  onValueChange={(v) => setFilters(f => ({ ...f, sort: v }))}
                >
                  <SelectTrigger className="h-12 bg-gray-50/50 border-gray-100 font-medium">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="departure_soon">Departing Soon</SelectItem>
                    <SelectItem value="price_asc">Lowest Price</SelectItem>
                    <SelectItem value="trust_score_desc">Highest Trust</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="h-12 px-8 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs">
                Search Flights
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-carry-darker">Available Travel Listings ({meta.total})</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Showing page {meta.page} of {Math.ceil(meta.total / meta.limit) || 1}</span>
            </div>
          </div>

          {/* Listings List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : listings.length > 0 ? (
              listingsWithUsers.map((listing: any) => (
                <div 
                  key={listing.id} 
                  className="bg-white rounded-sm border border-carry-light/10 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Traveler Info */}
                    <div className="md:w-64 p-6 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col items-center text-center justify-center space-y-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-white border-2 border-carry-light/20 flex items-center justify-center overflow-hidden">
                          {listing.traveler?.avatar_url ? (
                            <img src={listing.traveler.avatar_url} alt={listing.traveler.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-bold text-carry-light">{listing.traveler?.display_name?.[0] || "?"}</span>
                          )}
                        </div>
                        {listing.traveler?.badges?.includes("verified_traveler") && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <ShieldCheck className="w-5 h-5 text-green-500 fill-green-50" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-carry-darker text-sm">{listing.traveler?.display_name || "Unknown Traveler"}</h4>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                          <span className="text-[11px] font-bold text-gray-500">{listing.traveler?.trust_score || 0}/100 Trust</span>
                        </div>
                      </div>
                      <Link
                        to={`/profile/${listing.traveler?.id}`}
                        className="text-[10px] font-bold text-carry-light uppercase tracking-widest hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>

                    {/* Listing Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest mb-1">Origin</span>
                            <span className="text-lg font-bold text-carry-darker">{listing.origin_city}, {listing.origin_country}</span>
                          </div>
                          <div className="flex flex-col items-center px-4">
                            <Plane className="w-5 h-5 text-carry-light/40" />
                            <div className="w-full h-[2px] bg-gray-100 mt-2 relative">
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-carry-light"></div>
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest mb-1">Destination</span>
                            <span className="text-lg font-bold text-carry-darker">{listing.destination_city}, {listing.destination_country}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Departure</span>
                              <span className="text-xs font-bold text-carry-darker">{new Date(listing.departure_date).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
                              <span className="text-[10px] font-black">{listing.available_capacity_kg}kg</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Available Space</span>
                              <span className="text-xs font-bold text-carry-darker">Capacity: {listing.total_capacity_kg}kg</span>
                            </div>
                          </div>
                          {listing.is_verified_flight && (
                            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider h-fit self-center">
                              Verified Flight
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-between md:h-full gap-4 shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block mb-1">Starting From</span>
                          <span className="text-2xl font-black text-carry-light">{listing.price_per_kg} {listing.currency} <span className="text-xs font-bold text-gray-400">/ kg</span></span>
                        </div>
                        <Button asChild className="w-full md:w-auto bg-carry-darker hover:bg-carry-darker/90 text-white font-bold h-12 px-8 uppercase tracking-widest text-xs">
                          <Link to={`/listings/${listing.id}`}>
                            View Details
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Accepted Categories Preview */}
                  <div className="px-8 py-3 bg-gray-50/30 border-t border-gray-50 flex items-center gap-3 overflow-hidden">
                    <Info className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Will Carry:</span>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                      {Array.isArray(listing.accepted_categories) && listing.accepted_categories.map((cat: any, idx: number) => {
                        const name = typeof cat === 'object' && cat !== null ? cat.name : String(cat);
                        const id = typeof cat === 'object' && cat !== null ? cat.id : idx;
                        return (
                          <span key={id} className="text-[10px] font-bold text-carry-muted bg-white px-2 py-0.5 rounded-sm border border-gray-100 whitespace-nowrap">
                            {String(name)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-sm border border-carry-light/10 p-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted mb-6">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker mb-2">No listings found</h3>
                <p className="text-gray-500 max-w-sm">
                  We couldn't find any travel listings matching your criteria. Try adjusting your filters or check back later.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ origin_country: "NG", destination_country: "GB", page: 1, limit: 10, sort: "newest" })}
                  className="mt-8 font-bold text-xs uppercase tracking-widest"
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta.total > meta.limit && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <Button 
                variant="outline" 
                disabled={filters.page === 1}
                onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                className="font-bold text-xs uppercase tracking-widest"
              >
                Previous
              </Button>
              {[...Array(Math.ceil(meta.total / meta.limit))].map((_, i) => (
                <Button
                  key={i}
                  variant={filters.page === i + 1 ? "default" : "outline"}
                  onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
                  className={cn(
                    "w-10 h-10 p-0 font-bold",
                    filters.page === i + 1 ? "bg-carry-light text-white" : ""
                  )}
                >
                  {i + 1}
                </Button>
              ))}
              <Button 
                variant="outline" 
                disabled={filters.page >= Math.ceil(meta.total / meta.limit)}
                onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                className="font-bold text-xs uppercase tracking-widest"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
