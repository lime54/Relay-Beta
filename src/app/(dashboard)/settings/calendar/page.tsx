import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Record<string, string> = {
    invalid_request: "Google rejected the OAuth request. The redirect URI registered in Google Cloud Console likely doesn't match what this app is sending. See the README's \"Setting up Google Calendar OAuth\" section.",
    redirect_uri_mismatch: "The redirect URI registered in Google Cloud Console doesn't match what this app is sending. See the README's \"Setting up Google Calendar OAuth\" section.",
    state_mismatch: "The sign-in session expired or didn't match. Please try again.",
    not_configured: "Google Calendar isn't set up yet. The site owner needs to configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET. See the README's \"Setting up Google Calendar OAuth\" section.",
    missing_app_url: "Google Calendar isn't fully configured. The NEXT_PUBLIC_APP_URL environment variable is missing. See the README's \"Setting up Google Calendar OAuth\" section.",
    database_error: "We couldn't save your connection. Please try again.",
    oauth_failed: "Google rejected the sign-in request. Please try again.",
    access_denied: "You declined access to Google Calendar.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
    calendar_connected: "Google Calendar connected.",
    rules_reset: "Default availability rules saved.",
    disconnected: "Google Calendar disconnected.",
};

export default async function CalendarSettingsPage({
    searchParams,
}: {
    searchParams?: Promise<{ success?: string; error?: string; redirect_uri?: string; db_message?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const params = (await searchParams) ?? {};
    const successMsg = params.success ? SUCCESS_MESSAGES[params.success] : null;
    const errorMsg = params.error ? (ERROR_MESSAGES[params.error] ?? "Something went wrong.") : null;
    const showRedirectUri = !!params.redirect_uri && (params.error === 'invalid_request' || params.error === 'redirect_uri_mismatch');

    const { data: connections } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

    const isGoogleConnected = connections?.some(c => c.provider === 'google');
    const googleAccount = connections?.find(c => c.provider === 'google')?.provider_account_id;

    const { data: rules } = await supabase
        .from('availability_rules')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

    const hasAvailabilityRules = !!rules;

    return (
        <div className="container mx-auto max-w-4xl px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar & Scheduling</h1>
                <p className="text-muted-foreground mt-2">Manage your availability and calendar integrations.</p>
            </div>

            {successMsg && (
                <div role="status" className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    {successMsg}
                </div>
            )}
            {errorMsg && (
                <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <div>
                        <p>{errorMsg}</p>
                        {params.db_message && <span className="block mt-1 text-xs opacity-80 font-mono">{params.db_message}</span>}
                        {showRedirectUri && (
                            <>
                                <p className="mt-2">Add this <strong>exact URL</strong> to your Google Cloud OAuth client&apos;s <em>Authorized redirect URIs</em>:</p>
                                <pre className="mt-2 px-3 py-2 bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-200 rounded font-mono text-xs whitespace-pre-wrap break-all">{params.redirect_uri}</pre>
                            </>
                        )}
                    </div>
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
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
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
                                    redirect('/settings/calendar?success=disconnected');
                                }}>
                                    <Button variant="outline" type="submit" className="text-red-500 hover:text-red-600 hover:bg-red-50">Disconnect</Button>
                                </form>
                            ) : (
                                <a href="/api/calendar/auth">
                                    <Button>Connect Google</Button>
                                </a>
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
                        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-6 text-center">
                            <CheckCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                            <h3 className="font-semibold text-blue-900 mb-1">
                                {hasAvailabilityRules ? "Default rules active" : "Set default availability"}
                            </h3>
                            <p className="text-sm text-blue-800">
                                {hasAvailabilityRules
                                    ? "You are currently available Monday through Friday from 9:00 AM to 5:00 PM. We automatically hide times when you have events on your connected calendar."
                                    : "Initialize default rules to make yourself bookable from 9:00 AM to 5:00 PM, Monday through Friday."}
                            </p>
                            <form action={async () => {
                                'use server';
                                const { createClient } = await import("@/lib/supabase/server");
                                const sb = await createClient();
                                const { data: { user } } = await sb.auth.getUser();
                                if (user) {
                                    await sb.from('availability_rules').upsert(
                                        {
                                            user_id: user.id,
                                            meeting_duration_mins: 30,
                                            buffer_before_mins: 0,
                                            buffer_after_mins: 0,
                                            schedule: {
                                                monday: [{ start: "09:00", end: "17:00" }],
                                                tuesday: [{ start: "09:00", end: "17:00" }],
                                                wednesday: [{ start: "09:00", end: "17:00" }],
                                                thursday: [{ start: "09:00", end: "17:00" }],
                                                friday: [{ start: "09:00", end: "17:00" }],
                                            },
                                            updated_at: new Date().toISOString(),
                                        },
                                        { onConflict: 'user_id' }
                                    );
                                }
                                const { redirect } = await import("next/navigation");
                                redirect('/settings/calendar?success=rules_reset');
                            }}>
                                <Button variant="outline" size="sm" type="submit" className="mt-4 bg-white">
                                    {hasAvailabilityRules ? "Reset to defaults" : "Initialize default rules"}
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
