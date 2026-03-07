import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireKYC?: boolean;
}

export default function ProtectedRoute({ children, requireKYC = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-carry-bg">
        <Loader2 className="w-12 h-12 animate-spin text-carry-light mb-4" />
        <p className="text-carry-muted font-bold tracking-widest uppercase text-xs">Loading Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to home if not logged in
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (requireKYC && user?.kyc_status !== "approved") {
    // Redirect to KYC page if KYC is required but not approved
    return <Navigate to="/account/kyc" replace />;
  }

  return <>{children}</>;
}
