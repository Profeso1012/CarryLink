import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  CreditCard,
  Camera,
  Box
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import PaystackButton from "@/components/payments/PaystackButton";
import StripePaymentWidget from "@/components/payments/StripePaymentWidget";

interface Booking {
  id: string;
  match_id?: string;
  conversation_id?: string;
  shipment_title?: string;
  shipment_description?: string;
  origin_city: string;
  destination_city: string;
  status: "pending_payment" | "payment_held" | "in_transit" | "delivered" | "completed" | "disputed" | "payment_processing";
  total_amount: number;
  currency: string;
  traveler_name: string;
  sender_name: string;
  created_at: string;
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deliveryOtp, setDeliveryOtp] = useState("");

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      const response = await apiClient.get(`/bookings/${id}`);
      return response.data.data as Booking;
    }
  });

  const confirmPickupMutation = useMutation({
    mutationFn: () => apiClient.post(`/bookings/${id}/confirm-pickup`),
    onSuccess: () => {
      toast.success("Pickup confirmed! Package is now in transit.");
    }
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: (otp: string) => apiClient.post(`/bookings/${id}/confirm-delivery`, { delivery_otp: otp }),
    onSuccess: () => {
      toast.success("Delivery confirmed! Funds will be released to the traveler.");
    }
  });

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-carry-light" /></div>;
  if (!booking) return <div className="p-20 text-center">Booking not found</div>;

  return (
    <AccountLayout>
      <div className="space-y-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Link to="/account/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-carry-light hover:underline">Dashboard</Link>
              <span className="text-[10px] text-gray-300">/</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Booking {id?.slice(0, 8)}</span>
            </div>
            <h2 className="text-2xl font-bold text-carry-darker">{booking.shipment_title}</h2>
          </div>
          <Badge className={cn(
            "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border-none self-start md:self-center",
            booking.status === "completed" ? "bg-green-100 text-green-700" : 
            booking.status === "disputed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          )}>
            {booking.status.replace("_", " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Progress */}
            <Card className="border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-12 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-100 -translate-y-1/2 z-0"></div>
                  <div className={cn("absolute top-1/2 left-0 h-[2px] bg-carry-light -translate-y-1/2 z-0 transition-all duration-1000", 
                    booking.status === "pending_payment" ? "w-0" : 
                    booking.status === "payment_held" ? "w-1/3" : 
                    booking.status === "in_transit" ? "w-2/3" : "w-full"
                  )}></div>
                  
                  {[
                    { step: "Payment", icon: CreditCard, status: ["payment_held", "in_transit", "delivered", "completed"] },
                    { step: "Pickup", icon: Box, status: ["in_transit", "delivered", "completed"] },
                    { step: "Transit", icon: Package, status: ["delivered", "completed"] },
                    { step: "Delivered", icon: CheckCircle2, status: ["completed"] }
                  ].map((s, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-4 border-white transition-all duration-500 shadow-sm",
                        s.status.includes(booking.status) ? "bg-carry-light text-white" : "bg-gray-100 text-gray-300"
                      )}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest", s.status.includes(booking.status) ? "text-carry-darker" : "text-gray-400")}>{s.step}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-carry-bg p-6 rounded-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-carry-light" />
                    <span className="text-sm font-bold text-carry-darker uppercase tracking-widest">{booking.origin_city} → {booking.destination_city}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <Calendar className="w-4 h-4 text-gray-300" />
                      Started {new Date(booking.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                      <ShieldCheck className="w-4 h-4 text-carry-light" />
                      Escrow Protected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Based on Status */}
            {booking.status === "pending_payment" && (
              <Card className="border-none shadow-lg p-8 bg-white space-y-8">
                <div className="flex items-center gap-4 pb-8 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-carry-darker">Payment Required</h3>
                    <p className="text-gray-500 text-sm">Secure the delivery by funding the escrow. Amount: {booking.total_amount} {booking.currency}</p>
                  </div>
                </div>

                {/* Tabs for Payment Methods */}
                <div className="space-y-6">
                  <div className="flex gap-4 border-b border-gray-100">
                    <button className="pb-4 px-4 font-bold text-sm text-carry-light border-b-2 border-carry-light uppercase tracking-widest">
                      Paystack
                    </button>
                    <button className="pb-4 px-4 font-bold text-sm text-gray-400 hover:text-carry-darker uppercase tracking-widest">
                      Stripe
                    </button>
                  </div>

                  {/* Paystack Payment */}
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      You will be redirected to Paystack to complete your payment securely.
                    </p>
                    <PaystackButton bookingId={id!} />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-sm">
                  <div className="flex gap-3">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      Your payment is protected by escrow. Funds will only be released to the traveler after successful delivery confirmation.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {booking.status === "payment_processing" && (
              <Card className="border-none shadow-md border-l-[6px] border-amber-500 bg-white p-8">
                <div className="space-y-6 text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-carry-light mx-auto" />
                  <div>
                    <h3 className="text-lg font-bold text-carry-darker">Processing Payment</h3>
                    <p className="text-gray-500 text-sm mt-2">
                      Your payment is being processed. This may take a few moments. Please do not refresh the page.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {booking.status === "payment_held" && (
              <Card className="border-none shadow-md border-l-[6px] border-carry-light bg-white p-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-carry-darker">Ready for Pickup</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    The traveler ({booking.traveler_name}) is ready to receive the package. Once they have it, please ask them to confirm the pickup or confirm it yourself here.
                  </p>
                  <Button 
                    onClick={() => confirmPickupMutation.mutate()}
                    disabled={confirmPickupMutation.isPending}
                    className="bg-carry-light text-white font-bold h-12 px-8"
                  >
                    {confirmPickupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Package Pickup"}
                  </Button>
                </div>
              </Card>
            )}

            {booking.status === "in_transit" && (
              <Card className="border-none shadow-md border-l-[6px] border-carry-light bg-white p-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-carry-darker">Package in Transit</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Your package is currently being carried to its destination. Once it arrives, the recipient will receive an OTP to confirm delivery.
                  </p>
                  <div className="flex gap-4">
                    <Input 
                      placeholder="Enter 6-digit Delivery OTP" 
                      value={deliveryOtp}
                      onChange={(e) => setDeliveryOtp(e.target.value)}
                      className="h-12 font-bold tracking-[0.2em]"
                    />
                    <Button 
                      onClick={() => confirmDeliveryMutation.mutate(deliveryOtp)}
                      disabled={!deliveryOtp || confirmDeliveryMutation.isPending}
                      className="bg-carry-light text-white font-bold h-12 px-8 whitespace-nowrap"
                    >
                      Confirm Delivery
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-8">
            {/* Summary Sidebar */}
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Subtotal</span>
                    <span className="text-carry-darker font-bold">{(booking.total_amount * 0.9).toFixed(2)} {booking.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Platform Fee</span>
                    <span className="text-carry-darker font-bold">{(booking.total_amount * 0.1).toFixed(2)} {booking.currency}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-baseline">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-carry-darker">Total Paid</span>
                    <span className="text-xl font-bold text-carry-light">{booking.total_amount.toFixed(2)} {booking.currency}</span>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 text-center">Participants</p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted font-bold text-xs">{booking.sender_name.charAt(0)}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-carry-darker">{booking.sender_name}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Sender</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light font-bold text-xs">{booking.traveler_name.charAt(0)}</div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-carry-darker">{booking.traveler_name}</span>
                        <span className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">Traveler</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (booking.conversation_id) {
                      navigate(`/account/messages?conversation=${booking.conversation_id}`);
                    } else {
                      toast.error("No conversation found for this booking");
                    }
                  }}
                  variant="outline"
                  className="w-full flex items-center gap-2 font-bold text-xs uppercase tracking-widest h-10 hover:text-carry-light hover:border-carry-light"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Open Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-amber-50 p-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest">Dispute Support</h4>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Something went wrong? You can open a dispute within 24 hours of delivery confirmation or 7 days past the expected timeline.
                  </p>
                  <Link to="/account/disputes" className="text-[10px] font-bold text-amber-800 underline uppercase tracking-tighter hover:text-amber-900 transition-colors">Open a case</Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}
