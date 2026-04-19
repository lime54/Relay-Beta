import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh the session if it's expired - extremely important for SSR
  const { data: { user } } = await supabase.auth.getUser();

  const url = new URL(request.url);
  const path = url.pathname;

  // Define public vs protected routes
  const isAuthPage = path.startsWith('/login') || path.startsWith('/signup');
  const isPublicPage = path === '/' || path.startsWith('/auth'); // Add more as needed
  
  // Protected routes: dashboard, onboarding, network, etc.
  // Note: config in middleware.ts handles most of the exclusion, 
  // but we specify protected areas here for clarity.
  const isProtectedRoute = 
    path.startsWith('/dashboard') || 
    path.startsWith('/onboarding') || 
    path.startsWith('/network') || 
    path.startsWith('/messages') || 
    path.startsWith('/requests') ||
    path.startsWith('/profile');

  // Logic:
  // 1. If not logged in and trying to access protected route -> redirect to login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL('/login', request.url);
    // Logic to keep the intended destination path:
    redirectUrl.searchParams.set('next', path);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. If logged in and trying to access login/signup -> redirect to dashboard
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. If logged in and NOT on /onboarding, check if the user is onboarded
  if (user && !path.startsWith('/onboarding') && !isAuthPage && !isPublicPage) {
    const { data: userData } = await supabase
      .from('users')
      .select('onboarded')
      .eq('id', user.id)
      .single();

    if (userData && !userData.onboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  return response;
};
