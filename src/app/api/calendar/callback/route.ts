import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const stateUserId = searchParams.get('state'); // The user ID we passed in the auth route

    if (!code || !stateUserId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=invalid_request`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify the user who started the OAuth flow is the one finishing it
    if (!user || user.id !== stateUserId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get the user's email from Google to use as provider_account_id
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const providerAccountId = userInfo.data.email;

        if (!providerAccountId) {
            throw new Error("Could not fetch email from Google");
        }

        // Calculate expiration date
        const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null;

        // Note: In a production app, the refresh_token and access_token SHOULD be encrypted here using Supabase Vault or KMS.
        // For this scaffold, we store them directly.

        // Upsert the connection
        const { error } = await supabase.from('calendar_connections').upsert({
            user_id: user.id,
            provider: 'google',
            provider_account_id: providerAccountId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null, // Might be null if prompt='none' and previously granted
            expires_at: expiresAt,
            is_active: true,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id, provider_account_id'
        });

        if (error) {
            console.error("Error saving calendar connection:", error);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=database_error`);
        }

        // Redirect back to the app with a success parameter
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?success=calendar_connected`);
    } catch (error) {
        console.error('Error exchanging OAuth code:', error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/settings/integrations?error=oauth_failed`);
    }
}
