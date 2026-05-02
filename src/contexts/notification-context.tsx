"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface NotificationContextType {
    unreadMessages: number;
    pendingRequests: number;
    setUnreadMessages: React.Dispatch<React.SetStateAction<number>>;
    setPendingRequests: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadMessages: 0,
    pendingRequests: 0,
    setUnreadMessages: () => {},
    setPendingRequests: () => {},
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

            const { count: reqCount } = await supabase
                .from('requests')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('status', 'pending');

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
                    if (user && payload.new.recipient_id === user.id && payload.new.status === 'pending') {
                        setPendingRequests(prev => prev + 1);
                    }
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests' }, (payload) => {
                supabase.auth.getUser().then(({ data: { user } }) => {
                    if (user && payload.new.recipient_id === user.id) {
                        if (payload.old.status === 'pending' && payload.new.status !== 'pending') {
                            setPendingRequests(prev => Math.max(0, prev - 1));
                        }
                    }
                });
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(channel);
        };
    }, [supabase]);

    return (
        <NotificationContext.Provider value={{
            unreadMessages,
            pendingRequests,
            setUnreadMessages,
            setPendingRequests
        }}>
            {children}
        </NotificationContext.Provider>
    );
}
