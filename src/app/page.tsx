import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Users, Trophy, ArrowRight, Star, Quote } from 'lucide-react'
import { Hero as AnimatedHero } from "@/components/ui/animated-hero"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import Navbar from "@/components/navbar"

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="container px-4 mx-auto relative z-10">
            <AnimatedHero />
          </div>
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

        {/* Problem/Solution Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Transitioning is hard. We make it easier.</h2>
              <p className="text-xl text-muted-foreground">
                Only 2% of student-athletes go pro. For the other 98%, Relay provides the network and resources needed to launch a successful career.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Verified Profiles</h3>
                <p className="text-muted-foreground">
                  Every user is verified via their university email or specialized athletic credentials.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Users className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Targeted Networking</h3>
                <p className="text-muted-foreground">
                  Connect specifically with alumni who played your sport or share your professional interests.
                </p>
              </div>
              <div className="p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                  <Trophy className="text-primary w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">Exclusive Resources</h3>
                <p className="text-muted-foreground">
                  Access career guides, interview prep, and job postings curated specifically for the athlete mindset.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features / Glowing Effect */}
        <section className="py-24 bg-muted/30 overflow-hidden">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 italic tracking-tight">THE ATHLETE ADVANTAGE</h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Relay is built on the belief that the discipline, teamwork, and resilience learned on the field are invaluable assets in the boardroom. We help you translate those skills for employers.
                </p>
                <div className="space-y-4">
                  {[
                    "Direct access to hiring managers who value athletic backgrounds",
                    "Mentorship programs with successful former student-athletes",
                    "Resume templates designed to highlight transferrable skills",
                    "Weekly networking events and career fairs"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1 bg-primary/20 rounded-full p-1">
                        <CheckCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2 relative h-[500px] w-full max-w-[500px] mx-auto">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />
                <div className="absolute inset-4 rounded-3xl bg-black overflow-hidden border border-white/10 flex items-center justify-center">
                  <img
                    src="/hero-sports.png"
                    alt="Athlete Success"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-primary text-primary" />)}
                      </div>
                      <p className="text-sm text-white/90 italic mb-2">
                        "Relay was the difference between sending 100 cold resumes and having 3 interviews in my first week. The athlete network is incredibly powerful."
                      </p>
                      <div className="text-xs font-bold text-white">JORDAN WELLS, FORMER D1 TRACK & FIELD</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
              <img src="/relay-logo.png" alt="Relay" className="h-8 w-auto invert" />
              <span className="text-xl font-bold">RELAY</span>
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
