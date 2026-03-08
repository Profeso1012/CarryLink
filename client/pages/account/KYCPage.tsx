import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { kycApi, KYCStatusResponse } from "@/api/kyc.api";
import AccountLayout from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShieldCheck, ShieldAlert, Clock, Loader2, Globe, FileCheck, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

export default function KYCPage() {
  const { user, setUser } = useAuthStore();
  const [idType, setIdType] = useState("passport");
  const [idCountry, setIdCountry] = useState("NG");
  const [idNumber, setIdNumber] = useState("");

  const { data: statusData, isLoading: isStatusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: () => kycApi.getStatus(),
    refetchInterval: (data) => 
      data?.state?.data?.data?.status === "pending" || 
      data?.state?.data?.data?.status === "under_review" ? 30000 : false,
  });

  const kycStatus = statusData?.data?.status || "not_started";

  const initiateMutation = useMutation({
    mutationFn: (data: { id_type: string; id_country: string; id_number?: string }) => 
      kycApi.initiate(data),
    onSuccess: (data) => {
      localStorage.setItem("kyc_session_id", data.data.session_id);
      localStorage.setItem("kyc_id", data.data.kyc_id);
      toast.success("Redirecting to verification platform...");
      // Redirect user to Didit verification page
      window.location.href = data.data.verification_url;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || "Failed to initiate KYC");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initiateMutation.mutate({ id_type: idType, id_country: idCountry, id_number: idNumber });
  };

  const renderStatus = () => {
    switch (kycStatus) {
      case "approved":
        const expiresAt = statusData?.data?.expires_at;
        const daysLeft = expiresAt ? Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

        return (
          <div className="flex flex-col items-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-carry-darker">Identity Verified</h3>
            <p className="text-gray-500 max-w-sm">
              Your identity has been successfully verified. You now have the "Verified Traveler" badge on your profile.
            </p>
            <div className="bg-green-50 border border-green-100 rounded-sm p-4 w-full flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <div className="text-left flex-1">
                <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Verification Badge Active</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-green-700">Expires on: {expiresAt ? new Date(expiresAt).toLocaleDateString() : "Never"}</p>
                  {daysLeft !== null && daysLeft > 0 && (
                    <p className="text-xs font-bold text-green-800">{daysLeft} days left</p>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 italic">Verification is valid for 2 years from approval date.</p>
          </div>
        );

      case "pending":
      case "under_review":
        return (
          <div className="flex flex-col items-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-10 h-10 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold text-carry-darker">Verification in Progress</h3>
            <p className="text-gray-500 max-w-sm">
              We've received your documents and are currently reviewing them. This usually takes between 2-10 minutes.
            </p>
            <Button variant="outline" onClick={() => refetchStatus()} className="font-bold">
              Check Status
            </Button>
          </div>
        );

      case "rejected":
        return (
          <div className="flex flex-col items-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-carry-darker">Verification Rejected</h3>
            <p className="text-red-500 font-medium">Reason: {statusData?.data?.rejection_reason || "Document check failed"}</p>
            <p className="text-gray-500 max-w-sm">
              Unfortunately, your identity verification was not successful. Please review the reason and try again.
            </p>
            <Button onClick={() => kycStatus === "not_started"} className="bg-carry-light text-white font-bold h-12">
              Try Verification Again
            </Button>
          </div>
        );

      default:
        return (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="idCountry" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Document Country</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    id="idCountry" 
                    value={idCountry} 
                    onChange={(e) => setIdCountry(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                  >
                    <option value="NG">Nigeria</option>
                    <option value="GB">United Kingdom</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idType" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Document Type</Label>
                <div className="relative">
                  <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    id="idType" 
                    value={idType} 
                    onChange={(e) => setIdType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none"
                  >
                    <option value="passport">International Passport</option>
                    <option value="national_id">National ID Card</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Document Number (Optional)</Label>
              <Input 
                id="idNumber" 
                value={idNumber} 
                onChange={(e) => setIdNumber(e.target.value)} 
                placeholder="A12345678"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" 
              disabled={initiateMutation.isPending}
            >
              {initiateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Start Verification"}
            </Button>
            
            <p className="text-center text-xs text-gray-400 mt-6">
              You will be redirected to Didit to securely scan your document and complete a face match.
            </p>
          </form>
        );
    }
  };

  return (
    <AccountLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-gray-400">
          <Link to="/" className="hover:text-carry-light transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/account/dashboard" className="hover:text-carry-light transition-colors">Account</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-carry-darker font-medium">KYC Verification</span>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Identity Verification</h2>
          <p className="text-gray-500">Secure your account and unlock traveler features by verifying your ID.</p>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-carry-bg border-b border-carry-light/10">
            <CardTitle className="text-lg font-bold text-carry-darker flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-carry-light" />
              Verification Status: {kycStatus.replace("_", " ")}
            </CardTitle>
            <CardDescription>
              We use bank-grade encryption to secure your data. Your document details are never shared.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isStatusLoading ? (
              <div className="p-20 flex justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
              </div>
            ) : (
              renderStatus()
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
              <span className="font-bold">1</span>
            </div>
            <h4 className="text-sm font-bold text-carry-darker">Initiate</h4>
            <p className="text-[11px] text-gray-400">Select your document type and country to start.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
              <span className="font-bold">2</span>
            </div>
            <h4 className="text-sm font-bold text-carry-darker">Scan</h4>
            <p className="text-[11px] text-gray-400">Scan your ID and perform a quick liveness selfie check.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-light">
              <span className="font-bold">3</span>
            </div>
            <h4 className="text-sm font-bold text-carry-darker">Verify</h4>
            <p className="text-[11px] text-gray-400">Wait for approval and get your Verified Traveler badge.</p>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
