import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/api/auth.api";
import { toast } from "sonner";
import { Mail, Phone, Lock, User, Globe, Loader2, Apple, Chrome, Eye, EyeOff, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type AuthStep = "email" | "email_otp" | "register_form" | "phone_otp" | "login_password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("NG");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

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
      setIsNewUser(true); // Mark as new user for tutorial
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
      
      // Redirect to dashboard with tutorial flag for new users
      if (isNewUser) {
        navigate("/account/dashboard?tutorial=true");
      } else {
        navigate("/account/dashboard");
      }
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
            <div className="relative mb-4">
              <input 
                id="email" 
                type="email" 
                placeholder=" "
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="w-full pt-[18px] pr-4 pb-[6px] pl-4 border-[1.5px] border-[#b8eaf5] rounded-[10px] text-[15px] outline-none transition-colors bg-white text-[#0d1a1f] focus:border-[#23bcf2] peer"
              />
              <label 
                htmlFor="email"
                className="absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-[#aaa] pointer-events-none transition-all duration-200"
                style={{
                  top: email ? "10px" : "50%",
                  fontSize: email ? "11px" : "15px",
                  color: email ? "#23bcf2" : "#aaa",
                  transform: email ? "translateY(0)" : "translateY(-50%)"
                }}
              >
                Email address
              </label>
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full p-4 bg-[#23bcf2] text-white border-none rounded-[10px] text-base font-bold cursor-pointer transition-colors mb-3 disabled:bg-[#b8eaf5] disabled:cursor-default disabled:text-[#6ab8cc] hover:bg-[#1aa6d4]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : "Continue"}
            </button>
            
            <div className="text-center mt-3">
              <button 
                type="button" 
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Trouble signing in?
              </button>
            </div>
            
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#e0f5ff]"></div>
              <span className="text-xs text-[#aaa] whitespace-nowrap">Or continue with</span>
              <div className="flex-1 h-px bg-[#e0f5ff]"></div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                className="flex-1 flex items-center justify-center gap-2 p-3 border-[1.5px] border-[#b8eaf5] rounded-[10px] bg-white cursor-pointer text-sm font-medium text-[#0d1a1f] transition-colors hover:border-[#23bcf2] hover:bg-[#f0faff]"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v8.51h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.14z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                </svg>
                Google
              </button>
              <button 
                type="button"
                className="flex-1 flex items-center justify-center gap-2 p-3 border-[1.5px] border-[#b8eaf5] rounded-[10px] bg-white cursor-pointer text-sm font-medium text-[#0d1a1f] transition-colors hover:border-[#23bcf2] hover:bg-[#f0faff]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d1a1f">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Apple
              </button>
            </div>
            
            <p className="text-xs text-[#aaa] text-center leading-relaxed mt-5">
              By continuing, you confirm that you are an adult and have read and accepted our{" "}
              <a href="#" className="text-[#2d7a96] underline">Terms of Use</a> and{" "}
              <a href="#" className="text-[#2d7a96] underline">Privacy Policy</a>.
            </p>
          </form>
        );
      
      case "login_password":
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative mb-4">
              <input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder=" "
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="w-full pt-[18px] pr-12 pb-[6px] pl-4 border-[1.5px] border-[#b8eaf5] rounded-[10px] text-[15px] outline-none transition-colors bg-white text-[#0d1a1f] focus:border-[#23bcf2]"
              />
              <label 
                htmlFor="password"
                className="absolute top-1/2 left-4 -translate-y-1/2 text-[15px] text-[#aaa] pointer-events-none transition-all duration-200 peer-focus:top-[10px] peer-focus:text-[11px] peer-focus:text-[#23bcf2] peer-focus:transform-none peer-[:not(:placeholder-shown)]:top-[10px] peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-[#23bcf2] peer-[:not(:placeholder-shown)]:transform-none"
                style={{
                  top: password ? "10px" : "50%",
                  fontSize: password ? "11px" : "15px",
                  color: password ? "#23bcf2" : "#aaa",
                  transform: password ? "translateY(0)" : "translateY(-50%)"
                }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full p-4 bg-[#23bcf2] text-white border-none rounded-[10px] text-base font-bold cursor-pointer transition-colors disabled:bg-[#b8eaf5] disabled:cursor-default disabled:text-[#6ab8cc] hover:bg-[#1aa6d4]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </div>
              ) : "Sign In"}
            </button>
            <div className="text-center mt-3">
              <button 
                type="button" 
                onClick={() => setStep("email")} 
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Back
              </button>
            </div>
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
      <DialogContent
        overlayClassName="bg-[#042030]/48 backdrop-blur-[12px] z-[10000]"
        className="sm:max-w-[420px] p-0 border-none bg-white rounded-[24px] text-carry-darker shadow-[0_24px_64px_rgba(4,32,48,0.24)] overflow-hidden z-[10001]"
      >
        {/* Security shield indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-[#2d7a96] mt-8 mb-4">
          <Shield className="w-3.5 h-3.5 text-[#23bcf2] stroke-2" />
          Your information is protected
        </div>

        <div className="px-9 pb-8">
          <DialogHeader className="mb-7">
            <DialogTitle className="text-[22px] font-bold text-[#0d1a1f] text-center mb-1">
              {step === "login_password" ? "Welcome back" :
               step === "email_otp" ? "Verify your email" :
               step === "phone_otp" ? "Verify your phone" :
               step === "register_form" ? "Complete your profile" :
               isLoginMode ? "Sign in to CarryLink" : "Join CarryLink"}
            </DialogTitle>
            <p className="text-center text-[#757575] text-[13px] leading-relaxed">
              {step === "login_password" ? "Enter your password to continue" :
               step === "email_otp" ? `Please enter the code sent to ${email}` :
               step === "phone_otp" ? "Enter the SMS code to complete verification" :
               step === "register_form" ? "Tell us a bit about yourself" :
               isLoginMode ? "Welcome back to CarryLink" : "Ship smarter or earn from your spare luggage. Enter your email to get started."}
            </p>
          </DialogHeader>

          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
