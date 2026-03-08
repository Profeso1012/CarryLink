import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function Settings() {
  const { user, setUser } = useAuthStore();

  // Use me query to get latest data and pre-populate fields
  const { data: meData, isLoading: isMeLoading } = useQuery({
    queryKey: ["user-me"],
    queryFn: () => apiClient.get("/users/me").then(res => res.data.data),
    onSuccess: (data) => {
      setFirstName(data.first_name || "");
      setLastName(data.last_name || "");
      setPhone(data.phone_number || "");
    }
  });

  const displayUser = meData || user;
  const [firstName, setFirstName] = useState(displayUser?.first_name || "");
  const [lastName, setLastName] = useState(displayUser?.last_name || "");
  const [phone, setPhone] = useState(displayUser?.phone_number || "");
  const [isUploading, setIsUploading] = useState(false);

  // Update local state when meData arrives
  useEffect(() => {
    if (meData) {
      setFirstName(meData.first_name || "");
      setLastName(meData.last_name || "");
      setPhone(meData.phone_number || "");
    }
  }, [meData]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiClient.put("/users/me", data),
    onSuccess: (data) => {
      setUser(data.data.user || data.data.data);
      toast.success("Profile updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Update failed");
    }
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({
      first_name: firstName,
      last_name: lastName,
      phone_number: phone
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get signed upload params
      const { data: { data: uploadParams } } = await apiClient.post("/users/me/avatar");

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", uploadParams.api_key);
      formData.append("timestamp", uploadParams.timestamp.toString());
      formData.append("signature", uploadParams.signature);
      formData.append("public_id", uploadParams.public_id);

      const cloudResponse = await fetch(uploadParams.upload_url, {
        method: "POST",
        body: formData
      });
      const cloudData = await cloudResponse.json();

      // 3. Update user profile with new avatar URL
      await updateProfileMutation.mutateAsync({
        avatar_url: cloudData.secure_url
      });

      toast.success("Avatar updated successfully!");
    } catch (error: any) {
      toast.error("Failed to upload avatar");
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
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-sm bg-white text-carry-light font-bold text-sm shadow-sm border border-carry-light/10 transition-all">
              <User className="w-4 h-4" />
              Personal Info
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-carry-muted font-bold text-sm hover:bg-white hover:text-carry-light transition-all">
              <Lock className="w-4 h-4" />
              Security
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-carry-muted font-bold text-sm hover:bg-white hover:text-carry-light transition-all">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-carry-muted font-bold text-sm hover:bg-white hover:text-carry-light transition-all">
              <Shield className="w-4 h-4" />
              Verification
            </button>
          </div>

          <div className="md:col-span-2 space-y-6">
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
                      ) : displayUser?.profile?.avatar_url || displayUser?.avatar_url ? (
                        <img src={displayUser.profile?.avatar_url || displayUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
