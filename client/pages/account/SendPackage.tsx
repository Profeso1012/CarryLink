import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, Calendar, Weight, DollarSign, Info, Loader2, MapPin, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

export default function SendPackage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    origin_country: "NG",
    origin_city: "",
    destination_country: "GB",
    destination_city: "",
    weight: "",
    offered_price: "",
    currency: "USD",
    category: "Electronics",
    pickup_deadline: "",
    delivery_deadline: ""
  });

  const createShipmentMutation = useMutation({
    mutationFn: (data: typeof formData) => apiClient.post("/shipments", data),
    onSuccess: () => {
      toast.success("Shipment request created successfully!");
      navigate("/account/my-shipments");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create shipment");
    }
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createShipmentMutation.mutate(formData);
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return (
    <AccountLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Request a Delivery</h2>
          <p className="text-gray-500">Find a traveler to carry your package across borders.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                step >= i ? "bg-carry-light text-white" : "bg-gray-100 text-gray-400"
              )}>
                {i}
              </div>
              <span className={cn(
                "text-[11px] font-bold uppercase tracking-widest",
                step >= i ? "text-carry-darker" : "text-gray-400"
              )}>
                {i === 1 ? "Details" : i === 2 ? "Route" : "Review"}
              </span>
              {i < 3 && <div className="w-8 h-[1px] bg-gray-100"></div>}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Package Title</Label>
                    <div className="relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        placeholder="e.g. MacBook Pro M3" 
                        value={formData.title}
                        onChange={(e) => updateFormData({ title: e.target.value })}
                        required 
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Description & Contents</Label>
                    <Textarea 
                      placeholder="List all items inside the package..." 
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      required
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="number" 
                          placeholder="e.g. 2.5" 
                          value={formData.weight}
                          onChange={(e) => updateFormData({ weight: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Your Offered Price ({formData.currency})</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="number" 
                          placeholder="e.g. 50" 
                          value={formData.offered_price}
                          onChange={(e) => updateFormData({ offered_price: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="button" onClick={handleNext} className="w-full bg-carry-light text-white font-bold h-12">
                    Next Step
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Origin Country</Label>
                      <select 
                        value={formData.origin_country}
                        onChange={(e) => updateFormData({ origin_country: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-carry-light"
                      >
                        <option value="NG">Nigeria</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Origin City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="e.g. Lagos" 
                          value={formData.origin_city}
                          onChange={(e) => updateFormData({ origin_city: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Destination Country</Label>
                      <select 
                        value={formData.destination_country}
                        onChange={(e) => updateFormData({ destination_country: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-carry-light"
                      >
                        <option value="GB">United Kingdom</option>
                        <option value="NG">Nigeria</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Destination City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          placeholder="e.g. London" 
                          value={formData.destination_city}
                          onChange={(e) => updateFormData({ destination_city: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Pickup By</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="date" 
                          value={formData.pickup_deadline}
                          onChange={(e) => updateFormData({ pickup_deadline: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Delivery By</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="date" 
                          value={formData.delivery_deadline}
                          onChange={(e) => updateFormData({ delivery_deadline: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1 font-bold h-12">
                      Back
                    </Button>
                    <Button type="button" onClick={handleNext} className="flex-[2] bg-carry-light text-white font-bold h-12">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-carry-bg rounded-sm p-6 space-y-4">
                    <h4 className="text-sm font-bold text-carry-darker uppercase tracking-widest">Shipment Summary</h4>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div className="text-gray-400 font-medium">Item</div>
                      <div className="text-carry-darker font-bold">{formData.title}</div>
                      
                      <div className="text-gray-400 font-medium">Route</div>
                      <div className="text-carry-darker font-bold">{formData.origin_city} → {formData.destination_city}</div>
                      
                      <div className="text-gray-400 font-medium">Payment</div>
                      <div className="text-carry-darker font-bold">{formData.offered_price} {formData.currency} (held in Escrow)</div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your payment will be held in our secure escrow system and only released when the recipient confirms delivery.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1 font-bold h-12">
                      Back
                    </Button>
                    <Button type="submit" className="flex-[2] bg-carry-light text-white font-bold h-12" disabled={createShipmentMutation.isPending}>
                      {createShipmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Request"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </AccountLayout>
  );
}
