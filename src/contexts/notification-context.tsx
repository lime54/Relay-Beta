"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationContextType {
    unreadMessages: number;
    pendingRequests: number;
    setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
    setPendingRequests: React.Dispatch<React.SetStateAction<number>>;
    markRequestsSeen: () => Promise<void>;
    markMessagesSeen: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadMessages: 0,
    pendingRequests: 0,
    setUnreadMessages: () => {},
    setPendingRequests: () => {},
    markRequestsSeen: async () => {},
    markMessagesSeen: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [pendingRequests, setPendingRequests] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        let isMounted = true;
        const fetchInitialCounts = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { count: msgCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('receiver_id', user.id)
                .eq('is_read', false);

            // Try the seen_at-aware count first; fall back if the column hasn't
            // been migrated yet so the badge keeps working in either state.
            let reqCount: number | null = null;
            const seenAware = await supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('status', 'pending')
                .is('seen_at', null);
            if (seenAware.error) {
                const fallback = await supabase
                    .from('requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('recipient_id', user.id)
                    .eq('status', 'pending');
                reqCount = fallback.count ?? null;
            } else {
                reqCount = seenAware.count ?? null;
            }

            if (isMounted) {
                if (msgCount !== null) setUnreadMessages(msgCount);
                if (reqCount !== null) setPendingRequests(reqCount);
            }
        };

        fetchInitialCounts();

        const channel = supabase.channel('global-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new.receiver_id === user.id && !payload.new.is_read) {
                        setUnreadMessages(prev => prev + 1);
                    }
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new.receiver_id === user.id && payload.new.is_read && !payload.old.is_read) {
                        setUnreadMessages(prev => Math.max(0, prev - 1));
                    }
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new.recipient_id === user.id && payload.new.status === 'pending' && !payload.new.seen_at) {
                        setPendingRequests(prev => prev + 1);
                    }
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (payload) => {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (!user || payload.new.recipient_id !== user.id) return;
                    const wasUnseenPending = payload.old.status === 'pending' && !payload.old.seen_at;
                    const isUnseenPending = payload.new.status === 'pending' && !payload.new.seen_at;
                    if (wasUnseenPending && !isUnseenPending) {
                        setPendingRequests(prev => Math.max(0, prev - 1));
                    } else if (!wasUnseenPending && isUnseenPending) {
                        setPendingRequests(prev => prev + 1);
                    }
                });
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    const markRequestsSeen = useCallback(async () => {
        // Clear in-memory immediately so the badge disappears without waiting
        // for the network round-trip.
        setPendingRequests(0);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { error } = await supabase
            .from('requests')
            .update({ seen_at: new Date().toISOString() })
            .eq('recipient_id', user.id)
            .eq('status', 'pending')
            .is('seen_at', null);
        if (error) {
            // If seen_at column doesn't exist yet, silently no-op the persistence.
            // Local state is already cleared so the user still sees the badge clear.
            console.warn('[notifications] markRequestsSeen:', error.message);
        }
    }, [supabase]);

    const markMessagesSeen = useCallback(async () => {
        setUnreadMessages(0);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);
    }, [supabase]);

    return (
        <NotificationContext.Provider value={{
            unreadMessages,
            pendingRequests,
            setUnreadMessages,
            setPendingRequests,
            markRequestsSeen,
            markMessagesSeen,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
