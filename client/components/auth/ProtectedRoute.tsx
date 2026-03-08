import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";
import { kycApi } from "@/api/kyc.api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireKYC?: boolean;
}

export default function ProtectedRoute({ children, requireKYC = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, setUser } = useAuthStore();
  const location = useLocation();
  const [isVerifyingKYC, setIsVerifyingKYC] = useState(false);

  useEffect(() => {
    const verifyKYC = async () => {
      if (isAuthenticated && requireKYC && user?.kyc_status !== "approved") {
        setIsVerifyingKYC(true);
        try {
          const response = await kycApi.getStatus();
          if (response.success && response.data.status === "approved") {
            // Update the store with the latest KYC status
            setUser({ ...user!, kyc_status: "approved" });
          }
        } catch (error) {
          console.error("Failed to verify KYC status:", error);
        } finally {
          setIsVerifyingKYC(false);
        }
      }
    };

    verifyKYC();
  }, [isAuthenticated, requireKYC, user?.kyc_status, setUser]);

  if (isLoading || isVerifyingKYC) {
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
