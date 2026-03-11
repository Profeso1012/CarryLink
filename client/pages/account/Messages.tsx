import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, ArrowRight, Send, Search, MoreVertical, Loader2, MessageSquare, Clock, CreditCard, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  match_id?: string;
  booking_id?: string;
}

interface Message {
  id: string;
  sender_id: string;
  sender_name?: string;
  content?: string;
  message_type: string;
  created_at: string;
  is_mine: boolean;
  // For payment_request messages
  booking_id?: string;
  amount?: number;
  currency?: string;
  payment_status?: string;
}

export default function Messages() {
  const navigate = useNavigate();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const { data: conversations, isLoading: isConvLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiClient.get("/conversations");
      return response.data.data as Conversation[];
    }
  });

  const { data: messages, isLoading: isMsgLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["messages", selectedConvId],
    queryFn: async () => {
      if (!selectedConvId) return [];
      const response = await apiClient.get(`/conversations/${selectedConvId}/messages`);
      return response.data.data as Message[];
    },
    enabled: !!selectedConvId
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient.post(`/conversations/${selectedConvId}/messages`, { content }),
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    }
  });

  const initiatePaymentMutation = useMutation({
    mutationFn: (bookingId: string) =>
      apiClient.post(`/payments/initiate/${bookingId}`),
    onSuccess: (data) => {
      // Redirect to payment gateway
      if (data.data?.payment_url) {
        window.location.href = data.data.payment_url;
      } else {
        toast.success("Payment initiated. Redirecting...");
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to initiate payment");
    },
    onSettled: () => setProcessingPaymentId(null)
  });

  const selectedConv = conversations?.find(c => c.id === selectedConvId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(messageText);
  };

  return (
    <AccountLayout>
      <div className="h-[calc(100vh-240px)] min-h-[600px] flex gap-6">
        {/* Conversations List */}
        <div className="w-full lg:w-[320px] flex flex-col bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search chats..." 
                className="pl-9 h-9 text-xs bg-white border-gray-200"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {isConvLoading ? (
              <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-carry-light" /></div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 text-left transition-all border-b border-gray-50 hover:bg-gray-50/50",
                    selectedConvId === conv.id ? "bg-carry-bg border-l-[3px] border-l-carry-light" : "bg-white"
                  )}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light font-bold text-sm">
                      {conv.participant_name.charAt(0)}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-carry-light text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-carry-darker text-[13px] truncate">{conv.participant_name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate leading-relaxed">
                      {conv.last_message || "No messages yet"}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-10 text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto" />
                <p className="text-xs text-gray-400 font-medium">No active conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white rounded-sm shadow-sm border border-carry-light/10 overflow-hidden">
          {selectedConvId ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-carry-light/10 flex items-center justify-center text-carry-light font-bold text-xs uppercase">
                    {selectedConv?.participant_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-carry-darker text-[14px] leading-tight">{selectedConv?.participant_name}</h4>
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter">Online</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-400">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-carry-bg/30">
                {isMsgLoading ? (
                  <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-carry-light" /></div>
                ) : messages && messages.length > 0 ? (
                  messages.map((msg) => (
                    <div key={msg.id} className={cn("flex flex-col", msg.is_mine ? "ml-auto items-end" : "mr-auto items-start")}>
                      {/* Text Messages */}
                      {msg.message_type === "text" && msg.content && (
                        <div className={cn("max-w-[80%]", "flex flex-col")}>
                          <div className={cn(
                            "p-3 rounded-md text-[13px] leading-relaxed shadow-sm",
                            msg.is_mine ? "bg-carry-light text-white rounded-tr-none" : "bg-white text-carry-darker border border-carry-light/10 rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1.5 font-bold uppercase tracking-widest px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}

                      {/* System Messages */}
                      {msg.message_type === "system" && msg.content && (
                        <div className="w-full py-3 px-4 text-center text-[12px] text-gray-500 italic">
                          {msg.content}
                        </div>
                      )}

                      {/* Payment Request Messages */}
                      {msg.message_type === "payment_request" && (
                        <div className={cn("max-w-[80%] w-full", "flex flex-col")}>
                          <div className={cn(
                            "rounded-md shadow-sm overflow-hidden",
                            msg.is_mine ? "bg-carry-light/10 border border-carry-light" : "bg-white border border-carry-light/10"
                          )}>
                            <div className="p-4 space-y-4">
                              <div className="flex items-center gap-2">
                                <CreditCard className={cn("w-5 h-5", msg.is_mine ? "text-carry-darker" : "text-carry-light")} />
                                <span className={cn("font-bold text-[13px]", msg.is_mine ? "text-carry-darker" : "text-carry-darker")}>
                                  Payment Request
                                </span>
                              </div>

                              <div className="bg-gray-50 rounded-md p-3">
                                <div className="flex items-baseline justify-between">
                                  <span className="text-[11px] text-gray-500 font-bold uppercase">Amount</span>
                                  <div className="text-right">
                                    <div className="text-2xl font-black text-carry-light">
                                      {msg.currency === "USD" ? "$" : "₦"}{msg.amount?.toFixed(2)}
                                    </div>
                                    <span className="text-[9px] text-gray-400 font-bold uppercase">{msg.currency || "USD"}</span>
                                  </div>
                                </div>
                              </div>

                              {msg.payment_status === "completed" ? (
                                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md text-green-700">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-[12px] font-bold uppercase">Payment Complete</span>
                                </div>
                              ) : !msg.is_mine ? (
                                <Button
                                  onClick={() => {
                                    if (msg.booking_id) {
                                      setProcessingPaymentId(msg.booking_id);
                                      initiatePaymentMutation.mutate(msg.booking_id);
                                    }
                                  }}
                                  disabled={initiatePaymentMutation.isPending || processingPaymentId === msg.booking_id}
                                  className="w-full bg-carry-light hover:bg-carry-light/90 text-white font-bold h-12 text-sm uppercase tracking-widest"
                                >
                                  {initiatePaymentMutation.isPending && processingPaymentId === msg.booking_id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing...
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard className="w-4 h-4 mr-2" /> Pay Now
                                    </>
                                  )}
                                </Button>
                              ) : (
                                <div className="text-center p-3 bg-gray-50 rounded-md">
                                  <span className="text-[11px] text-gray-500 font-bold uppercase">Awaiting payment from sender</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-400 mt-1.5 font-bold uppercase tracking-widest px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-carry-light shadow-sm">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-carry-darker">Start of conversation</p>
                      <p className="text-xs text-gray-400">Send your first message to begin coordinating your delivery.</p>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <Input 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 h-11 text-sm border-gray-200 focus:border-carry-light bg-gray-50/50"
                />
                <Button 
                  type="submit" 
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                  className="w-11 h-11 rounded-sm bg-carry-light hover:bg-carry-light/90 text-white flex items-center justify-center shrink-0 p-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gray-50/30">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-200 shadow-sm mb-6">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-carry-darker">Select a conversation</h3>
              <p className="text-sm text-gray-400 max-w-xs mt-2 leading-relaxed">
                Connect with senders or travelers to discuss item details, pickup locations, and timelines.
              </p>
            </div>
          )}
        </div>
      </div>
    </AccountLayout>
  );
}
