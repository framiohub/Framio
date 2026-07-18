import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const type  = searchParams.get('type');
  const next  = searchParams.get('next') ?? '/account';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    const url = new URL('/auth/login', origin);
    url.searchParams.set('error', errorDescription || error);
    return NextResponse.redirect(url);
  }

  if (code) {
    const destination = type === 'recovery'
      ? new URL('/auth/reset-password', origin)
      : new URL(next, origin);

    const response = NextResponse.redirect(destination);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Detect if this is a brand-new sign-up (including re-registrations
        // after an admin deleted the account — Supabase issues a new UUID).
        const createdAt      = new Date(user.created_at).getTime();
        const lastSignInAt   = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : createdAt;
        const isNewCustomer  = Math.abs(lastSignInAt - createdAt) < 5000; // within 5 s → fresh account

        // Always sync the latest Google profile data on every OAuth sign-in.
        await admin.from('profiles').upsert(
          {
            id:              user.id,
            email:           user.email ?? null,
            full_name:       user.user_metadata?.full_name
                          ?? user.user_metadata?.name
                          ?? null,
            avatar_url:      user.user_metadata?.avatar_url ?? null,
            provider:        user.app_metadata?.provider ?? 'email',
            last_sign_in_at: new Date().toISOString(),
            is_active:       true,
          },
          { onConflict: 'id' }
        );

        // Check if the user already has a phone number on file
        const { data: profile } = await admin
          .from('profiles')
          .select('phone')
          .eq('id', user.id)
          .single();

        const hasPhone = !!(profile?.phone);

        // Don't gate password-recovery flows on phone collection
        if (!hasPhone && type !== 'recovery') {
          const phoneUrl = new URL('/auth/phone', origin);
          phoneUrl.searchParams.set('next', next);
          if (isNewCustomer) phoneUrl.searchParams.set('new', '1');
          const phoneRedirect = NextResponse.redirect(phoneUrl);
          response.cookies.getAll().forEach(c => phoneRedirect.cookies.set(c.name, c.value));
          return phoneRedirect;
        }

        // User already has phone — nothing more to do for returning users.
        // Welcome email would have been sent when they first verified their phone.
      }

      return response;
    }
  }

  const fallback = new URL('/auth/login', origin);
  fallback.searchParams.set('error', 'Authentication failed. Please try again.');
  return NextResponse.redirect(fallback);
}
