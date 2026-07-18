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
        // Uses upsert so it works for both new registrations and returning users.
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

        // TODO: send welcome email for new customers once an email provider
        // (Resend / SendGrid) is configured.
        // if (isNewCustomer) { await sendWelcomeEmail(user.email); }
        void isNewCustomer; // suppress unused-var lint until email is wired up
      }

      return response;
    }
  }

  const fallback = new URL('/auth/login', origin);
  fallback.searchParams.set('error', 'Authentication failed. Please try again.');
  return NextResponse.redirect(fallback);
}
