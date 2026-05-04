"use client";

import { useEffect } from "react";
import { useNotifications } from "@/contexts/notification-context";

type Target = "requests" | "messages";

// Mounted on /requests and /messages. Tells the notification context that the
// user has now viewed this surface, so the badge should clear (immediately in
// memory, persistently in the DB).
export function ClearNotificationsOnMount({ target }: { target: Target }) {
    const { markRequestsSeen, markMessagesSeen } = useNotifications();

    useEffect(() => {
        if (target === "requests") markRequestsSeen();
        else markMessagesSeen();
    }, [target, markRequestsSeen, markMessagesSeen]);

    return null;
}
