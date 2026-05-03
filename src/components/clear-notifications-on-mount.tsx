"use client";

import { useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";

type Target = "requests" | "messages";

export function ClearNotificationsOnMount({ target }: { target: Target }) {
    const { markRequestsSeen, markMessagesSeen } = useNotifications();

    useEffect(() => {
        if (target === "requests") markRequestsSeen();
        if (target === "messages") markMessagesSeen();
    }, [target, markRequestsSeen, markMessagesSeen]);

    return null;
}
