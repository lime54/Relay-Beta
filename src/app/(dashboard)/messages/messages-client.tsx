"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MessageCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Connection {
    id: string;
    request_type: string;
    requester_id: string;
    recipient_id: string;
    requester: { name: string; athlete_profiles: any };
    recipient: { name: string; athlete_profiles: any };
}

export default function MessagesClient({ userId, initialConnections }: { userId: string, initialConnections: any[] }) {
    const searchParams = useSearchParams();
    const targetUser = searchParams.get('user');
    
    // Auto-select conversation if ?user= is in the URL
    const initialSelectedId = (() => {
        if (targetUser) {
            const match = initialConnections.find((c: Connection) => 
                c.requester_id === targetUser || c.recipient_id === targetUser
            );
            if (match) return match.id;
        }
        return null;
    })();

    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const supabase = createClient();

    useEffect(() => {
        if (targetUser) {
            const match = initialConnections.find((c: Connection) => 
                c.requester_id === targetUser || c.recipient_id === targetUser
            );
            if (match) {
                setSelectedId(match.id);
            }
        }
    }, [targetUser, initialConnections]);

    const selectedConnection = initialConnections.find(c => c.id === selectedId) as Connection | undefined;
    
    // The other person is the one who is NOT the current userId
    const otherPerson = selectedConnection 
        ? (selectedConnection.requester_id === userId ? selectedConnection.recipient : selectedConnection.requester)
        : null;

    useEffect(() => {
        if (!selectedId) return;

        async function fetchMessages() {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('request_id', selectedId)
                .order('created_at', { ascending: true });

            if (data) setMessages(data);
        }

        fetchMessages();

        const channel = supabase
            .channel(`messages-${selectedId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `request_id=eq.${selectedId}`
            }, (payload) => {
                setMessages(prev => {
                    // Prevent duplicate messages if realtime fires quickly
                    if (prev.some(m => m.id === payload.new.id)) return prev;
                    return [...prev, payload.new];
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedId, supabase]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedId || !selectedConnection) return;

        const receiverId = selectedConnection.requester_id === userId
            ? selectedConnection.recipient_id
            : selectedConnection.requester_id;

        const { error } = await supabase
            .from('messages')
            .insert({
                request_id: selectedId,
                sender_id: userId,
                receiver_id: receiverId,
                content: newMessage.trim()
            });

        if (!error) setNewMessage("");
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4 animate-fade-in">
            {/* Sidebar: Connections List */}
            <div className="w-80 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search messages..." className="pl-9 rounded-xl bg-muted/50 border-none" />
                </div>

                <ScrollArea className="flex-1 rounded-2xl border border-border/50 bg-card overflow-hidden">
                    <div className="divide-y divide-border/30">
                        {initialConnections.length === 0 ? (
                            <div className="p-8 text-center text-sm text-muted-foreground">
                                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                No active chats yet.
                            </div>
                        ) : (
                            initialConnections.map((conn: Connection) => {
                                const contact = conn.requester_id === userId ? conn.recipient : conn.requester;
                                return (
                                    <button
                                        key={conn.id}
                                        onClick={() => setSelectedId(conn.id)}
                                        className={cn(
                                            "w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/50",
                                            selectedId === conn.id && "bg-secondary/10 border-r-4 border-secondary"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border-border/50 border">
                                            <AvatarImage src={contact?.athlete_profiles?.avatar_url} />
                                            <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-bold">
                                                {contact?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">{contact?.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{conn.request_type.replace('_', ' ')}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main: Chat Window */}
            <div className="flex-1 flex flex-col rounded-3xl border border-border/50 bg-card shadow-xl overflow-hidden relative">
                {!selectedId ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-12">
                        <div className="h-20 w-20 bg-secondary/5 text-secondary rounded-full flex items-center justify-center mb-6">
                            <MessageCircle className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Your Conversations</h2>
                        <p className="text-muted-foreground max-w-xs text-sm">Select an athlete from your huddle to start or continue a career conversation.</p>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border/50 flex items-center gap-4 bg-muted/20">
                            <Avatar className="h-10 w-10 border-border/50 border">
                                <AvatarImage src={otherPerson?.athlete_profiles?.avatar_url} />
                                <AvatarFallback className="bg-secondary/10 text-secondary font-bold">
                                    {otherPerson?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-bold">{otherPerson?.name}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    {otherPerson?.athlete_profiles?.sport || "Multi-Sport"} • {otherPerson?.athlete_profiles?.school || "University"}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.map((m, idx) => (
                                <div key={idx} className={cn("flex", m.sender_id === userId ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                        m.sender_id === userId
                                            ? "bg-secondary text-white rounded-tr-none"
                                            : "bg-muted text-foreground rounded-tl-none border border-border/40"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-muted/10 border-t border-border/50 flex gap-2">
                            <Input
                                placeholder="Type your message..."
                                className="rounded-xl bg-background border-border/50 h-12"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                            />
                            <Button size="icon" className="h-12 w-12 rounded-xl bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20" onClick={sendMessage}>
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Simple internal ScrollArea for sidebar
function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}
