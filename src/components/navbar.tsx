import Link from "next/link"
import Image from "next/image"

import { createClient } from "../lib/supabase/server"
import { Button } from "@/components/ui/button"
import { User } from 'lucide-react'
import { MobileNav } from "@/components/mobile-nav"

export default async function Navbar({ transparent = false }: { transparent?: boolean } = {}) {
    let user = null;
    try {
        const supabase = await createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()
        user = authUser;
    } catch (e) {
        console.error("Navbar Supabase Error:", e);
    }

    return (
        <nav className={transparent
            ? "absolute w-full z-50 bg-transparent border-none top-0"
            : "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href={user ? "/dashboard" : "/"} className="font-bold text-xl text-primary flex items-center gap-2 transition-base hover:opacity-80">
                    <Image
                        src="/relay-logo.png"
                        alt="Relay"
                        width={140}
                        height={40}
                        className="h-10 w-auto"
                        priority
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    {user ? (
                        <>
                            <Link href="/requests">
                                <Button variant="ghost">My Requests</Button>
                            </Link>
                            <Link href="/profile">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <User size={16} />
                                    Profile
                                </Button>
                            </Link>
                            <form action="/auth/signout" method="post">
                                <Button variant="outline" size="sm" type="submit">Sign Out</Button>
                            </form>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button className="bg-[#009ef7] hover:bg-[#0089d6] text-white rounded-md px-6 font-medium">Join the Team</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu */}
                <MobileNav isLoggedIn={!!user} />
            </div>
        </nav>
    )
}
