"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Send,
    MessageCircle,
    ChevronRight,
    FileText,
    X,
    Clock,
    Sparkles,
    Handshake,
    Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/contexts/notification-context";
import { motion, AnimatePresence } from "framer-motion";

interface Connection {
    id: string;
    request_type: string;
    context: string;
    time_commitment: string | null;
    offer_in_return: string | null;
    created_at: string;
    expires_at: string | null;
    requester_id: string;
    recipient_id: string;
    requester: { name: string; athlete_profiles: any };
    recipient: { name: string; athlete_profiles: any };
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
    advice: "Career Advice",
    internship: "Internship Inquiry",
    referral: "Job Referral",
    mentorship: "Mentorship",
};

const TIME_LABELS: Record<string, string> = {
    "15min": "15 min Coffee Chat",
    "30min_call": "30 min Call",
    "30min_coffee": "30 min Coffee Chat",
    mentorship: "Ongoing Mentorship",
    review: "Resume Review",
};

function RequestDetailsPanel({
    connection,
    userId,
    onClose,
}: {
    connection: Connection;
    userId: string;
    onClose: () => void;
}) {
    const isRequester = connection.requester_id === userId;
    const otherPerson = isRequester ? connection.recipient : connection.requester;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden border-b border-border/50"
        >
            <div className="p-5 bg-gradient-to-b from-secondary/[0.04] to-transparent space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Original Request Details
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full hover:bg-muted"
                        onClick={onClose}
                    >
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-background border border-border/40">
                        <div className="flex items-center gap-1.5 mb-1">
                            <Sparkles className="h-3 w-3 text-secondary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Type
                            </span>
                        </div>
                        <p className="text-sm font-semibold">
                            {REQUEST_TYPE_LABELS[connection.request_type] || connection.request_type}
                        </p>
                    </div>
                    {connection.time_commitment && (
                        <div className="p-3 rounded-xl bg-background border border-border/40">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="h-3 w-3 text-secondary" />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Time
                                </span>
                            </div>
                            <p className="text-sm font-semibold">
                                {TIME_LABELS[connection.time_commitment] || connection.time_commitment}
                            </p>
                        </div>
                    )}
                </div>

                {connection.context && (
                    <div className="p-3 rounded-xl bg-background border border-border/40">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <MessageCircle className="h-3 w-3 text-secondary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {isRequester ? "Your message" : `${otherPerson?.name?.split(" ")[0]}'s message`}
                            </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                            {connection.context}
                        </p>
                    </div>
                )}

                {connection.offer_in_return && (
                    <div className="p-3 rounded-xl bg-background border border-border/40">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Handshake className="h-3 w-3 text-secondary" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Offered in return
                            </span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                            {connection.offer_in_return}
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                    <Calendar className="h-3 w-3" />
                    Sent {new Date(connection.created_at).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                    })}
                </div>
            </div>
        </motion.div>
    );
}

