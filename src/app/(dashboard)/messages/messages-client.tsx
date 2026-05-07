"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    Paperclip,
    Image as ImageIcon,
    File,
    Download,
    Check,
    CheckCheck,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/contexts/notification-context";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface Message {
    id: string;
    created_at: string;
    sender_id: string;
    receiver_id: string;
    request_id: string;
    content: string;
    is_read: boolean;
    file_url?: string | null;
    file_type?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// Linkify helper — makes URLs clickable
// ---------------------------------------------------------------------------

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

function linkifyContent(text: string, isSent: boolean) {
    const parts = text.split(URL_REGEX);
    if (parts.length === 1) return text;

    return parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
            // Reset lastIndex since we're reusing the global regex
            URL_REGEX.lastIndex = 0;
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "underline underline-offset-2 break-all",
                        isSent
                            ? "text-white/90 hover:text-white"
                            : "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    )}
                >
                    {part.length > 50 ? part.slice(0, 47) + "…" : part}
                </a>
            );
        }
        return part;
    });
}

// ---------------------------------------------------------------------------
// Typing indicator dots
// ---------------------------------------------------------------------------

function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="flex justify-start"
        >
            <div className="bg-muted text-foreground rounded-2xl rounded-tl-none border border-border/40 px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        className="block h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
                        animate={{ y: [0, -4, 0] }}
                        transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Attachment preview bar (before sending)
// ---------------------------------------------------------------------------

