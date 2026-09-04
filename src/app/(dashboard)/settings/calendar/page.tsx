import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { BookingLinkForm } from "./booking-link-form";

export const dynamic = 'force-dynamic';

export default async function CalendarSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('athlete_profiles')
        .select('scheduling_url')
        .eq('user_id', user.id)
        .maybeSingle();

    return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Scheduling</h1>
                <p className="text-muted-foreground mt-2">
                    Let people book time with you without the back-and-forth.
                </p>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        Your booking link
                    </CardTitle>
                    <CardDescription>
                        Add a scheduling link so others can grab a time that works for both of you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BookingLinkForm initialUrl={profile?.scheduling_url ?? ""} />
                </CardContent>
            </Card>

            <div className="mt-6 rounded-xl border border-border/50 bg-muted/20 p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1.5">Don&apos;t have a scheduling link yet?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Create a free one in a couple of minutes with{" "}
                    <a href="https://calendly.com/signup" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">Calendly</a>{" "}
                    or{" "}
                    <a href="https://cal.com/signup" target="_blank" rel="noopener noreferrer" className="text-secondary font-medium hover:underline">Cal.com</a>, then paste it above.
                </p>
            </div>
        </div>
    );
}
