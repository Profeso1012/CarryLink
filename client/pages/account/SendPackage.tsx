import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import AccountLayout from "@/components/layout/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Package, Calendar, Weight, DollarSign, Info, Loader2, MapPin, Box, User, Phone, Mail, ImagePlus, CheckCircle2, AlertTriangle, XCircle, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { shipmentsApi, CreateShipmentRequest } from "@/api/shipments.api";

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

interface ProhibitedCheckResponse {
  success: boolean;
  data: {
    is_prohibited: boolean;
    requires_review: boolean;
    severity?: string;
    matched_keywords: string[];
    message: string;
  };
}

export default function SendPackage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    item_description: "",
    item_category_id: ITEM_CATEGORIES[0].id,
    origin_country: "NG",
    origin_city: "",
    destination_country: "CA",
    destination_city: "",
    declared_weight_kg: "",
    offered_price: "",
    currency: "USD",
    pickup_deadline: "",
    delivery_deadline: "",
    recipient_name: "",
    recipient_phone: "",
    recipient_email: "",
    pickup_address: "",
    delivery_address: ""
  });

  const [prohibitedCheck, setProhibitedCheck] = useState<{
    status: 'idle' | 'checking' | 'clear' | 'review' | 'prohibited';
    message: string;
  }>({ status: 'idle', message: '' });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Debounce for prohibited check
  useEffect(() => {
    if (!formData.item_description || formData.item_description.length < 3) {
      setProhibitedCheck({ status: 'idle', message: '' });
      return;
    }

    setProhibitedCheck(prev => ({ ...prev, status: 'checking' }));

    const handler = setTimeout(async () => {
      try {
        const response = await shipmentsApi.checkProhibited(
          formData.item_description,
          formData.item_category_id
        );

        const data = response;
        if (data.is_prohibited) {
          setProhibitedCheck({ status: 'prohibited', message: data.message });
        } else if (data.requires_review) {
          setProhibitedCheck({ status: 'review', message: data.message });
        } else {
          setProhibitedCheck({ status: 'clear', message: data.message });
        }
      } catch (error) {
        console.error("Prohibited check failed", error);
        setProhibitedCheck({ status: 'idle', message: '' });
      }
    }, 600);

    return () => clearTimeout(handler);
  }, [formData.item_description, formData.item_category_id]);

  const createShipmentMutation = useMutation({
    mutationFn: async (data: CreateShipmentRequest) => {
      return shipmentsApi.create(data, uploadedFiles);
    },
    onSuccess: (shipment) => {
      const isDraft = shipment.status === 'draft';
      if (isDraft) {
        toast.info("Shipment pending review. You'll be notified when it goes live.");
      } else {
        toast.success("Shipment request created successfully!");
      }
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
    if (prohibitedCheck.status === 'prohibited') {
      toast.error("Cannot submit prohibited items.");
      return;
    }
    
    // Convert string values to numbers for API
    const apiData: CreateShipmentRequest = {
      ...formData,
      declared_weight_kg: parseFloat(formData.declared_weight_kg),
      offered_price: parseFloat(formData.offered_price),
    };
    
    createShipmentMutation.mutate(apiData);
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedFiles.length + files.length > 5) {
      toast.error("You can upload at most 5 images.");
      return;
    }

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Create preview URLs
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setUploadedImages(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AccountLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-carry-darker">Request a Delivery</h2>
          <p className="text-gray-500">Find a traveler to carry your package across borders.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all",
                  step >= i ? "bg-carry-light text-white" : "bg-gray-100 text-gray-400"
                )}>
                  {i}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-widest hidden sm:inline",
                  step >= i ? "text-carry-darker" : "text-gray-400"
                )}>
                  {i === 1 ? "Details" : i === 2 ? "Route" : i === 3 ? "Recipient" : "Review"}
                </span>
              </div>
              {i < 4 && <div className="flex-1 h-[1px] bg-gray-100"></div>}
            </React.Fragment>
          ))}
        </div>

        <Card className="border-none shadow-sm overflow-hidden bg-white">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Package Description</Label>
                    <Textarea
                      placeholder="Describe exactly what you are shipping (e.g. 2 Nike sneakers, 3 polo shirts)..."
                      value={formData.item_description}
                      onChange={(e) => updateFormData({ item_description: e.target.value })}
                      required
                      className={cn(
                        "min-h-[100px]",
                        prohibitedCheck.status === 'prohibited' && "border-red-500 focus-visible:ring-red-500",
                        prohibitedCheck.status === 'review' && "border-amber-500 focus-visible:ring-amber-500",
                        prohibitedCheck.status === 'clear' && "border-green-500 focus-visible:ring-green-500"
                      )}
                    />

                    {/* Prohibited check indicator */}
                    {prohibitedCheck.status !== 'idle' && (
                      <div className={cn(
                        "flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-sm",
                        prohibitedCheck.status === 'checking' && "bg-gray-50 text-gray-500",
                        prohibitedCheck.status === 'clear' && "bg-green-50 text-green-600",
                        prohibitedCheck.status === 'review' && "bg-amber-50 text-amber-600",
                        prohibitedCheck.status === 'prohibited' && "bg-red-50 text-red-600"
                      )}>
                        {prohibitedCheck.status === 'checking' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {prohibitedCheck.status === 'clear' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {prohibitedCheck.status === 'review' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {prohibitedCheck.status === 'prohibited' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{prohibitedCheck.status === 'checking' ? "Checking for prohibited items..." : prohibitedCheck.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Category</Label>
                    <select
                      value={formData.item_category_id}
                      onChange={(e) => updateFormData({ item_category_id: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-carry-light"
                    >
                      {ITEM_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Weight (kg)</Label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 2.5"
                          value={formData.declared_weight_kg}
                          onChange={(e) => updateFormData({ declared_weight_kg: e.target.value })}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Offered Reward</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="relative col-span-2">
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
                        <select
                          value={formData.currency}
                          onChange={(e) => updateFormData({ currency: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-carry-light"
                        >
                          <option value="USD">USD</option>
                          <option value="NGN">NGN</option>
                          <option value="GBP">GBP</option>
                          <option value="CAD">CAD</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Package Images (Optional, max 5)</Label>
                    <div className="flex flex-wrap gap-4">
                      {uploadedImages.map((url, i) => (
                        <div key={i} className="relative w-24 h-24 rounded-sm border border-gray-100 overflow-hidden group">
                          <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {uploadedImages.length < 5 && (
                        <label className={cn(
                          "w-24 h-24 border-2 border-dashed border-gray-200 rounded-sm flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-carry-light hover:text-carry-light transition-all",
                          isUploading && "pointer-events-none opacity-50"
                        )}>
                          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                          <span className="text-[9px] font-bold uppercase tracking-widest mt-2">{isUploading ? "Uploading..." : "Add Photo"}</span>
                          <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium">Add clear photos of the items to improve trust with travelers.</p>
                  </div>

                  <Button type="button" onClick={handleNext} className="w-full bg-carry-light text-white font-bold h-12">
                    Next: Route Details
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
                        <option value="CA">Canada</option>
                        <option value="NG">Nigeria</option>
                        <option value="GB">United Kingdom</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Destination City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="e.g. Toronto"
                          value={formData.destination_city}
                          onChange={(e) => updateFormData({ destination_city: e.target.value })}
                          required
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Pickup Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Textarea
                        placeholder="Detailed address for pickup..."
                        value={formData.pickup_address}
                        onChange={(e) => updateFormData({ pickup_address: e.target.value })}
                        required
                        className="pl-10 h-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Textarea
                        placeholder="Detailed address for delivery..."
                        value={formData.delivery_address}
                        onChange={(e) => updateFormData({ delivery_address: e.target.value })}
                        required
                        className="pl-10 h-20"
                      />
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
                      Next: Recipient Info
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Recipient Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Full name of person receiving the package"
                        value={formData.recipient_name}
                        onChange={(e) => updateFormData({ recipient_name: e.target.value })}
                        required
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Recipient Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="tel"
                          placeholder="+234..."
                          value={formData.recipient_phone}
                          onChange={(e) => updateFormData({ recipient_phone: e.target.value })}
                          required
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase tracking-widest text-carry-muted">Recipient Email (Optional)</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={formData.recipient_email}
                          onChange={(e) => updateFormData({ recipient_email: e.target.value })}
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1 font-bold h-12">
                      Back
                    </Button>
                    <Button type="button" onClick={handleNext} className="flex-[2] bg-carry-light text-white font-bold h-12">
                      Next: Review
                    </Button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-carry-bg rounded-sm p-6 space-y-6">
                    <h4 className="text-xs font-black text-carry-darker uppercase tracking-[0.2em]">Summary & Review</h4>

                    <div className="space-y-4">
                      <div className="grid grid-cols-[1fr_2fr] gap-4 text-[13px]">
                        <span className="text-carry-muted font-bold uppercase text-[10px] tracking-widest">Description</span>
                        <span className="text-carry-darker font-medium">{formData.item_description}</span>

                        <span className="text-carry-muted font-bold uppercase text-[10px] tracking-widest">Route</span>
                        <span className="text-carry-darker font-bold">{formData.origin_city}, {formData.origin_country} &rarr; {formData.destination_city}, {formData.destination_country}</span>

                        <span className="text-carry-muted font-bold uppercase text-[10px] tracking-widest">Weight</span>
                        <span className="text-carry-darker font-bold">{formData.declared_weight_kg} kg</span>

                        <span className="text-carry-muted font-bold uppercase text-[10px] tracking-widest">Reward</span>
                        <span className="text-carry-darker font-black text-carry-light">{formData.offered_price} {formData.currency}</span>

                        <span className="text-carry-muted font-bold uppercase text-[10px] tracking-widest">Recipient</span>
                        <span className="text-carry-darker font-bold">{formData.recipient_name} ({formData.recipient_phone})</span>
                      </div>
                    </div>

                    {uploadedImages.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {uploadedImages.map((url, i) => (
                          <div key={i} className="w-12 h-12 rounded-sm border border-white/50 overflow-hidden shadow-sm">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-sm flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      By confirming, you agree that your reward of <strong>{formData.offered_price} {formData.currency}</strong> will be held in escrow. It will only be released to the traveler once the recipient confirms delivery.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" onClick={handleBack} variant="outline" className="flex-1 font-bold h-12">
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="flex-[2] bg-carry-light text-white font-bold h-12 shadow-lg shadow-carry-light/20"
                      disabled={createShipmentMutation.isPending || prohibitedCheck.status === 'prohibited'}
                    >
                      {createShipmentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm & Pay into Escrow"}
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
