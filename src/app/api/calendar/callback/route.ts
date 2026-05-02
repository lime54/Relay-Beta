import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

const SETTINGS_PATH = '/settings/calendar';

function appUrl(path: string) {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${base}${path}`;
}

function getRedirectUri() {
    return (
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`
    );
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const { searchParams } = requestUrl;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state') || '';
    const oauthError = searchParams.get('error');

    if (oauthError) {
        console.error(`[calendar/callback] Google returned OAuth error: ${oauthError}`);
        return NextResponse.redirect(
            appUrl(`${SETTINGS_PATH}?error=${encodeURIComponent(oauthError)}`)
        );
    }

    if (!code || !stateParam) {
        return NextResponse.redirect(appUrl(`${SETTINGS_PATH}?error=invalid_request`));
    }

    const [stateUserId, stateNonce] = stateParam.split(':');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.id !== stateUserId) {
        return NextResponse.redirect(appUrl('/login?next=/settings/calendar'));
    }

    // Validate the CSRF nonce from the cookie set in /api/calendar/auth
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieNonce = cookieHeader
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('gcal_oauth_nonce='))
        ?.split('=')[1];

    if (!stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
        return NextResponse.redirect(appUrl(`${SETTINGS_PATH}?error=state_mismatch`));
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('[calendar/callback] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET when exchanging code.');
        return NextResponse.redirect(appUrl(`${SETTINGS_PATH}?error=not_configured`));
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const providerAccountId = userInfo.data.email;

        if (!providerAccountId) {
            throw new Error('Could not fetch email from Google');
        }

        const expiresAt = tokens.expiry_date
            ? new Date(tokens.expiry_date).toISOString()
            : null;

        // NOTE: For production, encrypt access_token / refresh_token using Supabase Vault.
        const { error } = await supabase.from('calendar_connections').upsert(
            {
                user_id: user.id,
                provider: 'google',
                provider_account_id: providerAccountId,
                access_token: tokens.access_token,
                // Only overwrite refresh_token when Google returns one — re-consents may omit it.
                ...(tokens.refresh_token ? { refresh_token: tokens.refresh_token } : {}),
                expires_at: expiresAt,
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,provider,provider_account_id' }
        );

        if (error) {
            console.error('Error saving calendar connection:', error);
            return NextResponse.redirect(appUrl(`${SETTINGS_PATH}?error=database_error`));
        }

        const res = NextResponse.redirect(
            appUrl(`${SETTINGS_PATH}?success=calendar_connected`)
        );
        res.cookies.set('gcal_oauth_nonce', '', { maxAge: 0, path: '/' });
        return res;
    } catch (error) {
        console.error('Error exchanging OAuth code:', error);
        return NextResponse.redirect(appUrl(`${SETTINGS_PATH}?error=oauth_failed`));
    }
}
