import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from 'lucide-react'
import AnimatedHero from "@/components/ui/glassmorphism-trust-hero"
import { GlowingFeatures } from "@/components/ui/glowing-features"
import Navbar from "@/components/navbar"

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Full-bleed Hero Section */}
        <section className="relative w-full min-h-screen">
          <AnimatedHero />
        </section>

        {/* Social Proof / Stats */}
        <section className="py-12 bg-muted/50 border-y border-border">
          <div className="container px-4 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-primary mb-1">5,000+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Verified Athletes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">200+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Universities</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">10,000+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Connections Made</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-1">98%</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / Glowing Grid Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">Transitioning is hard. We make it easier.</h2>
              <p className="text-xl text-muted-foreground font-sans">
                Only 2% of student-athletes go pro. For the other 98%, Relay provides the network and resources needed to launch a successful career.
              </p>
            </div>

            <GlowingFeatures />
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
            </svg>
          </div>
          <div className="container px-4 mx-auto relative z-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to play at the next level?</h2>
            <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">
              Join the most exclusive network of verified student-athletes and alumni today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full group" asChild>
                <Link href="/signup">
                  Launch Your Career <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full bg-transparent border-white hover:bg-white/10" asChild>
                <Link href="/auth">Member Login</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-background border-t border-border">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <img src="/relay-logo.png" alt="Relay" className="h-8 w-auto" />
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-primary transition-colors">Contact Us</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Relay verified athlete Network. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
