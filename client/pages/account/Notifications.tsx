import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Package, 
  MessageSquare, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

function NotificationIcon({ type }: { type: string }) {
  const styles: Record<string, { icon: any, bg: string, color: string }> = {
    booking_update: { icon: Package, bg: "bg-blue-50", color: "text-blue-500" },
    message: { icon: MessageSquare, bg: "bg-carry-light/10", color: "text-carry-light" },
    kyc_update: { icon: ShieldCheck, bg: "bg-green-50", color: "text-green-500" },
    payment: { icon: CreditCard, bg: "bg-purple-50", color: "text-purple-500" },
    match: { icon: TrendingUp, bg: "bg-amber-50", color: "text-amber-500" },
    alert: { icon: AlertCircle, bg: "bg-red-50", color: "text-red-500" }
  };

  const { icon: Icon, bg, color } = styles[type] || styles.booking_update;

  return (
    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", bg)}>
      <Icon className={cn("w-5 h-5", color)} />
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await apiClient.get("/notifications");
      return response.data.data as Notification[];
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => apiClient.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-carry-darker">Notifications</h2>
            <p className="text-gray-500">Stay updated on your shipments, trips, and account activity.</p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || !notifications?.some(n => !n.is_read)}
            className="font-bold text-xs uppercase tracking-widest h-10"
          >
            Mark all as read
          </Button>
        </div>

        <div className="bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          {isLoading ? (
            <div className="p-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-carry-light" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-6 flex items-start gap-4 transition-colors group relative",
                    !n.is_read ? "bg-carry-bg/30 border-l-[3px] border-l-carry-light" : "bg-white border-l-[3px] border-l-transparent hover:bg-gray-50/50"
                  )}
                >
                  <NotificationIcon type={n.type} />
                  
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn("text-sm font-bold truncate", !n.is_read ? "text-carry-darker" : "text-gray-600")}>
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-carry-light shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <Clock className="w-3 h-3" />
                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {!n.is_read && (
                    <button 
                      onClick={() => markReadMutation.mutate(n.id)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-300 hover:text-carry-light hover:border-carry-light transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 flex flex-col items-center text-center space-y-4 bg-white">
              <div className="w-16 h-16 rounded-full bg-carry-bg flex items-center justify-center text-carry-muted">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-carry-darker">Inbox zero</h3>
              <p className="text-gray-500 max-w-sm">No notifications to show right now. We'll let you know when something important happens.</p>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
