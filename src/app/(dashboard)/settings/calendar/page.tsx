import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "The Google Calendar authorization request was missing required information. Please try connecting again.",
    oauth_failed: "We couldn't complete the connection with Google. Please try again.",
    database_error: "We connected to Google but failed to save your calendar connection. Please try again.",
};

export default async function CalendarSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ success?: string; error?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const sp = await searchParams;
    const successParam = sp.success;
    const errorParam = sp.error;

    // Fetch connections
    const { data: connections } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

    const isGoogleConnected = connections?.some(c => c.provider === 'google');
    const googleAccount = connections?.find(c => c.provider === 'google')?.provider_account_id;

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar & Scheduling</h1>
                <p className="text-muted-foreground mt-2">Manage your availability and calendar integrations.</p>
            </div>

            {successParam === 'calendar_connected' && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                    <div>
                        <p className="font-semibold">Google Calendar connected successfully.</p>
                        <p className="text-sm text-green-800">You can now receive bookings.</p>
                    </div>
                </div>
            )}

            {successParam === 'rules_reset' && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                    <p className="text-sm">Default availability rules have been initialized.</p>
                </div>
            )}

            {errorParam && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600 mt-0.5" />
                    <p className="text-sm">{ERROR_MESSAGES[errorParam] ?? "Something went wrong connecting your calendar. Please try again."}</p>
                </div>
            )}

            <div className="grid gap-8">
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Calendar Integrations
                        </CardTitle>
                        <CardDescription>
                            Connect your calendar to automatically prevent double-booking and generate meeting links.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-muted/20">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground">Google Calendar</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {isGoogleConnected ? `Connected as ${googleAccount}` : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            {isGoogleConnected ? (
                                <form action={async () => {
                                    'use server';
                                    const { createClient } = await import("@/lib/supabase/server");
                                    const sb = await createClient();
                                    const { data: { user } } = await sb.auth.getUser();
                                    if (user) {
                                        await sb.from('calendar_connections').delete().eq('user_id', user.id).eq('provider', 'google');
                                    }
                                    const { redirect } = await import("next/navigation");
                                    redirect('/settings/calendar');
                                }}>
                                    <Button variant="outline" type="submit" className="text-red-500 hover:text-red-600 hover:bg-red-50">Disconnect</Button>
                                </form>
                            ) : (
                                <Link href="/api/calendar/auth">
                                    <Button>Connect Google</Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Default Availability
                        </CardTitle>
                        <CardDescription>
                            Set the hours you are generally available for meetings. This applies to your local time zone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* We could build a complex UI for availability rules here, but for now we'll just show a placeholder */}
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center">
                            <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-blue-900 mb-1">Default Rules Active</h3>
                            <p className="text-sm text-blue-800">
                                You are currently available Monday through Friday from 9:00 AM to 5:00 PM. 
                                We automatically hide times when you have events on your connected calendar.
                            </p>
                            <form action={async () => {
                                'use server';
                                const { createClient } = await import("@/lib/supabase/server");
                                const sb = await createClient();
                                const { data: { user } } = await sb.auth.getUser();
                                if (user) {
                                    // Upsert default rules
                                    await sb.from('availability_rules').upsert({
                                        user_id: user.id,
                                        meeting_duration_mins: 30,
                                        buffer_before_mins: 0,
                                        buffer_after_mins: 0,
                                        schedule: {
                                            monday: [{ start: "09:00", end: "17:00" }],
                                            tuesday: [{ start: "09:00", end: "17:00" }],
                                            wednesday: [{ start: "09:00", end: "17:00" }],
                                            thursday: [{ start: "09:00", end: "17:00" }],
                                            friday: [{ start: "09:00", end: "17:00" }]
                                        }
                                    });
                                }
                                const { redirect } = await import("next/navigation");
                                redirect('/settings/calendar?success=rules_reset');
                            }}>
                                <Button variant="outline" size="sm" type="submit" className="mt-4 bg-white">Initialize Default Rules</Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
