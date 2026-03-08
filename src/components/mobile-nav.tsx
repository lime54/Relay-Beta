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

export function MobileNav({ isLoggedIn }: { isLoggedIn: boolean }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-muted rounded-md transition-colors">
                    <Menu size={24} />
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
                            <Link href="/requests" className="text-lg font-medium hover:text-secondary transition-colors py-2">
                                My Requests
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
