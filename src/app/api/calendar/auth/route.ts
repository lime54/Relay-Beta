import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import crypto from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

function getRedirectUri() {
    return (
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`
    );
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return new NextResponse(
            'Google Calendar is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
            { status: 500 }
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        getRedirectUri()
    );

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
    ];

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
}
