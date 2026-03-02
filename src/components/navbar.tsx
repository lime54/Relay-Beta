import Link from "next/link"
import Image from "next/image"

import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { User, Menu } from 'lucide-react'

export default async function Navbar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
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
                                <Button variant="ghost">Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button variant="secondary">Join the Team</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden p-2 hover:bg-muted rounded-md transition-base">
                    <Menu size={24} />
                </button>
            </div>
        </nav>
    )
}

