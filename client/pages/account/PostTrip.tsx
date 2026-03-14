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
import { Plane, Calendar, Weight, DollarSign, Info, Loader2, MapPin, Check, ChevronsUpDown, ShieldCheck, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

const ITEM_CATEGORIES = [
  { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Electronics' },
  { id: '550e8400-e29b-41d4-a716-446655440002', name: 'Clothing & Fashion' },
  { id: '550e8400-e29b-41d4-a716-446655440003', name: 'Documents' },
  { id: '550e8400-e29b-41d4-a716-446655440004', name: 'Food & Groceries' },
  { id: '550e8400-e29b-41d4-a716-446655440005', name: 'Books & Media' },
  { id: '550e8400-e29b-41d4-a716-446655440006', name: 'Personal Care' },
  { id: '550e8400-e29b-41d4-a716-446655440007', name: 'Toys & Games' },
  { id: '550e8400-e29b-41d4-a716-446655440008', name: 'Jewelry & Accessories' },
  { id: '550e8400-e29b-41d4-a716-446655440009', name: 'Home & Kitchen' },
  { id: '550e8400-e29b-41d4-a716-446655440010', name: 'Medical Supplies' },
];

export default function PostTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [useFlatFee, setUseFlatFee] = useState(false);
  const [formData, setFormData] = useState({
    origin_country: "NG",
    origin_city: "",
    destination_country: "GB",
    destination_city: "",
    departure_date: "",
    arrival_date: "",
    airline: "",
    flight_number: "",
    total_capacity_kg: "",
    price_per_kg: "",
    flat_fee: "",
    currency: "USD",
    accepted_category_ids: [] as string[],
    notes: ""
  });

  const createListingMutation = useMutation({
    mutationFn: (data: any) => {
      // Prepare payload to match API spec
      const payload = {
        ...data,
        total_capacity_kg: parseFloat(data.total_capacity_kg),
        price_per_kg: useFlatFee ? null : parseFloat(data.price_per_kg),
        flat_fee: useFlatFee ? parseFloat(data.flat_fee) : null,
      };
      return apiClient.post("/travel-listings", payload);
    },
    onSuccess: () => {
      toast.success("Trip posted successfully!");
      navigate("/account/my-trips");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to post trip");
    }
  });

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.accepted_category_ids.length === 0) {
      toast.error("Please select at least one accepted category.");
      return;
    }
    createListingMutation.mutate(formData);
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleCategory = (id: string) => {
    setFormData(prev => ({
      ...prev,
      accepted_category_ids: prev.accepted_category_ids.includes(id)
        ? prev.accepted_category_ids.filter(c => c !== id)
        : [...prev.accepted_category_ids, id]
    }));
  };

  return (
    <AccountLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Post a New Trip</h2>
          <p className="text-gray-500">Earn money by carrying items for others on your next flight.</p>
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
                {i === 1 ? "Route" : i === 2 ? "Capacity" : "Review"}
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
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Departure Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="date" 
                          value={formData.departure_date}
                          onChange={(e) => updateFormData({ departure_date: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Arrival Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input 
                          type="date" 
                          value={formData.arrival_date}
                          onChange={(e) => updateFormData({ arrival_date: e.target.value })}
                          required 
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Airline (Optional)</Label>
                      <div className="relative">
                        <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="e.g. British Airways"
                          value={formData.airline}
                          onChange={(e) => updateFormData({ airline: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Flight Number (Optional)</Label>
                      <div className="relative">
                        <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="e.g. BA0076"
                          value={formData.flight_number}
                          onChange={(e) => updateFormData({ flight_number: e.target.value })}
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
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Total Capacity (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="e.g. 10"
                          value={formData.total_capacity_kg}
                          onChange={(e) => updateFormData({ total_capacity_kg: e.target.value })}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Pricing Model</Label>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-bold", !useFlatFee ? "text-carry-light" : "text-gray-400")}>Per KG</span>
                          <Switch
                            checked={useFlatFee}
                            onCheckedChange={setUseFlatFee}
                          />
                          <span className={cn("text-[10px] font-bold", useFlatFee ? "text-carry-light" : "text-gray-400")}>Flat Fee</span>
                        </div>
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        {useFlatFee ? (
                          <Input
                            type="number"
                            placeholder="e.g. 85"
                            value={formData.flat_fee}
                            onChange={(e) => updateFormData({ flat_fee: e.target.value })}
                            required
                            className="pl-10"
                          />
                        ) : (
                          <Input
                            type="number"
                            placeholder="e.g. 12"
                            value={formData.price_per_kg}
                            onChange={(e) => updateFormData({ price_per_kg: e.target.value })}
                            required
                            className="pl-10"
                          />
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {useFlatFee ? "Charged once for the entire capacity." : "Charged per kilogram carried."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Currency</Label>
                      <select
                        value={formData.currency}
                        onChange={(e) => updateFormData({ currency: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-carry-light"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Accepted Item Categories</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ITEM_CATEGORIES.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-all",
                            formData.accepted_category_ids.includes(cat.id)
                              ? "bg-carry-light/5 border-carry-light text-carry-light shadow-sm"
                              : "bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-200"
                          )}
                        >
                          <div className={cn(
                            "w-4 h-4 rounded-sm border flex items-center justify-center",
                            formData.accepted_category_ids.includes(cat.id) ? "bg-carry-light border-carry-light" : "bg-white border-gray-200"
                          )}>
                            {formData.accepted_category_ids.includes(cat.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Additional Notes (Optional)</Label>
                    <Textarea
                      placeholder="e.g. No liquids, items must be commercially packaged. Max single item 5kg."
                      value={formData.notes}
                      onChange={(e) => updateFormData({ notes: e.target.value })}
                      className="min-h-[100px]"
                    />
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
                    <h4 className="text-sm font-bold text-carry-darker uppercase tracking-widest">Trip Summary</h4>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div className="text-gray-400 font-medium">Route</div>
                      <div className="text-carry-darker font-bold">{formData.origin_city}, {formData.origin_country} → {formData.destination_city}, {formData.destination_country}</div>
                      
                      <div className="text-gray-400 font-medium">Departure</div>
                      <div className="text-carry-darker font-bold">{new Date(formData.departure_date).toLocaleDateString()}</div>
                      
                      <div className="text-gray-400 font-medium">Capacity & Pricing</div>
                      <div className="text-carry-darker font-bold">
                        {formData.total_capacity_kg}kg @ {useFlatFee ? `${formData.flat_fee}` : `${formData.price_per_kg}`} {formData.currency} {useFlatFee ? "Flat Fee" : "/kg"}
                      </div>

                      <div className="text-gray-400 font-medium">Accepted</div>
                      <div className="text-carry-darker font-bold flex flex-wrap gap-1">
                        {formData.accepted_category_ids.map(id => (
                          <span key={id} className="text-[10px] bg-carry-light/10 text-carry-light px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {ITEM_CATEGORIES.find(c => c.id === id)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-sm flex gap-3">
                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      By posting this trip, you agree to comply with international aviation security standards. You must inspect all items before accepting them.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1 font-bold h-12">
                      Back
                    </Button>
                    <Button type="submit" className="flex-[2] bg-carry-light text-white font-bold h-12" disabled={createListingMutation.isPending}>
                      {createListingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm & Post Trip"}
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
