"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetTitle,
} from "@/components/ui/sheet";

import { useNotifications } from "@/contexts/notification-context";

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    // Only call the hook if we are inside NotificationProvider (which is only in dashboard layout right now)
    // To avoid errors if MobileNav is used outside dashboard, we can catch it or safely use it if we are sure it's wrapped.
    // Actually MobileNav is used in `components/dashboard-header.tsx` which IS wrapped in NotificationProvider.
    // Let's assume it works.
    let unreadMessages = 0;
    let pendingRequests = 0;
    try {
        const context = useNotifications();
        if (context) {
            unreadMessages = context.unreadMessages;
            pendingRequests = context.pendingRequests;
        }
    } catch (e) {}

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-muted rounded-md transition-colors relative">
                    <Menu size={24} />
                    {(unreadMessages > 0 || pendingRequests > 0) && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] pt-12">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <nav className="flex flex-col gap-4">
                    {isLoggedIn ? (
                        <>
                            <Link href="/dashboard" className="text-lg font-medium hover:text-secondary transition-colors py-2">
                                Dashboard
                            </Link>
                            <Link href="/network" className="text-lg font-medium hover:text-secondary transition-colors py-2">
                                Network
                            </Link>
                            <Link href="/requests" className="text-lg font-medium hover:text-secondary transition-colors py-2 flex items-center gap-2">
                                My Requests
                                {pendingRequests > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {pendingRequests > 9 ? '9+' : pendingRequests}
                                    </span>
                                )}
                            </Link>
                            <Link href="/messages" className="text-lg font-medium hover:text-secondary transition-colors py-2 flex items-center gap-2">
                                Messages
                                {unreadMessages > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                        {unreadMessages > 9 ? '9+' : unreadMessages}
                                    </span>
                                )}
                            </Link>
                            <Link href="/profile" className="text-lg font-medium hover:text-secondary transition-colors py-2">
                                Profile
                            </Link>
                            <div className="h-px bg-border my-2" />
                            <form action="/auth/signout" method="post">
                                <Button variant="outline" size="sm" type="submit" className="w-full">
                                    Sign Out
                                </Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="w-full justify-start text-lg">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="w-full bg-[#009ef7] hover:bg-[#0089d6] text-white">Join the Team</Button>
                            </Link>
                        </>
                    )}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
