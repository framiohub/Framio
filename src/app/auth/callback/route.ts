import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/account';
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
      // Upsert customer profile so every OAuth user is auto-registered
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const admin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await admin.from('profiles').upsert({
          id:               user.id,
          email:            user.email ?? null,
          full_name:        user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
          avatar_url:       user.user_metadata?.avatar_url ?? null,
          provider:         user.app_metadata?.provider ?? 'email',
          last_sign_in_at:  new Date().toISOString(),
          is_active:        true,
        }, { onConflict: 'id' });
      }
      return response;
    }
  }

  const fallback = new URL('/auth/login', origin);
  fallback.searchParams.set('error', 'Authentication failed. Please try again.');
  return NextResponse.redirect(fallback);
}
