import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ArrowRight,
  MoreVertical,
  Plus,
  Search,
  Filter
} from "lucide-react";
import AccountLayout from "@/components/layout/AccountLayout";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

// Mock data for the dashboard
const recentShipments = [
  {
    id: "SH-1209",
    title: "MacBook Pro M3",
    route: "Lagos → London",
    status: "in_transit",
    date: "Oct 24, 2023",
    weight: "2.4kg",
    price: "$45.00"
  },
  {
    id: "SH-1188",
    title: "Designer Handbag",
    route: "London → Lagos",
    status: "delivered",
    date: "Oct 18, 2023",
    weight: "1.1kg",
    price: "$28.00"
  },
  {
    id: "SH-1152",
    title: "iPhone 15 Pro",
    route: "New York → Lagos",
    status: "pending_payment",
    date: "Oct 12, 2023",
    weight: "0.5kg",
    price: "$15.00"
  }
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_transit: "bg-blue-100 text-blue-700",
    delivered: "bg-green-100 text-green-700",
    pending_payment: "bg-orange-100 text-orange-700",
    disputed: "bg-red-100 text-red-700"
  };

  const labels: Record<string, string> = {
    in_transit: "In Transit",
    delivered: "Delivered",
    pending_payment: "Payment Required",
    disputed: "Disputed"
  };

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider", styles[status])}>
      {labels[status]}
    </span>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("all");
  const { user } = useAuthStore();

  const stats = [
    { label: "Active Shipments", value: "3", icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Deliveries", value: "24", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "Wallet Balance", value: "$420.00", icon: Wallet, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Trust Score", value: "98/100", icon: ShieldCheck, color: "text-cyan-500", bg: "bg-cyan-50" }
  ];

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-carry-darker">Welcome back, {user?.first_name}!</h2>
          <p className="text-gray-500 text-sm tracking-wide uppercase font-bold tracking-widest text-[10px]">Your Dashboard Overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-md shadow-sm border border-carry-light/10 flex items-center gap-4 group hover:shadow-md transition-all">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">{stat.label}</span>
                <span className="text-xl font-bold text-carry-darker">{stat.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* KYC Banner if not verified */}
        {user?.kyc_status !== "approved" && (
          <div className="bg-carry-darker rounded-md p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-l-[6px] border-carry-light">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-white font-bold text-lg">
                  {user?.kyc_status === "pending" ? "Verification in Progress" : "Identity Verification Required"}
                </h3>
                <p className="text-white/60 text-sm max-w-lg">
                  {user?.kyc_status === "pending"
                    ? "Your documents are being reviewed. We'll notify you once the verification is complete."
                    : "To ensure safety and trust within our community, all travelers must complete a one-time identity verification before they can post trips."}
                </p>
              </div>
            </div>
            <Link to="/account/kyc" className="bg-carry-light text-white px-6 py-2.5 rounded-sm font-bold text-sm hover:bg-carry-light/90 transition-all whitespace-nowrap">
              {user?.kyc_status === "pending" ? "Check Status" : "Verify Identity"}
            </Link>
          </div>
        )}

        {/* Shipments Section */}
        <div className="bg-white rounded-md shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-8 border-b border-gray-100 w-full md:w-auto">
              {["all", "pending", "in-transit", "delivered"].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative",
                    activeTab === tab ? "text-carry-light" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab === "all" ? "All Shipments" : tab.replace("-", " ")}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-carry-light"></div>}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search shipments..." 
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-sm text-sm focus:outline-none focus:border-carry-light w-full md:w-64"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-sm text-gray-400 hover:text-carry-light hover:border-carry-light transition-all">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100">
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">Route / Date</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentShipments.map((shipment, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-sm bg-gray-100 flex items-center justify-center text-carry-muted group-hover:bg-carry-light/10 group-hover:text-carry-light transition-all shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-carry-darker text-[14px]">{shipment.title}</span>
                          <span className="text-xs text-gray-400 font-medium">ID: {shipment.id} • {shipment.weight}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-carry-muted text-[13px]">{shipment.route}</span>
                        <span className="text-xs text-gray-400">{shipment.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-bold text-carry-darker text-[14px]">
                      {shipment.price}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={shipment.status} />
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
          </div>
          
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Showing 3 of 12 active shipments</p>
            <Link to="/account/my-shipments" className="text-xs font-bold uppercase tracking-widest text-carry-light hover:underline flex items-center gap-1.5">
              View All
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Verified Travelers Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Verified Travelers on Your Routes
            </h3>
            <Link to="/browse/listings" className="text-xs font-bold text-carry-light hover:underline">
              Browse all corridors
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-md shadow-sm border border-carry-light/10 group hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden shrink-0">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-carry-darker text-sm truncate">Alexander {i === 1 ? 'E.' : 'W.'}</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-carry-light" />
                      <span className="text-[10px] font-bold text-carry-light uppercase tracking-tight">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 mb-6">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">LOS</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-carry-light my-1"></div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">LHR</span>
                  </div>
                  <div className="flex-1 h-[1.5px] bg-carry-light/20 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-carry-light rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-carry-darker">Oct 2{i}</span>
                    <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Departure</span>
                  </div>
                </div>
                <button className="w-full py-2 bg-carry-bg text-carry-light rounded-sm text-xs font-bold border border-carry-light/20 group-hover:bg-carry-light group-hover:text-white group-hover:border-carry-light transition-all">
                  Send Inquiry
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
