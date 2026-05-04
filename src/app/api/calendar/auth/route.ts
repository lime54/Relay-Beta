import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const origin = new URL(request.url).origin;
    const settingsUrl = (errorCode: string, redirectUri?: string) => {
        const params = new URLSearchParams({ error: errorCode });
        if (redirectUri) params.set('redirect_uri', redirectUri);
        return `${origin}/settings/calendar?${params.toString()}`;
    };

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const explicitRedirect = process.env.GOOGLE_REDIRECT_URI?.trim();

    if (!clientId || !clientSecret) {
        console.error('[calendar/auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. Aborting OAuth redirect.');
        return NextResponse.redirect(settingsUrl('not_configured'));
    }

    if (!explicitRedirect && !appUrl) {
        console.error('[calendar/auth] Missing NEXT_PUBLIC_APP_URL. Aborting OAuth redirect.');
        return NextResponse.redirect(settingsUrl('missing_app_url'));
    }

    const redirectUri = explicitRedirect || `${appUrl!.replace(/\/$/, '')}/api/calendar/callback`;
    console.log(`[calendar/auth] Initiating Google OAuth with redirect_uri="${redirectUri}". Make sure this exact URL is registered in your Google Cloud OAuth client's Authorized redirect URIs.`);

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

    try {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        // CSRF nonce stored in a short-lived httpOnly cookie + echoed as state
        const nonce = crypto.randomBytes(16).toString('hex');
        const state = `${user.id}:${nonce}`;

        const url = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent', // force a refresh_token every time
            scope: scopes,
            state,
            include_granted_scopes: true,
        });

        const res = NextResponse.redirect(url);
        res.cookies.set('gcal_oauth_nonce', nonce, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });
        return res;
    } catch (err) {
        console.error('[calendar/auth] Failed to construct Google OAuth URL', err);
        return NextResponse.redirect(settingsUrl('invalid_request', redirectUri));
    }
}
