import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AccountLayout from "@/components/layout/AccountLayout";

const queryClient = new QueryClient();

const PlaceholderPage = ({ title, sidebar = false }: { title: string; sidebar?: boolean }) => {
  const content = (
    <div className="bg-white p-12 rounded-md shadow-sm border border-carry-light/10 text-center space-y-4">
      <h2 className="text-3xl font-bold text-carry-darker">{title}</h2>
      <p className="text-gray-500 max-w-md mx-auto">This page is currently under development. Please continue prompting to fill in this page's contents if you want it.</p>
      <div className="pt-8">
        <Link to="/" className="text-carry-light font-bold hover:underline">Return to Home</Link>
      </div>
    </div>
  );

  if (sidebar) {
    return <AccountLayout>{content}</AccountLayout>;
  }

  return (
    <div className="min-h-screen bg-carry-bg flex flex-col">
      <Header />
      <div className="flex-1 max-w-[1400px] mx-auto px-6 md:px-[56px] py-12 pt-[120px] w-full">
        {content}
      </div>
      <Footer />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/account/dashboard" element={<Dashboard />} />
          
          {/* Public Routes placeholders */}
          <Route path="/how-it-works" element={<PlaceholderPage title="How It Works" />} />
          <Route path="/browse/listings" element={<PlaceholderPage title="Browse Listings" />} />
          <Route path="/browse/shipments" element={<PlaceholderPage title="Browse Shipments" />} />
          
          {/* Account Routes placeholders */}
          <Route path="/account/my-shipments" element={<PlaceholderPage title="My Shipments" sidebar />} />
          <Route path="/account/my-trips" element={<PlaceholderPage title="My Trips" sidebar />} />
          <Route path="/account/post-trip" element={<PlaceholderPage title="Post a Trip" sidebar />} />
          <Route path="/account/send-package" element={<PlaceholderPage title="Send a Package" sidebar />} />
          <Route path="/account/matches" element={<PlaceholderPage title="My Matches" sidebar />} />
          <Route path="/account/payments" element={<PlaceholderPage title="Payments" sidebar />} />
          <Route path="/account/wallet" element={<PlaceholderPage title="Wallet" sidebar />} />
          <Route path="/account/kyc" element={<PlaceholderPage title="KYC Verification" sidebar />} />
          <Route path="/account/messages" element={<PlaceholderPage title="Messages" sidebar />} />
          <Route path="/account/notifications" element={<PlaceholderPage title="Notifications" sidebar />} />
          <Route path="/account/reviews" element={<PlaceholderPage title="Reviews" sidebar />} />
          <Route path="/account/disputes" element={<PlaceholderPage title="Disputes" sidebar />} />
          <Route path="/account/settings" element={<PlaceholderPage title="Settings" sidebar />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
