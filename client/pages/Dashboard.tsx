import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
  MoreVertical,
  Search,
  Filter,
  Loader2,
  Wallet,
  Bell,
  TrendingUp,
  Plus,
  Send,
  Plane,
  ChevronRight,
  Users,
  Star,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import AccountLayout from "@/components/layout/AccountLayout";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { dashboardApi } from "@/api/dashboard.api";
import { matchesApi } from "@/api/matches.api";
import { formatTrustScore, formatCurrency, safeNumber } from "@/lib/format-utils";
import { usersApi } from "@/api/users.api";
import OnboardingTutorial from "@/components/tutorial/OnboardingTutorial";
import { useSearchParams } from "react-router-dom";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_transit: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    pending_payment: "bg-orange-100 text-orange-700",
    disputed: "bg-red-100 text-red-700",
    payment_held: "bg-amber-100 text-amber-700",
    open: "bg-green-100 text-green-700"
  };

  const labels: Record<string, string> = {
    in_transit: "In Transit",
    delivered: "Delivered",
    pending_payment: "Payment Required",
    disputed: "Disputed",
    payment_held: "Funds Held",
    open: "Open"
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", styles[status] || "bg-gray-100 text-gray-600")}>
      {labels[status] || status.replace("_", " ")}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [isTutorialOpen, setIsTutorialOpen] = useState(searchParams.get("tutorial") === "true");

  const results = useQueries({
    queries: [
      { queryKey: ["user-me"], queryFn: () => usersApi.getMyProfile() },
      { queryKey: ["dashboard-stats"], queryFn: () => dashboardApi.getStats() },
      { queryKey: ["recent-bookings"], queryFn: () => dashboardApi.getRecentBookings(5) },
      { queryKey: ["wallet-balance"], queryFn: () => dashboardApi.getWalletBalance() },
      { queryKey: ["unread-notifications"], queryFn: () => dashboardApi.getNotifications(true) },
      { queryKey: ["active-listings"], queryFn: async () => {
        try {
          // Get user's shipments first
          const shipmentsResponse = await dashboardApi.getMyShipments();
          const shipments = shipmentsResponse?.requests || [];
          
          if (shipments.length === 0) return [];
          
          // Get matches for the first few shipments
          const allMatches = [];
          for (const shipment of shipments.slice(0, 3)) {
            try {
              const matchesResponse = await matchesApi.getForShipment(shipment.id, { limit: 2 });
              if (matchesResponse && matchesResponse.matches) {
                allMatches.push(...matchesResponse.matches);
              }
            } catch (error) {
              console.warn(`Failed to get matches for shipment ${shipment.id}:`, error);
            }
          }
          return allMatches.slice(0, 4);
        } catch (error) {
          console.warn('Failed to get matches for dashboard:', error);
          return [];
        }
      } }
    ]
  });

  const [meData, statsData, bookingsData, balanceData, notificationsData, listingsData] = results.map(r => r.data);
  const isLoading = results.some(r => r.isLoading);

  // Use meData for trust score and KYC status for better accuracy
  const displayUser = meData || user;
  const bookings = bookingsData;
  const balance = balanceData;
  const notifications = notificationsData;
  const listings = listingsData;

  const stats = [
    { label: "Active Bookings", value: (statsData as any)?.active_shipments?.toString() || "0", icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Unread Alerts", value: (notifications as any)?.length?.toString() || "0", icon: Bell, color: "text-red-500", bg: "bg-red-50" },
    { label: "Wallet Balance", value: balance ? formatCurrency((balance as any).available_balance, (balance as any).currency) : "$0.00", icon: Wallet, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Trust Score", value: (statsData as any)?.trust_score ? `${(statsData as any).trust_score}/100` : ((displayUser as any)?.trust_score ? `${(displayUser as any).trust_score}/100` : "0/100"), icon: ShieldCheck, color: "text-carry-light", bg: "bg-carry-light/10" }
  ];

  return (
    <AccountLayout>
      <OnboardingTutorial isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-carry-darker font-medium">Dashboard</span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-carry-darker tracking-tight">Welcome back, {(displayUser as any)?.first_name || user?.first_name}!</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-carry-muted">Your Dashboard Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-carry-light/10 flex items-center gap-4 group hover:shadow-md transition-all">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">{stat.label}</span>
                <span className="text-xl font-bold text-carry-darker tracking-tight">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* KYC Banner if not verified */}
        {(displayUser as any)?.kyc_status !== "approved" && (
          <div className="bg-carry-darker rounded-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-[6px] border-carry-light shadow-lg">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-bold text-lg leading-tight">
                  {user?.kyc_status === "pending" ? "Verification in Progress" : "Identity Verification Required"}
                </h3>
                <p className="text-white/60 text-sm max-w-lg leading-relaxed">
                  {user?.kyc_status === "pending"
                    ? "Your documents are being reviewed. We'll notify you once the verification is complete."
                    : "To ensure safety and trust within our community, all travelers must complete a one-time identity verification before they can post trips."}
                </p>
              </div>
            </div>
            <Link to="/account/kyc" className="bg-carry-light text-white px-8 py-3 rounded-sm font-bold text-sm hover:bg-carry-light/90 transition-all whitespace-nowrap shadow-sm">
              {user?.kyc_status === "pending" ? "Check Status" : "Verify Identity"}
            </Link>
          </div>
        )}

        {/* Recent Activity Section */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Recent Activity</h3>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search bookings..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-carry-light w-full md:w-64"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-sm text-gray-400 hover:text-carry-light hover:border-carry-light transition-all">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-carry-light" /></div>
            ) : bookings && (bookings as any).length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                    <th className="px-6 py-4">Item Details</th>
                    <th className="px-6 py-4">Route / Date</th>
                    <th className="px-6 py-4">Total Payout</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(bookings as any).map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-sm bg-carry-bg flex items-center justify-center text-carry-light transition-all shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-carry-darker text-[14px]">{booking.shipment_title || "Shipment Request"}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ID: {booking.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-carry-muted text-[13px]">{booking.route || "Corridor Search"}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(booking.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-bold text-carry-darker text-[14px]">
                        {booking.total_amount || booking.offered_price} {booking.currency}
                      </td>
                      <td className="px-6 py-5">
                        <StatusBadge status={booking.status} />
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
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-carry-darker">No recent activity</h3>
                <p className="text-gray-500 max-w-sm">Your delivery bookings and shipment requests will appear here once you start using the platform.</p>
                <div className="flex items-center gap-4 pt-4">
                  <Link to="/account/send-package" className="px-6 py-2 bg-carry-light text-white rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-[#1aa6d4] transition-all flex items-center gap-2">
                    <Send className="w-3.5 h-3.5" />
                    Send a Package
                  </Link>
                  <Link to="/account/post-trip" className="px-6 py-2 border border-carry-light text-carry-light rounded-sm text-[11px] font-bold uppercase tracking-widest hover:bg-carry-light/5 transition-all flex items-center gap-2">
                    <Plane className="w-3.5 h-3.5" />
                    Post a Trip
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Showing {(bookings as any)?.length || 0} recent transactions</p>
            <Link to="/account/my-shipments" className="text-[11px] font-bold uppercase tracking-widest text-carry-light hover:underline flex items-center gap-1.5 transition-all">
              View All History
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Verified Travelers Section */}
        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted flex items-center gap-2">
              <Users className="w-4 h-4 text-carry-light" />
              Verified Travelers on Your Routes
            </h3>
            <Link to="/browse/listings" className="text-[11px] font-bold text-carry-light hover:underline uppercase tracking-widest flex items-center gap-1.5">
              Browse all travelers
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings && (listings as any).length > 0 ? (listings as any).map((match: any) => {
              const listing = match.travel_listing;
              if (!listing) return null;
              
              return (
                <div key={match.match_id} className="bg-white rounded-sm border border-gray-100 group hover:border-carry-light/50 hover:shadow-md transition-all overflow-hidden flex flex-col">
                  <div className="relative h-40 bg-gray-100 flex items-center justify-center">
                    {match.shipment_request?.images?.[0]?.url ? (
                      <img
                        src={match.shipment_request.images[0].url}
                        alt={match.shipment_request.item_description}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-gray-300" />
                    )}
                    <span className={cn(
                      "absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm",
                      match.status === 'suggested' ? 'bg-blue-100 text-blue-700' :
                      match.status === 'sender_requested' ? 'bg-amber-100 text-amber-700' :
                      match.status === 'negotiating' ? 'bg-green-100 text-green-700' :
                      match.status === 'payment_requested' ? 'bg-purple-100 text-purple-700' :
                      'bg-carry-light text-white'
                    )}>
                      {match.status === 'suggested' ? 'Suggested' :
                       match.status === 'sender_requested' ? 'Requested' :
                       match.status === 'negotiating' ? 'Negotiating' :
                       match.status === 'payment_requested' ? 'Payment Req.' :
                       'Matched'}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="font-bold text-carry-darker text-[15px] mb-2 truncate">{match.shipment_request?.item_description || 'Package Request'}</div>
                    <div className="flex items-center gap-1.5 text-carry-muted font-bold text-[12px] mb-4">
                      <MapPin className="w-3 h-3" />
                      {match.shipment_request?.origin_city || 'Origin'} &rarr; {match.shipment_request?.destination_city || 'Destination'}
                    </div>
                    <hr className="border-gray-100 mb-4" />
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-bold">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        {match.shipment_request?.sender?.display_name || match.shipment_request?.sender_display_name || 'Verified Sender'}
                      </div>
                      <div className="text-carry-light font-bold text-[13px]">{match.shipment_request?.offered_price || match.payment_requested_amount || 0} {match.shipment_request?.currency || 'USD'}</div>
                    </div>
                    <div className="text-[11px] text-gray-400 font-bold mt-auto">
                      Reward for {match.shipment_request?.declared_weight_kg || 0}kg package
                    </div>
                  </div>
                </div>
              );
            }) : (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 h-64 rounded-sm animate-pulse"></div>
              ))
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
