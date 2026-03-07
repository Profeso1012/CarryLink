import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MessageSquare, 
  User, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  ThumbsUp,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_name: string;
  booking?: {
    shipment_title: string;
    route: string;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star 
          key={i} 
          className={cn("w-3.5 h-3.5", i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} 
        />
      ))}
    </div>
  );
}

export default function Reviews() {
  const [activeTab, setActiveTab] = useState<"received" | "given">("received");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", activeTab],
    queryFn: async () => {
      const endpoint = activeTab === "received" ? "/reviews/mine" : "/reviews/given";
      const response = await apiClient.get(endpoint);
      return response.data.data as Review[];
    }
  });

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Reputation & Reviews</h2>
            <p className="text-gray-500">Your track record of trust and reliability on CarryLink.</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-sm self-start">
            <button 
              onClick={() => setActiveTab("received")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm",
                activeTab === "received" ? "bg-white text-carry-light shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Reviews for Me
            </button>
            <button 
              onClick={() => setActiveTab("given")}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-sm",
                activeTab === "given" ? "bg-white text-carry-light shadow-sm" : "text-gray-400 hover:text-gray-600"
              )}
            >
              Reviews I've Written
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-carry-darker border-none shadow-md overflow-hidden p-6 text-white">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-carry-light/20 flex items-center justify-center text-carry-light">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Trust Score</p>
                <h3 className="text-3xl font-bold tracking-tighter">98<span className="text-lg opacity-40">/100</span></h3>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-none text-[9px] uppercase tracking-widest px-2 py-0.5 font-bold">Excellent</Badge>
            </div>
          </Card>
          
          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Success Rate</span>
              <span className="text-lg font-bold text-carry-darker tracking-tight">100% Delivery</span>
            </div>
          </Card>

          <Card className="bg-white border-carry-light/10 shadow-sm overflow-hidden p-6 flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-carry-muted">Account Age</span>
              <span className="text-lg font-bold text-carry-darker tracking-tight">2 Years Active</span>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-carry-muted border-b border-gray-100 pb-3">
            Recent {activeTab === "received" ? "Feedback" : "Activity"}
          </h3>

          {isLoading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {reviews.map((review) => (
                <Card key={review.id} className="bg-white border-carry-light/10 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted overflow-hidden">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-carry-darker text-sm">{review.reviewer_name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <StarRating rating={review.rating} />
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-carry-muted uppercase tracking-tight bg-gray-50 px-2 py-1 rounded-sm">
                            <ArrowRight className="w-3 h-3" />
                            {review.booking?.shipment_title}
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 leading-relaxed italic italic-quotes">
                          "{review.comment}"
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white border border-carry-light/10 rounded-sm shadow-sm">
              <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-carry-darker">No reviews yet</h3>
              <p className="text-gray-500 max-w-sm">Complete deliveries to build your reputation and earn reviews from other users.</p>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
