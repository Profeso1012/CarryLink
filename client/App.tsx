import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import KYCPage from "./pages/account/KYCPage";
import PostTrip from "./pages/account/PostTrip";
import SendPackage from "./pages/account/SendPackage";
import MyMatches from "./pages/account/MyMatches";
import VerifyEmail from "./pages/VerifyEmail";
import NotFound from "./pages/NotFound";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AccountLayout from "@/components/layout/AccountLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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

          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/account/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          {/* Public Routes placeholders */}
          <Route path="/how-it-works" element={<PlaceholderPage title="How It Works" />} />
          <Route path="/browse/listings" element={<PlaceholderPage title="Browse Listings" />} />
          <Route path="/browse/shipments" element={<PlaceholderPage title="Browse Shipments" />} />

          {/* Account Routes placeholders */}
          <Route path="/account/my-shipments" element={
            <ProtectedRoute>
              <PlaceholderPage title="My Shipments" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/my-trips" element={
            <ProtectedRoute>
              <PlaceholderPage title="My Trips" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/post-trip" element={
            <ProtectedRoute requireKYC>
              <PostTrip />
            </ProtectedRoute>
          } />
          <Route path="/account/send-package" element={
            <ProtectedRoute>
              <SendPackage />
            </ProtectedRoute>
          } />
          <Route path="/account/matches" element={
            <ProtectedRoute>
              <MyMatches />
            </ProtectedRoute>
          } />
          <Route path="/account/payments" element={
            <ProtectedRoute>
              <PlaceholderPage title="Payments" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/wallet" element={
            <ProtectedRoute>
              <PlaceholderPage title="Wallet" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/kyc" element={
            <ProtectedRoute>
              <KYCPage />
            </ProtectedRoute>
          } />
          <Route path="/account/messages" element={
            <ProtectedRoute>
              <PlaceholderPage title="Messages" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/notifications" element={
            <ProtectedRoute>
              <PlaceholderPage title="Notifications" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/reviews" element={
            <ProtectedRoute>
              <PlaceholderPage title="Reviews" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/disputes" element={
            <ProtectedRoute>
              <PlaceholderPage title="Disputes" sidebar />
            </ProtectedRoute>
          } />
          <Route path="/account/settings" element={
            <ProtectedRoute>
              <PlaceholderPage title="Settings" sidebar />
            </ProtectedRoute>
          } />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
