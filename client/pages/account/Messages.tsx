import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AccountLayout from "@/components/layout/AccountLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, ArrowRight, Send, Search, MoreVertical, Loader2, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

interface Conversation {
  id: string;
  participant_name: string;
  participant_avatar?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export default function Messages() {
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: conversations, isLoading: isConvLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await apiClient.get("/conversations");
      return response.data.data as Conversation[];
    }
  });

  const { data: messages, isLoading: isMsgLoading } = useQuery({
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
      // Refetch messages or update local state
    }
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
                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", msg.is_mine ? "ml-auto items-end" : "mr-auto items-start")}>
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
