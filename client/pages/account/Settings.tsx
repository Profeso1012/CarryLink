import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  User,
  Lock,
  Bell,
  Shield,
  Globe,
  Mail,
  Phone,
  Camera,
  Loader2,
  Trash2,
  Wallet,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import { uploadToCloudinary } from "@/lib/cloudinary-utils";
import { usersApi } from "@/api/users.api";

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("personal");

  // Use me query to get latest data and pre-populate fields
  const { data: meData, isLoading: isMeLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiClient.get("/users/me").then(res => res.data.data),
  });

  const displayUser = meData || user;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Update local state when meData arrives
  useEffect(() => {
    if (meData) {
      console.log("[SETTINGS DEBUG] Received user data:", meData);
      setFirstName(meData.profile?.first_name || meData.first_name || "");
      setLastName(meData.profile?.last_name || meData.last_name || "");
      setDisplayName(meData.profile?.display_name || meData.display_name || "");
      setBio(meData.profile?.bio || meData.bio || "");
      setPhone(meData.phone_number || "");
    }
  }, [meData]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => {
      console.log("[SETTINGS DEBUG] Updating profile with:", data);
      return apiClient.put("/users/me", data);
    },
    onSuccess: (response) => {
      console.log("[SETTINGS DEBUG] Profile update response:", response.data);
      const updatedUser = response.data.data;
      
      // Update the auth store with the new user data
      if (user) {
        setUser({
          ...user,
          ...updatedUser,
          profile: {
            ...user.profile,
            ...updatedUser.profile,
            ...updatedUser
          }
        });
      }
      
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      console.error("[SETTINGS DEBUG] Profile update error:", error);
      toast.error(error.response?.data?.message || "Update failed");
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      bio: bio,
      phone_number: phone
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setIsUploading(true);
    try {
      console.log("[SETTINGS DEBUG] Uploading avatar to Cloudinary:", file.name);

      // Step 1: Upload to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(file, "avatar");
      const avatarUrl = cloudinaryResponse.secure_url;

      console.log("[SETTINGS DEBUG] Cloudinary upload successful:", avatarUrl);

      // Step 2: Send URL to backend
      const response = await usersApi.uploadAvatar(avatarUrl);

      console.log("[SETTINGS DEBUG] Avatar update response:", response);
      const updatedUser = response.profile || response;

      // Update the auth store with the updated user data from backend
      if (user) {
        setUser({
          ...user,
          ...updatedUser,
          avatar_url: updatedUser.avatar_url || avatarUrl,
          profile: {
            ...user.profile,
            ...updatedUser,
            avatar_url: updatedUser.avatar_url || avatarUrl
          }
        });
      }

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["user-me"] });

      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  if (isMeLoading && !user) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <AccountLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Account Settings</h2>
          <p className="text-gray-500">Manage your profile, security, and notification preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Sidebar-like Tabs */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-all",
                activeTab === "personal"
                  ? "bg-white text-carry-light shadow-sm border border-carry-light/10"
                  : "text-carry-muted hover:bg-white hover:text-carry-light"
              )}>
              <User className="w-4 h-4" />
              Personal Info
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-all",
                activeTab === "security"
                  ? "bg-white text-carry-light shadow-sm border border-carry-light/10"
                  : "text-carry-muted hover:bg-white hover:text-carry-light"
              )}>
              <Lock className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-all",
                activeTab === "notifications"
                  ? "bg-white text-carry-light shadow-sm border border-carry-light/10"
                  : "text-carry-muted hover:bg-white hover:text-carry-light"
              )}>
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-all",
                activeTab === "verification"
                  ? "bg-white text-carry-light shadow-sm border border-carry-light/10"
                  : "text-carry-muted hover:bg-white hover:text-carry-light"
              )}>
              <Shield className="w-4 h-4" />
              Verification
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-sm font-bold text-sm transition-all",
                activeTab === "withdraw"
                  ? "bg-white text-carry-light shadow-sm border border-carry-light/10"
                  : "text-carry-muted hover:bg-white hover:text-carry-light"
              )}>
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </button>
          </div>

          <div className="md:col-span-2 space-y-6">
            {/* Personal Info Tab */}
            {activeTab === "personal" && (
            <>
            {/* Profile Section */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-gray-50 pb-6">
                <CardTitle className="text-lg font-bold text-carry-darker">Profile Information</CardTitle>
                <CardDescription>Update your personal details and how others see you.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-gray-50">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-carry-bg border-4 border-white shadow-sm flex items-center justify-center text-carry-muted overflow-hidden">
                      {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-carry-light" />
                      ) : (displayUser?.avatar_url || displayUser?.profile?.avatar_url) ? (
                        <img 
                          src={displayUser?.avatar_url || displayUser?.profile?.avatar_url} 
                          alt="Avatar" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-10 h-10" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-carry-light text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-carry-dark transition-all cursor-pointer">
                      <Camera className="w-4 h-4" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                    </label>
                  </div>
                  <div className="flex-1 text-center sm:text-left space-y-1">
                    <h4 className="font-bold text-carry-darker text-base">{displayUser?.first_name} {displayUser?.last_name}</h4>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">{displayUser?.role} Account • {displayUser?.kyc_status === 'approved' ? 'Verified' : 'Unverified'}</p>
                    {displayUser?.trust_score !== undefined && (
                      <div className="flex items-center gap-1.5 text-carry-light font-bold text-[11px] mt-1">
                        <Shield className="w-3 h-3" />
                        Trust Score: {displayUser.trust_score}/100
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold text-xs uppercase tracking-widest h-9"
                    onClick={() => updateProfileMutation.mutate({ avatar_url: null })}
                  >
                    Remove Photo
                  </Button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">First Name</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Last Name</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={displayUser?.email} disabled className="pl-10 bg-gray-50 cursor-not-allowed opacity-60" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Email cannot be changed once verified.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Display Name</Label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="How you want to appear on the platform"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">This is how other users will see you.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Bio</Label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell other users about yourself..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-carry-light focus:ring-2 focus:ring-carry-light/20 resize-none"
                    />
                    <p className="text-[10px] text-gray-400 font-medium">Maximum 500 characters.</p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="bg-carry-light text-white font-bold h-11 px-8 hover:bg-carry-light/90 transition-all shadow-md"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-none shadow-sm overflow-hidden bg-red-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-red-600">Danger Zone</CardTitle>
                <CardDescription>Permanently delete your account and all associated data.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-red-100 rounded-sm bg-white">
                  <div>
                    <h5 className="font-bold text-carry-darker text-sm">Delete Account</h5>
                    <p className="text-xs text-gray-500">This action cannot be undone.</p>
                  </div>
                  <Button variant="destructive" size="sm" className="font-bold text-xs uppercase tracking-widest px-6 h-10">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete My Account
                  </Button>
                </div>
              </CardContent>
            </Card>
            </>
            )}

            {/* Withdraw Tab */}
            {activeTab === "withdraw" && (
            <>
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardHeader className="border-b border-gray-50 pb-6">
                <CardTitle className="text-lg font-bold text-carry-darker">Withdraw Funds</CardTitle>
                <CardDescription>Withdraw your earnings to your bank account.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Wallet Balance */}
                <div className="bg-carry-bg rounded-sm p-6 border border-carry-light/20">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[10px] font-bold text-carry-muted uppercase tracking-widest">Available Balance</span>
                  </div>
                  <div className="text-4xl font-black text-carry-light mb-2">
                    $1,250.50
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 space-y-1">
                    <span>💡 You can withdraw funds once your KYC is verified</span>
                  </div>
                </div>

                {/* Payout Account Management */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-carry-darker text-sm mb-3">Payout Accounts</h4>
                    <div className="space-y-3">
                      {/* Sample payout account card */}
                      <div className="p-4 border border-gray-200 rounded-sm bg-gray-50/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-carry-darker text-sm">GT Bank</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">****6789 • ADAEZE OKAFOR</p>
                          </div>
                          <Badge className="bg-green-50 text-green-600 border-none text-[9px] font-bold uppercase">Default</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-carry-light text-carry-light hover:bg-carry-light hover:text-white font-bold text-xs uppercase tracking-widest h-10">
                    <Plus className="w-4 h-4 mr-2" /> Add New Account
                  </Button>
                </div>

                {/* Withdrawal Form */}
                <div className="space-y-6 pt-4 border-t border-gray-100">
                  <h4 className="font-bold text-carry-darker text-sm">Request Withdrawal</h4>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Withdrawal Amount</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-carry-light font-bold">$</span>
                      <Input placeholder="0.00" className="pl-8 border-gray-200 focus:border-carry-light" type="number" step="0.01" />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Minimum withdrawal: $10.00</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Payout Account</Label>
                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-sm focus:border-carry-light focus:outline-none text-sm">
                      <option>GT Bank - ****6789</option>
                      <option>Other Account</option>
                    </select>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      💳 Withdrawals typically arrive within 1-2 business days. A processing fee of 1% will be deducted from the withdrawal amount.
                    </p>
                  </div>

                  <Button className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-11 px-8 shadow-md uppercase tracking-widest text-xs">
                    Request Withdrawal
                  </Button>
                </div>
              </CardContent>
            </Card>
            </>
            )}
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
