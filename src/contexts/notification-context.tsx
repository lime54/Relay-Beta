"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { markMessagesSeenAction, markRequestsSeenAction } from "@/lib/notifications/mark-seen-actions";

// ---------------------------------------------------------------------------
// Notification badge data flow
// ---------------------------------------------------------------------------
// State of the world:
// - `unreadMessages` = count of `messages` rows where receiver_id = me AND
//   is_read = false.
// - `pendingRequests` = count of `requests` rows where recipient_id = me AND
//   status = 'pending' AND seen_at IS NULL.
//   (If the `seen_at` column hasn't been migrated yet we fall back to ignoring
//   it, so the badge keeps working — it just won't persist clears across
//   page loads until the migration runs.)
//
// Read path:
//   On mount we fetch both counts once (`fetchCounts`). Realtime is wired up
//   only as a *trigger* to refetch — every INSERT/UPDATE on either table
//   re-runs `fetchCounts`. We deliberately don't increment/decrement off the
//   payload because those events fire while a clear is in flight and create
//   off-by-one races. A refetch is one extra RTT but is correct.
//
// Clear path:
//   When the user mounts /requests or /messages, <ClearNotificationsOnMount />
//   calls `markRequestsSeen` / `markMessagesSeen`. Those:
//     1. Immediately zero the local count so every badge surface (sidebar,
//        mobile nav) re-renders to 0 within a paint.
//     2. Call a server action that runs the DB UPDATE under the user's auth
//        context. If the column or RLS policy is missing it returns an error
//        — we console.warn and keep the in-memory clear.
//     3. The realtime UPDATE fired by the server action triggers a refetch,
//        which returns 0 (because the rows are now seen/read). Confirms the
//        cleared state. Other tabs in the same browser get the same refetch
//        signal and update too.
// ---------------------------------------------------------------------------

interface NotificationContextType {
    unreadMessages: number;
    pendingRequests: number;
    setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
    setPendingRequests: React.Dispatch<React.SetStateAction<number>>;
    markRequestsSeen: () => Promise<void>;
    markMessagesSeen: (requestId?: string) => Promise<void>;
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
    // Memoize the client so its identity is stable across renders. Without this,
    // every render produced a fresh client → fresh `fetchCounts` → the effect
    // below tore down and rebuilt the realtime subscription on every navigation,
    // and the resulting refetch raced markRequestsSeen / markMessagesSeen and
    // brought the badge back even though seen_at had been written.
    const supabase = useMemo(() => createClient(), []);

    // Tracks whether we should suppress realtime-triggered refetches for a
    // brief window after a clear. Without this, a clear that produces N row
    // UPDATEs causes N refetches in quick succession — harmless but wasteful.
    const suppressRefetchUntil = useRef(0);

    const fetchCounts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count: msgCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        // Unread = recipient_id = me AND status = 'pending' AND seen_at IS NULL.
        // Mark-seen MUST keep this filter in sync (see mark-seen-actions.ts).
        // We only fall back to the status-only count when the seen_at column
        // is genuinely missing (Postgres 42703). On any other error we leave
        // the count alone so transient failures don't make the badge sticky.
        let reqCount: number | null = null;
        const seenAware = await supabase
            .from('requests')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('status', 'pending')
            .is('seen_at', null);
        if (seenAware.error) {
            const msg = (seenAware.error.message || '').toLowerCase();
            const code = seenAware.error.code;
            const columnMissing = code === '42703' || msg.includes('seen_at') || msg.includes('column');
            if (columnMissing) {
                console.warn('[notifications] seen_at column missing — falling back to status-only count. Apply supabase_notifications_seen_migration.sql to fix.');
                const fallback = await supabase
                    .from('requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('recipient_id', user.id)
                    .eq('status', 'pending');
                reqCount = fallback.count ?? null;
            } else {
                console.warn('[notifications] pending-requests count failed:', seenAware.error);
            }
        } else {
            reqCount = seenAware.count ?? null;
        }

        if (msgCount !== null) setUnreadMessages(msgCount);
        if (reqCount !== null) setPendingRequests(reqCount);
    }, [supabase]);

    useEffect(() => {
        let isMounted = true;
        const safeFetch = () => {
            if (!isMounted) return;
            if (Date.now() < suppressRefetchUntil.current) return;
            fetchCounts();
        };

        safeFetch();

        const channel = supabase.channel('global-notifications')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, safeFetch)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, safeFetch)
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchCounts]);

    const markRequestsSeen = useCallback(async () => {
        // Optimistically zero — every badge surface (sidebar, mobile nav)
        // reads from this state and re-renders immediately.
        setPendingRequests(0);
        // Suppress the refetch storm from the realtime UPDATEs we're about to
        // generate. A short window is enough; a final refetch will catch up.
        suppressRefetchUntil.current = Date.now() + 1500;

        const result = await markRequestsSeenAction();
        if (!result.ok) {
            // Persistence failed (column missing, RLS missing, etc.). The
            // session badge is still cleared, but on next page load it will
            // come back. Log so the cause is visible in the browser console.
            console.warn('[notifications] markRequestsSeen failed:', result.error);
        }
    }, []);

    const markMessagesSeen = useCallback(async (requestId?: string) => {
        // For a thread-scoped clear we still optimistically zero the count —
        // the realtime refetch fires after the suppression window and will
        // re-populate any unread that lives in *other* threads.
        setUnreadMessages(0);
        suppressRefetchUntil.current = Date.now() + 1500;
        const result = await markMessagesSeenAction(requestId);
        if (!result.ok) {
            console.warn('[notifications] markMessagesSeen failed:', result.error);
        }
    }, []);

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
