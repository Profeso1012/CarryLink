import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Package, 
  ShieldCheck, 
  ChevronRight, 
  Loader2, 
  Filter,
  Star,
  ArrowRight,
  Info,
  DollarSign,
  Layers,
  Weight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { shipmentsApi } from "@/api/shipments.api";
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

export default function BrowseShipments() {
  const [filters, setFilters] = useState({
    origin_country: "NG",
    destination_country: "GB",
    page: 1,
    limit: 10,
    sort: "newest"
  });

  const { data, isLoading } = useQuery({
    queryKey: ["browse-shipments", filters],
    queryFn: async () => {
      return shipmentsApi.getAll({
        origin_country: filters.origin_country,
        destination_country: filters.destination_country,
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit,
      });
    }
  });

  const shipments = data?.requests || [];
  const meta = data?.pagination || { total: 0, limit: 10, offset: 0, hasMore: false };

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      
      <main className="flex-1 pt-[100px] pb-20">
        <div className="max-w-[1400px] mx-auto px-6 md:px-[56px] space-y-8">
          
          {/* Hero / Filter Section */}
          <div className="bg-white rounded-sm border border-carry-light/10 shadow-sm p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1">From (Origin)</label>
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
                <label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted ml-1">To (Destination)</label>
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
                    <SelectItem value="pickup_deadline">Pickup Deadline</SelectItem>
                    <SelectItem value="reward_desc">Highest Reward</SelectItem>
                    <SelectItem value="weight_desc">Heaviest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="h-12 px-8 bg-carry-light hover:bg-carry-light/90 text-white font-bold uppercase tracking-widest text-xs">
                Search Shipments
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-carry-darker">Available Shipment Requests ({meta.total})</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Showing page {filters.page} of {Math.ceil(meta.total / meta.limit) || 1}</span>
            </div>
          </div>

          {/* Shipments List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : shipments.length > 0 ? (
              shipments.map((shipment: any) => (
                <div 
                  key={shipment.id} 
                  className="bg-white rounded-sm border border-carry-light/10 shadow-sm hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Item Image / Sender Info */}
                    <div className="md:w-64 p-6 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col items-center text-center justify-center space-y-4">
                      <div className="relative group/img">
                        <div className="w-24 h-24 rounded-sm bg-white border border-carry-light/10 flex items-center justify-center overflow-hidden shadow-sm">
                          {shipment.images?.length > 0 ? (
                            <img src={shipment.images[0].url} alt={shipment.item_description} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-carry-light/40" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-white border border-carry-light/10 overflow-hidden mb-2">
                          {shipment.avatar_url ? (
                            <img src={shipment.avatar_url} alt={shipment.display_name || `${shipment.first_name} ${shipment.last_name}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-carry-light flex items-center justify-center h-full bg-carry-bg">
                              {(shipment.display_name || shipment.first_name || 'U')[0]}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-carry-darker text-[13px]">
                          {shipment.display_name || `${shipment.first_name} ${shipment.last_name}`}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-amber-500 fill-current" />
                          <span className="text-[10px] font-bold text-gray-400">{shipment.trust_score || 0}% Trust</span>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/profile/${shipment.sender_id}`}
                        className="text-[10px] font-bold text-carry-light uppercase tracking-widest hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>

                    {/* Shipment Content */}
                    <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-carry-darker leading-tight group-hover:text-carry-light transition-colors">
                            {shipment.item_description}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge className="bg-carry-bg text-carry-muted hover:bg-carry-bg border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                              {shipment.category_name || "General Item"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest mb-1">Route</span>
                            <div className="flex items-center gap-1.5 font-bold text-carry-darker text-sm">
                              {shipment.origin_city}
                              <ArrowRight className="w-3 h-3 text-carry-light/40" />
                              {shipment.destination_city}
                            </div>
                          </div>
                          
                          <div className="w-[1px] h-8 bg-gray-100"></div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light shrink-0">
                              <Weight className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Declared Weight</span>
                              <span className="text-xs font-bold text-carry-darker">{shipment.declared_weight_kg} kg</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-6 pt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Deadline</span>
                              <span className="text-xs font-bold text-carry-darker">{new Date(shipment.pickup_deadline).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                          </div>
                          {shipment.verified_sender && (
                            <Badge className="bg-green-50 text-green-600 hover:bg-green-50 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider h-fit self-center">
                              Verified Sender
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-start md:items-end justify-between md:h-full gap-4 shrink-0">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest block mb-1">Offered Reward</span>
                          <span className="text-2xl font-black text-carry-light">{shipment.offered_price} {shipment.currency}</span>
                        </div>
                        <Button asChild className="w-full md:w-auto bg-carry-darker hover:bg-carry-darker/90 text-white font-bold h-12 px-8 uppercase tracking-widest text-xs">
                          <Link to={`/shipments/${shipment.id}`}>
                            View Details
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-sm border border-carry-light/10 p-20 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted mb-6">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker mb-2">No shipments found</h3>
                <p className="text-gray-500 max-w-sm">
                  We couldn't find any shipment requests matching your criteria. Try adjusting your filters or check back later.
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