function AttachmentPreview({
    file,
    preview,
    onRemove,
}: {
    file: File;
    preview: string | null;
    onRemove: () => void;
}) {
    const isImage = file.type.startsWith("image/");
    const sizeLabel =
        file.size < 1024
            ? `${file.size} B`
            : file.size < 1024 * 1024
              ? `${(file.size / 1024).toFixed(1)} KB`
              : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="overflow-hidden border-t border-border/50 bg-muted/20"
        >
            <div className="p-3 flex items-center gap-3">
                {isImage && preview ? (
                    <img
                        src={preview}
                        alt="Preview"
                        className="h-14 w-14 rounded-lg object-cover border border-border/50"
                    />
                ) : (
                    <div className="h-14 w-14 rounded-lg bg-secondary/10 flex items-center justify-center border border-border/50">
                        <File className="h-6 w-6 text-secondary" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{sizeLabel}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                    onClick={onRemove}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Message attachment renderer (in-bubble)
// ---------------------------------------------------------------------------

function MessageAttachment({
    fileUrl,
    fileType,
    isSent,
}: {
    fileUrl: string;
    fileType: string | null;
    isSent: boolean;
}) {
    const isImage = fileType?.startsWith("image/");

    if (isImage) {
        return (
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                <img
                    src={fileUrl}
                    alt="Attachment"
                    className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                />
            </a>
        );
    }

    // Generic file download
    const fileName = fileUrl.split("/").pop() || "file";
    return (
        <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "flex items-center gap-2 p-2.5 rounded-lg transition-colors",
                isSent
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-muted hover:bg-muted/80"
            )}
        >
            <File
                className={cn(
                    "h-5 w-5 shrink-0",
                    isSent ? "text-white/70" : "text-secondary"
                )}
            />
            <span
                className={cn(
                    "text-sm truncate flex-1",
                    isSent ? "text-white/90" : "text-foreground"
                )}
            >
                {fileName.length > 30 ? fileName.slice(0, 27) + "…" : fileName}
            </span>
            <Download
                className={cn(
                    "h-4 w-4 shrink-0",
                    isSent ? "text-white/50" : "text-muted-foreground"
                )}
            />
        </a>
    );
}

// ---------------------------------------------------------------------------
// Request Details Panel
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [showRequestDetails, setShowRequestDetails] = useState(false);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastTypingBroadcast = useRef<number>(0);

    const supabase = createClient();
    const { markMessagesSeen } = useNotifications();

    // Select conversation when navigating from another page
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
        setAttachmentFile(null);
        setAttachmentPreview(null);
    }, [selectedId]);

    const selectedConnection = initialConnections.find(
        (c) => c.id === selectedId
    ) as Connection | undefined;

    const otherPerson = selectedConnection
        ? selectedConnection.requester_id === userId
            ? selectedConnection.recipient
            : selectedConnection.requester
        : null;

    const otherId = selectedConnection
        ? selectedConnection.requester_id === userId
            ? selectedConnection.recipient_id
            : selectedConnection.requester_id
        : null;

    // -----------------------------------------------------------------------
    // Fetch messages + realtime (INSERT + UPDATE for read receipts)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!selectedId) return;

        let cancelled = false;

        async function fetchMessages() {
            const { data } = await supabase
                .from("messages")
                .select("*")
                .eq("request_id", selectedId)
                .order("created_at", { ascending: true });

            if (!cancelled && data) {
                setMessages(data);

                // Mark unread incoming messages as seen
                if (data.some((m) => m.receiver_id === userId && !m.is_read)) {
                    await markMessagesSeen(selectedId!);
                }
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
                async (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // Auto-mark as read if the chat is open and the message is for us
                    if (newMsg.receiver_id === userId) {
                        await markMessagesSeen(selectedId!);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "messages",
                    filter: `request_id=eq.${selectedId}`,
                },
                (payload) => {
                    const updated = payload.new as Message;
                    setMessages((prev) =>
                        prev.map((m) => (m.id === updated.id ? updated : m))
                    );
                }
            )
            .subscribe();

        return () => {
            cancelled = true;
            supabase.removeChannel(channel);
        };
    }, [selectedId, supabase, userId, markMessagesSeen]);

    // -----------------------------------------------------------------------
    // Typing indicator (broadcast channel)
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!selectedId || !otherId) return;

        const typingChannel = supabase
            .channel(`typing-${selectedId}`)
            .on("broadcast", { event: "typing" }, (payload: any) => {
                if (payload.payload?.userId !== userId) {
                    setOtherTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(typingChannel);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setOtherTyping(false);
        };
    }, [selectedId, otherId, supabase, userId]);

    const broadcastTyping = useCallback(() => {
        if (!selectedId) return;
        const now = Date.now();
        if (now - lastTypingBroadcast.current < 2000) return;
        lastTypingBroadcast.current = now;

        supabase.channel(`typing-${selectedId}`).send({
            type: "broadcast",
            event: "typing",
            payload: { userId },
        });
    }, [selectedId, supabase, userId]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, otherTyping]);

    // -----------------------------------------------------------------------
    // File attachment handling
    // -----------------------------------------------------------------------
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            alert("File type not supported. Please upload an image, PDF, Word doc, or text file.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            alert("File is too large. Maximum size is 10 MB.");
            return;
        }

        setAttachmentFile(file);
        if (file.type.startsWith("image/")) {
            setAttachmentPreview(URL.createObjectURL(file));
        } else {
            setAttachmentPreview(null);
        }

        // Reset the input so the same file can be re-selected
        e.target.value = "";
    };

    const clearAttachment = () => {
        if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
        setAttachmentFile(null);
        setAttachmentPreview(null);
    };

    // -----------------------------------------------------------------------
    // Send message
    // -----------------------------------------------------------------------
    const sendMessage = async () => {
        if ((!newMessage.trim() && !attachmentFile) || !selectedId || !selectedConnection) return;

        const receiverId =
            selectedConnection.requester_id === userId
                ? selectedConnection.recipient_id
                : selectedConnection.requester_id;

        setIsUploading(!!attachmentFile);

        let fileUrl: string | null = null;
        let fileType: string | null = null;

        // Upload attachment if present
        if (attachmentFile) {
            const ext = attachmentFile.name.split(".").pop() || "bin";
            const path = `${selectedId}/${crypto.randomUUID()}.${ext}`;

            const { error: uploadErr } = await supabase.storage
                .from("chat-attachments")
                .upload(path, attachmentFile, { cacheControl: "3600" });

            if (uploadErr) {
                console.error("Upload failed:", uploadErr);
                setIsUploading(false);
                alert("Failed to upload file. Please try again.");
                return;
            }

            const { data: urlData } = supabase.storage
                .from("chat-attachments")
                .getPublicUrl(path);

            fileUrl = urlData.publicUrl;
            fileType = attachmentFile.type;
        }

        const insertPayload: any = {
            request_id: selectedId,
            sender_id: userId,
            receiver_id: receiverId,
            content: newMessage.trim() || (fileUrl ? "" : ""),
        };

        if (fileUrl) {
            insertPayload.file_url = fileUrl;
            insertPayload.file_type = fileType;
        }

        const { error } = await supabase.from("messages").insert(insertPayload);

        if (!error) {
            setNewMessage("");
            clearAttachment();
        }

        setIsUploading(false);
    };

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------

    // Find the last sent message id for read receipt display
    const lastSentMessageId = (() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].sender_id === userId) return messages[i].id;
        }
        return null;
    })();

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
                            <div className="flex items-center gap-2">
                                <Link href={`/profile/${otherId}?book=1`}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/5"
                                    >
                                        <Calendar className="h-3.5 w-3.5" />
                                        Schedule Meeting
                                    </Button>
                                </Link>
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
                        <div className="flex-1 p-6 overflow-y-auto space-y-1">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                                    <MessageCircle className="h-8 w-8 mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        No messages yet. Say hello!
                                    </p>
                                </div>
                            )}
                            <AnimatePresence initial={false}>
                                {messages.map((m) => {
                                    const isSent = m.sender_id === userId;
                                    const isLastSent = m.id === lastSentMessageId;
                                    const hasAttachment = !!m.file_url;
                                    const hasContent = m.content && m.content.trim().length > 0;

                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className={cn(
                                                "flex flex-col",
                                                isSent ? "items-end" : "items-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                                                    isSent
                                                        ? "bg-secondary text-white rounded-tr-none"
                                                        : "bg-muted text-foreground rounded-tl-none border border-border/40",
                                                    hasAttachment && "space-y-2"
                                                )}
                                            >
                                                {hasAttachment && (
                                                    <MessageAttachment
                                                        fileUrl={m.file_url!}
                                                        fileType={m.file_type ?? null}
                                                        isSent={isSent}
                                                    />
                                                )}
                                                {hasContent && (
                                                    <p className="leading-relaxed whitespace-pre-wrap break-words">
                                                        {linkifyContent(m.content, isSent)}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Read receipt & timestamp for sent messages */}
                                            {isSent && isLastSent && (
                                                <div className="flex items-center gap-1 mt-0.5 mr-1">
                                                    {m.is_read ? (
                                                        <CheckCheck className="h-3 w-3 text-blue-500" />
                                                    ) : (
                                                        <Check className="h-3 w-3 text-muted-foreground/50" />
                                                    )}
                                                    <span className="text-[10px] text-muted-foreground/60">
                                                        {m.is_read ? "Read" : "Sent"}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {/* Typing indicator */}
                            <AnimatePresence>
                                {otherTyping && <TypingIndicator />}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Attachment preview */}
                        <AnimatePresence>
                            {attachmentFile && (
                                <AttachmentPreview
                                    file={attachmentFile}
                                    preview={attachmentPreview}
                                    onRemove={clearAttachment}
                                />
                            )}
                        </AnimatePresence>

                        {/* Message input */}
                        <div className="p-4 bg-muted/10 border-t border-border/50 flex items-center gap-2">
                            {/* Hidden file input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*,.pdf,.doc,.docx,.txt"
                                className="hidden"
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Paperclip className="h-5 w-5" />
                            </Button>
                            <Input
                                placeholder="Type your message..."
                                className="rounded-xl bg-background border-border/50 h-12"
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    broadcastTyping();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                disabled={isUploading}
                            />
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-xl bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/20 shrink-0"
                                onClick={sendMessage}
                                disabled={isUploading || (!newMessage.trim() && !attachmentFile)}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Send className="h-5 w-5" />
                                )}
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
