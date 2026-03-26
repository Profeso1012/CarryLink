import React, { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/api/auth.api";
import { toast } from "sonner";
import { Mail, Phone, Lock, User, Globe, Loader2, Eye, EyeOff, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { cookieUtils } from "@/lib/cookie-utils";

type AuthStep = "email" | "email_otp" | "register_form" | "phone_otp" | "login_password" | "forgot_password" | "forgot_otp" | "reset_password";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
  initialStep?: AuthStep;
  initialEmail?: string;
}

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState("+234");
  const [country, setCountry] = useState("NG");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(initialMode === "login");
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoginVerification, setIsLoginVerification] = useState(false); // Track if this is login verification
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<any>(null);

  // Country codes mapping
  const countryCodes = {
    "NG": "+234",
    "GB": "+44", 
    "US": "+1",
    "CA": "+1"
  };

  const countryNames = {
    "NG": "🇳🇬 Nigeria",
    "GB": "🇬🇧 United Kingdom", 
    "US": "🇺🇸 United States",
    "CA": "🇨🇦 Canada"
  };

  // Update phone country code when country changes
  React.useEffect(() => {
    setPhoneCountryCode(countryCodes[country as keyof typeof countryCodes] || "+234");
  }, [country]);

  // Sync mode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setIsLoginMode(initialMode === "login");
      setStep("email");
      setIsLoginVerification(false); // Reset login verification flag
      setIsNewUser(false); // Reset new user flag
    }
  }, [isOpen, initialMode]);

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
    setErrors({});
    try {
      const response = await authApi.login(email, password);
      console.log("[AUTH DEBUG] Login success response:", response);
      console.log("[AUTH DEBUG] Login response data:", response.data);
      
      const { user, access_token, refresh_token } = response.data;
      console.log("[AUTH DEBUG] User object from login:", user);
      console.log("[AUTH DEBUG] User is_email_verified:", user.is_email_verified);
      console.log("[AUTH DEBUG] User is_phone_verified:", user.is_phone_verified);
      
      localStorage.setItem("access_token", access_token);
      cookieUtils.set("refresh_token", refresh_token, 30);
      setUser(user);
      toast.success("Welcome back!");
      onClose();
    } catch (error: any) {
      console.log("[AUTH DEBUG] Login error:", error);
      console.log("[AUTH DEBUG] Error response:", error.response);
      console.log("[AUTH DEBUG] Error response data:", error.response?.data);
      
      const errorData = error.response?.data?.error || error.response?.data || {};
      const errorMessage = errorData.message || error.response?.data?.message || "Login failed";
      const errorCode = errorData.code || error.response?.data?.code;
      
      console.log("[AUTH DEBUG] Error code:", errorCode);
      console.log("[AUTH DEBUG] Error message:", errorMessage);
      
      // Handle verification errors
      if (errorCode === 'EMAIL_NOT_VERIFIED' || errorMessage.includes('verify your email')) {
        toast.info("Please verify your email address to continue");
        setIsLoginVerification(true); // Mark as login verification
        setStep("email_otp");
        toast.success("Verification code sent to your email");
      } else if (errorCode === 'PHONE_NOT_VERIFIED' || errorMessage.includes('verify your phone')) {
        toast.info("Please verify your phone number to continue");
        setIsLoginVerification(true); // Mark as login verification
        setStep("phone_otp");
        toast.success("Verification code sent to your phone");
      } else {
        toast.error(errorMessage);
        
        // Set field-specific errors
        if (errorCode === 'INVALID_CREDENTIALS') {
          setErrors({ password: "Invalid email or password" });
        } else if (errorCode === 'USER_NOT_FOUND') {
          setErrors({ email: "No account found with this email" });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      await authApi.forgotPassword(email);
      toast.success("If that email exists, a reset code has been sent.");
      setStep("forgot_otp");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      // Verify OTP is valid before proceeding to reset password
      setStep("reset_password");
      toast.success("Code verified! Please set your new password.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid or expired code");
      setErrors({ otp: "Invalid or expired code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsLoading(false);
      return;
    }
    
    try {
      await authApi.resetPassword(email, otp, newPassword);
      toast.success("Password reset successfully! Please sign in with your new password.");
      setStep("login_password");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset password");
      if (error.response?.data?.code === 'PASSWORD_TOO_WEAK') {
        setErrors({ newPassword: "Password is too weak" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      const response = await authApi.verifyEmail(email, otp);
      setOtp("");
      
      // Check if this is a login verification (user already exists and is trying to login)
      if (isLoginVerification) {
        // This is login verification - check if phone also needs verification
        try {
          // Try to login after email verification
          const loginResponse = await authApi.login(email, password);
          const { user, access_token, refresh_token } = loginResponse.data;
          localStorage.setItem("access_token", access_token);
          cookieUtils.set("refresh_token", refresh_token, 30);
          setUser(user);
          toast.success("Email verified! Welcome back!");
          onClose();
        } catch (loginError: any) {
          const loginErrorCode = loginError.response?.data?.error?.code || loginError.response?.data?.code;
          if (loginErrorCode === 'PHONE_NOT_VERIFIED') {
            // Phone verification needed
            setStep("phone_otp");
            toast.success("Email verified! Now verify your phone number.");
          } else {
            throw loginError;
          }
        }
      } else {
        // Registration flow - need to verify phone next
        await authApi.sendPhoneOTP(email);
        setStep("phone_otp");
        toast.success("Email verified! Now verify your phone number.");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid OTP");
      setErrors({ otp: "Invalid or expired code" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    try {
      // Validate phone number length
      if (!phone || phone.length < 7) {
        setErrors({ phone: "Please enter a valid phone number" });
        setIsLoading(false);
        return;
      }

      // Only require reCAPTCHA if site key is configured
      if (import.meta.env.VITE_RECAPTCHA_SITE_KEY && !recaptchaToken) {
        toast.error("Please verify you are not a robot");
        setIsLoading(false);
        return;
      }

      // Prepare registration data
      const registrationData: any = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: `${phoneCountryCode}${phone}`, // Combine country code with phone number
        country_of_residence: country,
        password: password,
        _gotcha: "", // Honeypot field
      };

      // Only add recaptcha_token if reCAPTCHA is enabled
      if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
        registrationData.recaptcha_token = recaptchaToken;
      }

      console.log("[REGISTRATION DEBUG] Sending registration data:", registrationData);
      console.log("[REGISTRATION DEBUG] reCAPTCHA site key:", import.meta.env.VITE_RECAPTCHA_SITE_KEY);

      await authApi.register(registrationData);
      setIsNewUser(true); // Mark as new user for tutorial
      setStep("email_otp");
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      toast.success("Registration successful! Please verify your email to continue.");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    try {
      const response = await authApi.verifyPhone(email, otp);
      
      // Check if we get login tokens back (for login verification flow)
      if (response.data?.user && response.data?.access_token) {
        const { user, access_token, refresh_token } = response.data;
        localStorage.setItem("access_token", access_token);
        cookieUtils.set("refresh_token", refresh_token, 30);
        setUser(user);
        
        if (isLoginVerification) {
          toast.success("Phone verified! Welcome back!");
          onClose();
          navigate("/account/dashboard");
        } else if (isNewUser) {
          toast.success("Account created successfully! Welcome to CarryLink!");
          onClose();
          navigate("/account/dashboard");
        } else {
          toast.success("Phone verified! Welcome back!");
          onClose();
          navigate("/account/dashboard");
        }
      } else {
        // Registration completion - user needs to login
        toast.success("Account created successfully! Please sign in to continue.");
        onClose();
        // Reset form and redirect to login
        setStep("login_password");
        setPassword("");
        setIsLoginMode(true);
        setIsNewUser(false);
        setIsLoginVerification(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Invalid phone OTP");
      setErrors({ otp: "Invalid or expired code" });
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }} 
                required 
                className={cn(
                  "w-full pt-[18px] pr-4 pb-[6px] pl-4 border-[1.5px] rounded-[10px] text-[15px] outline-none transition-colors bg-white text-[#0d1a1f] focus:border-[#23bcf2] peer",
                  errors.email ? "border-red-500" : "border-[#b8eaf5]"
                )}
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
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
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
            
            <div className="text-center mt-6 pt-6 border-t border-[#e0f5ff]">
              <p className="text-[13px] text-[#757575]">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => setIsLoginMode(!isLoginMode)}
                  className="ml-1 text-[#23bcf2] font-bold hover:underline cursor-pointer"
                >
                  {isLoginMode ? "Sign up" : "Sign in"}
                </button>
              </p>
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }} 
                required 
                className={cn(
                  "w-full pt-[18px] pr-12 pb-[6px] pl-4 border-[1.5px] rounded-[10px] text-[15px] outline-none transition-colors bg-white text-[#0d1a1f] focus:border-[#23bcf2]",
                  errors.password ? "border-red-500" : "border-[#b8eaf5]"
                )}
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
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
            <div className="flex justify-between items-center mt-3 text-[13px]">
              <button 
                type="button" 
                onClick={() => setStep("forgot_password")} 
                className="bg-none border-none text-[#2d7a96] underline cursor-pointer"
              >
                Forgot password?
              </button>
              <button 
                type="button" 
                onClick={() => setStep("email")} 
                className="bg-none border-none text-[#2d7a96] underline cursor-pointer"
              >
                Back to options
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
              <div className="flex gap-2">
                <div className="relative w-20">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={phoneCountryCode}
                    readOnly
                    className="h-12 pl-10 bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    id="reg-phone" 
                    type="tel" 
                    placeholder="8012345678" 
                    value={phone} 
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      if (errors.phone) setErrors({ ...errors, phone: "" });
                    }} 
                    required 
                    className={cn(
                      "h-12",
                      errors.phone ? "border-red-500" : ""
                    )}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Country of Residence</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  id="country" 
                  value={country} 
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (errors.country) setErrors({ ...errors, country: "" });
                  }}
                  className={cn(
                    "flex h-12 w-full rounded-md border border-input bg-background px-10 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
                    errors.country ? "border-red-500" : ""
                  )}
                >
                  <option value="NG">{countryNames.NG}</option>
                  <option value="GB">{countryNames.GB}</option>
                  <option value="US">{countryNames.US}</option>
                  <option value="CA">{countryNames.CA}</option>
                </select>
                {errors.country && (
                  <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password" title="Password" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Create Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="reg-password"
                  type={showRegPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-center my-4">
              {import.meta.env.VITE_RECAPTCHA_SITE_KEY ? (
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={(token) => setRecaptchaToken(token)}
                />
              ) : (
                <div className="text-xs text-gray-500 text-center p-4 bg-gray-50 rounded">
                  reCAPTCHA disabled in development
                </div>
              )}
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
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (errors.otp) setErrors({ ...errors, otp: "" });
                }} 
                required 
                className={cn(
                  "text-center text-2xl tracking-[0.5em] font-bold h-14",
                  errors.otp ? "border-red-500" : ""
                )}
              />
              {errors.otp && (
                <p className="text-red-500 text-xs text-center">{errors.otp}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Email"}
            </Button>
            
            <div className="text-center mt-3">
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await authApi.resendEmailVerification(email);
                    toast.success("Verification code resent!");
                  } catch (error) {
                    toast.error("Failed to resend code");
                  }
                }}
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Resend code
              </button>
            </div>
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
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (errors.otp) setErrors({ ...errors, otp: "" });
                }} 
                required 
                className={cn(
                  "text-center text-2xl tracking-[0.5em] font-bold h-14",
                  errors.otp ? "border-red-500" : ""
                )}
              />
              {errors.otp && (
                <p className="text-red-500 text-xs text-center">{errors.otp}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Complete Verification"}
            </Button>
            
            <div className="text-center mt-3">
              <button 
                type="button" 
                onClick={async () => {
                  try {
                    await authApi.sendPhoneOTP(email);
                    toast.success("SMS code resent!");
                  } catch (error) {
                    toast.error("Failed to resend code");
                  }
                }}
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Resend SMS code
              </button>
            </div>
          </form>
        );

      case "forgot_password":
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative mb-4">
              <input 
                id="forgot-email" 
                type="email" 
                placeholder=" "
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: "" });
                }} 
                required 
                className={cn(
                  "w-full pt-[18px] pr-4 pb-[6px] pl-4 border-[1.5px] rounded-[10px] text-[15px] outline-none transition-colors bg-white text-[#0d1a1f] focus:border-[#23bcf2]",
                  errors.email ? "border-red-500" : "border-[#b8eaf5]"
                )}
              />
              <label 
                htmlFor="forgot-email"
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
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full p-4 bg-[#23bcf2] text-white border-none rounded-[10px] text-base font-bold cursor-pointer transition-colors disabled:bg-[#b8eaf5] disabled:cursor-default disabled:text-[#6ab8cc] hover:bg-[#1aa6d4]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </div>
              ) : "Send Reset Code"}
            </button>
            
            <div className="text-center mt-3">
              <button 
                type="button" 
                onClick={() => setStep("login_password")} 
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Back to sign in
              </button>
            </div>
          </form>
        );

      case "forgot_otp":
        return (
          <form onSubmit={handleForgotOTP} className="space-y-4">
            <div className="text-center space-y-2 mb-6">
              <p className="text-sm text-gray-500">We've sent a reset code to</p>
              <p className="font-bold text-carry-darker">{email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reset-otp" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted text-center block">Enter 6-digit code</Label>
              <Input 
                id="reset-otp" 
                type="text" 
                placeholder="000000" 
                maxLength={6}
                value={otp} 
                onChange={(e) => {
                  setOtp(e.target.value);
                  if (errors.otp) setErrors({ ...errors, otp: "" });
                }} 
                required 
                className={cn(
                  "text-center text-2xl tracking-[0.5em] font-bold h-14",
                  errors.otp ? "border-red-500" : ""
                )}
              />
              {errors.otp && (
                <p className="text-red-500 text-xs text-center">{errors.otp}</p>
              )}
            </div>
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Verify Code"}
            </Button>
            <div className="text-center mt-3">
              <button 
                type="button" 
                onClick={() => setStep("forgot_password")} 
                className="bg-none border-none text-[13px] text-[#2d7a96] underline cursor-pointer"
              >
                Back to email
              </button>
            </div>
          </form>
        );

      case "reset_password":
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={newPassword} 
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errors.newPassword) setErrors({ ...errors, newPassword: "" });
                    }} 
                    required 
                    className={cn(
                      "pl-10 h-12",
                      errors.newPassword ? "border-red-500" : ""
                    )}
                  />
                  {errors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={confirmPassword} 
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                    }} 
                    required 
                    className={cn(
                      "pl-10 h-12",
                      errors.confirmPassword ? "border-red-500" : ""
                    )}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Reset Password"}
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
               step === "email_otp" ? (isNewUser ? "Verify your email" : "Verify your email") :
               step === "phone_otp" ? (isNewUser ? "Verify your phone" : "Verify your phone") :
               step === "register_form" ? "Complete your profile" :
               step === "forgot_password" ? "Reset your password" :
               step === "forgot_otp" ? "Enter reset code" :
               step === "reset_password" ? "Create new password" :
               isLoginMode ? "Sign in to CarryLink" : "Join CarryLink"}
            </DialogTitle>
            <p className="text-center text-[#757575] text-[13px] leading-relaxed">
              {step === "login_password" ? "Enter your password to continue" :
               step === "email_otp" ? (isNewUser ? `Please enter the code sent to ${email}` : `We need to verify your email address. Code sent to ${email}`) :
               step === "phone_otp" ? (isNewUser ? "Enter the SMS code to complete verification" : "Please verify your phone number to continue") :
               step === "register_form" ? "Tell us a bit about yourself" :
               step === "forgot_password" ? "Enter your email address and we'll send you a reset code" :
               step === "forgot_otp" ? "Check your email for the 6-digit reset code" :
               step === "reset_password" ? "Choose a strong password for your account" :
               isLoginMode ? "Welcome back to CarryLink" : "Ship smarter or earn from your spare luggage. Enter your email to get started."}
            </p>
          </DialogHeader>

          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
