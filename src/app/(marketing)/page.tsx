import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, CheckCircle, Users, TrendingUp } from "lucide-react"
import HeroSection from "@/components/ui/glassmorphism-trust-hero"
import { GlowingEffect } from "@/components/ui/glowing-effect"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section>
        <HeroSection />
      </section>

      {/* Value Props Section */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-heading-1 text-primary mb-4">
              Built Different
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Relay is not another LinkedIn. It&apos;s a private room where athletes help athletes with structured, respectful interactions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Shared Athlete Experience */}
            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 hover-lift">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative h-full flex flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 bg-card">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-5">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-heading-3 text-primary mb-3">Shared Athlete Experience</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Athletes develop discipline, resilience, and the ability to handle setbacks.
                    These shared traits drive professional success and create a powerful, instant bond.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 hover-lift">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative h-full flex flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 bg-card">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-5">
                  <Shield className="h-6 w-6 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-heading-3 text-primary mb-3">Verified Community</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every member is a verified NCAA student-athlete or alumni (D1, D2, D3).
                    No strangers, no spam. Only a shared athletic background.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 hover-lift">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative h-full flex flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 bg-card">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-5">
                  <CheckCircle className="h-6 w-6 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-heading-3 text-primary mb-3">Structured Requests</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    No &quot;picking your brain.&quot; Every ask is specific, respectful,
                    and actionable—saving time for everyone.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3 hover-lift">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative h-full flex flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6 bg-card">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-5">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-heading-3 text-primary mb-3">Real Outcomes</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Track your impact. From coffee chats to referrals,
                    see how you&apos;re helping the next generation win.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-heading-1 text-primary mb-4">
              How Relay Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Simple, structured, respectful. The way career networking should be.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Verify", desc: "Confirm your athletic background" },
              { step: "2", title: "Connect", desc: "Find alumni in your target field" },
              { step: "3", title: "Request", desc: "Send a structured, specific ask" },
              { step: "4", title: "Succeed", desc: "Get advice, intros, or referrals" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-primary mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium uppercase tracking-wider">
              For Athletes, By Athletes
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 max-w-2xl mx-auto">
            Ready to join a network that actually works?
          </h2>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-10 text-lg h-12">
              Join the Beta <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Image
              src="/relay-logo.png"
              alt="Relay"
              width={100}
              height={30}
              className="h-8 w-auto"
            />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Relay. All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

