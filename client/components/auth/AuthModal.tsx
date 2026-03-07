import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/api/auth.api";
import { toast } from "sonner";
import { Mail, Phone, Lock, User, Globe, Loader2, Apple, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";

type AuthStep = "email" | "email_otp" | "register_form" | "phone_otp" | "login_password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("NG");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const { setUser } = useAuthStore();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginMode) {
      setStep("login_password");
    } else {
      setStep("register_form");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      const { user, access_token, refresh_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success("Welcome back!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.verifyEmail(email, otp);
      setOtp("");
      // Verification successful, now verify phone
      await authApi.sendPhoneOTP(email);
      setStep("phone_otp");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.register({
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        country_of_residence: country,
        password: password,
      });
      setStep("email_otp");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.verifyPhone(email, otp);
      const { user, access_token, refresh_token } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      setUser(user);
      toast.success("Account verified successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid phone OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "email":
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Continue"}
            </Button>
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100"></span>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="bg-white px-2 text-gray-400">Or continue with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" type="button" className="font-bold border-gray-100 text-[13px] h-12">
                <Chrome className="w-4 h-4 mr-2" /> Google
              </Button>
              <Button variant="outline" type="button" className="font-bold border-gray-100 text-[13px] h-12">
                <Apple className="w-4 h-4 mr-2" /> Apple
              </Button>
            </div>
            
            <p className="text-center text-xs text-gray-400 mt-6">
              {isLoginMode ? "Don't have an account?" : "Already have an account?"}{" "}
              <button 
                type="button" 
                onClick={() => setIsLoginMode(!isLoginMode)} 
                className="text-carry-light font-bold hover:underline"
              >
                {isLoginMode ? "Sign Up" : "Log In"}
              </button>
            </p>
          </form>
        );
      
      case "login_password":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pl-10 h-12"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Log In"}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep("email")} 
              className="w-full text-center text-xs text-carry-muted font-bold hover:text-carry-light transition-colors"
            >
              Back to email
            </button>
          </form>
        );

      case "register_form":
        return (
          <form onSubmit={handleRegistration} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="pl-10 h-12" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reg-phone" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input id="reg-phone" type="tel" placeholder="+234..." value={phone} onChange={(e) => setPhone(e.target.value)} required className="pl-10 h-12" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Country of Residence</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  id="country" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  className="flex h-12 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                >
                  <option value="NG">Nigeria</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" title="Password" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input 
                  id="reg-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Create Account"}
            </Button>
            <button 
              type="button" 
              onClick={() => setStep("email")} 
              className="w-full text-center text-xs text-carry-muted font-bold hover:text-carry-light transition-colors"
            >
              Back to email
            </button>
          </form>
        );

      case "email_otp":
        return (
          <form onSubmit={handleEmailOTP} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm text-gray-500">We've sent a verification code to</p>
              <p className="font-bold text-carry-darker">{email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted text-center block">Enter 6-digit code</Label>
              <Input 
                id="otp" 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                className="text-center text-2xl tracking-[0.5em] font-bold h-14"
              />
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Email"}
            </Button>
          </form>
        );

      case "phone_otp":
        return (
          <form onSubmit={handlePhoneOTP} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm text-gray-500">Verify your phone number</p>
              <p className="font-bold text-carry-darker">{phone}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-otp" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted text-center block">Enter SMS code</Label>
              <Input 
                id="p-otp" 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                className="text-center text-2xl tracking-[0.5em] font-bold h-14"
              />
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Complete Verification"}
            </Button>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-8 border-none bg-white rounded-sm text-carry-darker">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-carry-darker text-center">
            {isLoginMode ? "Welcome Back" : "Create Your Account"}
          </DialogTitle>
          <p className="text-center text-gray-500 text-sm">
            {isLoginMode ? "Log in to your CarryLink account" : "Join the world's most trusted peer-to-peer delivery network"}
          </p>
        </DialogHeader>
        
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
