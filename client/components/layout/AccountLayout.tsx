import { ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  MapPin, 
  PlusCircle, 
  Send, 
  Users, 
  CreditCard, 
  Wallet, 
  ShieldCheck, 
  MessageSquare, 
  Bell, 
  Star, 
  AlertCircle, 
  Settings, 
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import Header from "./Header";
import Footer from "./Footer";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
  to: string;
  icon: any;
  label: string;
  badge?: string | number;
  badgeVariant?: "primary" | "warning";
}

function SidebarItem({ to, icon: Icon, label, badge, badgeVariant = "primary" }: SidebarItemProps) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 px-[14px] py-[10px] rounded-md transition-all group text-[13.5px]",
        isActive 
          ? "bg-white text-carry-light border-l-[3px] border-carry-light shadow-sm" 
          : "text-carry-muted hover:bg-carry-light/10 hover:text-carry-light border-l-[3px] border-transparent"
      )}
    >
      <Icon className="w-[15px] h-[15px] shrink-0 stroke-[2px]" />
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
          badgeVariant === "primary" ? "bg-carry-light/10 text-carry-light" : "bg-orange-100 text-orange-600"
        )}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const kycStatus = user?.kyc_status || "not_started";

  // Example stats for badges
  const stats = {
    messages: 3,
    notifications: 5,
    shipments: 2,
    trips: 1,
    matches: 8
  };

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      
      <main className="flex-1 pt-[79px]">
        {/* Page banner strip */}
        <div className="page-banner bg-carry-dark border-b border-carry-light/20 px-6 md:px-[56px] py-7 md:py-8">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1 w-full md:w-auto">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">My Account</span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Dashboard Overview
              </h1>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link 
                to="/account/post-trip" 
                className="banner-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-white/5 border border-carry-light/40 text-white/80 text-[13px] font-bold hover:border-carry-light hover:text-white transition-all whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Post a Trip
              </Link>
              <Link 
                to="/account/send-package" 
                className="banner-btn inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-carry-light border border-carry-light text-white text-[13px] font-bold hover:bg-[#1aa6d4] hover:border-[#1aa6d4] transition-all whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5" />
                Send Package
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-[56px] py-8 flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full lg:w-[230px] shrink-0">
            <div className="flex flex-col gap-6">
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted px-[10px] pb-3 mb-2 border-b-2 border-carry-light">
                  Navigation
                </h3>
                <nav className="flex flex-col gap-0.5">
                  <SidebarItem to="/account/dashboard" icon={LayoutDashboard} label="Dashboard" />
                  <SidebarItem to="/account/my-shipments" icon={Package} label="My Shipments" badge={stats.shipments} />
                  <SidebarItem to="/account/my-trips" icon={MapPin} label="My Trips" badge={stats.trips} />
                  <SidebarItem to="/account/matches" icon={Users} label="My Matches" badge={stats.matches} />
                </nav>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted px-[10px] pb-3 mb-2 border-b-2 border-carry-light">
                  Finances
                </h3>
                <nav className="flex flex-col gap-0.5">
                  <SidebarItem to="/account/payments" icon={CreditCard} label="Payments" />
                  <SidebarItem to="/account/wallet" icon={Wallet} label="Wallet" />
                </nav>
              </div>

              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted px-[10px] pb-3 mb-2 border-b-2 border-carry-light">
                  Settings & Safety
                </h3>
                <nav className="flex flex-col gap-0.5">
                  <SidebarItem 
                    to="/account/kyc" 
                    icon={ShieldCheck} 
                    label="KYC Verification" 
                    badge={kycStatus === "pending" ? "Pending" : undefined}
                    badgeVariant="warning"
                  />
                  <SidebarItem to="/account/messages" icon={MessageSquare} label="Messages" badge={stats.messages} />
                  <SidebarItem to="/account/notifications" icon={Bell} label="Notifications" badge={stats.notifications} />
                  <SidebarItem to="/account/reviews" icon={Star} label="Reviews" />
                  <SidebarItem to="/account/disputes" icon={AlertCircle} label="Disputes" />
                  <SidebarItem to="/account/settings" icon={Settings} label="Settings" />
                </nav>
              </div>

              <div className="pt-4 border-t border-carry-light/20">
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-[14px] py-[10px] w-full text-left text-red-500 hover:bg-red-50 rounded-md transition-all text-[13.5px] font-medium"
                >
                  <LogOut className="w-[15px] h-[15px] shrink-0 stroke-[2.5px]" />
                  Log Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="flex-1 min-w-0">
            {children}
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