export default function MessagesClient({
    userId,
    initialConnections,
}: {
    userId: string;
    initialConnections: any[];
}) {
    const searchParams = useSearchParams();
    const targetUser = searchParams.get("user");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const initialSelectedId = (() => {
        if (targetUser) {
            const match = initialConnections.find(
                (c: Connection) =>
                    c.requester_id === targetUser || c.recipient_id === targetUser
            );
            if (match) return match.id;
        }
        return null;
    })();

    const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [showRequestDetails, setShowRequestDetails] = useState(false);
    const supabase = createClient();
    const { markMessagesSeen } = useNotifications();

    useEffect(() => {
        if (targetUser) {
            const match = initialConnections.find(
                (c: Connection) =>
                    c.requester_id === targetUser || c.recipient_id === targetUser
            );
            if (match) {
                setSelectedId(match.id);
            }
        }
    }, [targetUser, initialConnections]);

    // Close details panel when switching conversations
    useEffect(() => {
        setShowRequestDetails(false);
    }, [selectedId]);

    const selectedConnection = initialConnections.find(
        (c) => c.id === selectedId
    ) as Connection | undefined;

    const otherPerson = selectedConnection
        ? selectedConnection.requester_id === userId
            ? selectedConnection.recipient
            : selectedConnection.requester
        : null;

    useEffect(() => {
        if (!selectedId) return;

        async function fetchMessages() {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("request_id", selectedId)
                .order("created_at", { ascending: true });

            if (data) setMessages(data);

            if (
                selectedId &&
                data &&
                data.some((m) => m.receiver_id === userId && !m.is_read)
            ) {
                await markMessagesSeen(selectedId);
            }
        }

        fetchMessages();

        const channel = supabase
            .channel(`messages-${selectedId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `request_id=eq.${selectedId}`,
                },
                (payload) => {
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedId, supabase, userId, markMessagesSeen]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedId || !selectedConnection) return;

        const receiverId =
            selectedConnection.requester_id === userId
                ? selectedConnection.recipient_id
                : selectedConnection.requester_id;

        const { error } = await supabase.from("messages").insert({
            request_id: selectedId,
            sender_id: userId,
            receiver_id: receiverId,
            content: newMessage.trim(),
        });

        if (!error) setNewMessage("");
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-4 animate-fade-in">
            {/* Sidebar: Connections List */}
            <div className="w-80 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-9 rounded-xl bg-muted/50 border-none"
                    />
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
                                const contact =
                                    conn.requester_id === userId
                                        ? conn.recipient
                                        : conn.requester;
                                return (
                                    <button
                                        key={conn.id}
                                        onClick={() => setSelectedId(conn.id)}
                                        className={cn(
                                            "w-full p-4 flex items-center gap-3 text-left transition-colors hover:bg-muted/50",
                                            selectedId === conn.id &&
                                                "bg-secondary/10 border-r-4 border-secondary"
                                        )}
                                    >
                                        <Avatar className="h-10 w-10 border-border/50 border">
                                            <AvatarImage
                                                src={contact?.athlete_profiles?.avatar_url}
                                            />
                                            <AvatarFallback className="bg-secondary/10 text-secondary text-xs font-bold">
                                                {contact?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm truncate">
                                                {contact?.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {REQUEST_TYPE_LABELS[conn.request_type] ||
                                                    conn.request_type?.replace("_", " ")}
                                            </p>
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
                        <p className="text-muted-foreground max-w-xs text-sm">
                            Select an athlete from your huddle to start or continue a
                            career conversation.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Chat header */}
                        <div className="p-4 border-b border-border/50 flex items-center gap-4 bg-muted/20">
                            <Avatar className="h-10 w-10 border-border/50 border">
                                <AvatarImage
                                    src={otherPerson?.athlete_profiles?.avatar_url}
                                />
                                <AvatarFallback className="bg-secondary/10 text-secondary font-bold">
                                    {otherPerson?.name?.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold">{otherPerson?.name}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    {otherPerson?.athlete_profiles?.sport || "Multi-Sport"}{" "}
                                    •{" "}
                                    {otherPerson?.athlete_profiles?.school || "University"}
                                </p>
                            </div>
                            <Button
                                variant={showRequestDetails ? "secondary" : "outline"}
                                size="sm"
                                className={cn(
                                    "rounded-full gap-1.5 text-xs font-semibold transition-all",
                                    showRequestDetails && "bg-secondary text-secondary-foreground"
                                )}
                                onClick={() =>
                                    setShowRequestDetails(!showRequestDetails)
                                }
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Request Details
                            </Button>
                        </div>

                        {/* Sliding request details panel */}
                        <AnimatePresence>
                            {showRequestDetails && selectedConnection && (
                                <RequestDetailsPanel
                                    connection={selectedConnection}
                                    userId={userId}
                                    onClose={() => setShowRequestDetails(false)}
                                />
                            )}
                        </AnimatePresence>

                        {/* Messages */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                    <MessageCircle className="h-8 w-8 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No messages yet. Say hello!
                                    </p>
                                </div>
                            )}
                            {messages.map((m, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "flex",
                                        m.sender_id === userId
                                            ? "justify-end"
                                            : "justify-start"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                            m.sender_id === userId
                                                ? "bg-secondary text-white rounded-tr-none"
                                                : "bg-muted text-foreground rounded-tl-none border border-border/40"
                                        )}
                                    >
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div className="p-4 bg-muted/10 border-t border-border/50 flex gap-2">
                            <Input
                                placeholder="Type your message..."
                                className="rounded-xl bg-background border-border/50 h-12"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) =>
                                    e.key === "Enter" && sendMessage()
                                }
                            />
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-xl bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20"
                                onClick={sendMessage}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function ScrollArea({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return <div className={cn("overflow-y-auto", className)}>{children}</div>;
}
