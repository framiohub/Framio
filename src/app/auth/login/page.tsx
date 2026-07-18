'use client';

export const dynamic = 'force-dynamic';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'admin@framio.shop';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const sp = use(searchParams);
  const redirectTo = sp.redirect || '/';
  const urlError = sp.error;

  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }

    setLoading(true);

    // Admin login — direct to admin_users table, no Supabase auth needed
    if (email.toLowerCase().trim() === ADMIN_EMAIL) {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        toast.error(data.error || 'Incorrect email or password');
        return;
      }
      toast.success('Welcome to Admin Dashboard!');
      window.location.href = '/admin'; // hard redirect so the JWT cookie is sent
      return;
    }

    // Customer login — Supabase Auth
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(
        error.message.includes('Invalid login credentials')
          ? 'Incorrect email or password'
          : error.message
      );
      return;
    }

    // Gate on phone collection if the customer hasn't added one yet
    if (signInData.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', signInData.user.id)
        .single();

      if (!profile?.phone) {
        router.replace(`/auth/phone?next=${encodeURIComponent(redirectTo)}`);
        return;
      }
    }

    router.replace(redirectTo);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5EDE5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <Image
              src="/logo.png"
              alt="Framio"
              width={40}
              height={40}
              className="rounded-2xl border border-[#E8DDD6] shadow-sm"
            />
            <span className="text-2xl font-bold text-[#2D1F1A]">Framio</span>
          </Link>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Welcome back</h1>
          <p className="text-[#7A6A64] mt-1 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD6]">

          {urlError && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {urlError}
            </div>
          )}

          {/* Google — only for customers */}
          {email.toLowerCase().trim() !== ADMIN_EMAIL && (
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-[#E8DDD6] rounded-2xl py-3 px-4 font-medium text-[#2D1F1A] hover:bg-[#F5EDE5] hover:border-[#C4634F]/40 transition-all disabled:opacity-60 mb-5"
            >
              {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
          )}

          {email.toLowerCase().trim() !== ADMIN_EMAIL && (
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#E8DDD6]" />
              <span className="text-xs text-[#7A6A64] font-semibold tracking-wide uppercase">or</span>
              <div className="flex-1 h-px bg-[#E8DDD6]" />
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={15} />}
              autoComplete="email"
            />

            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="flex h-11 w-full rounded-xl border border-[#E8DDD6] bg-white pl-10 pr-11 py-2 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] transition-all focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {email.toLowerCase().trim() !== ADMIN_EMAIL && (
              <div className="flex justify-end -mt-1">
                <Link href="/auth/forgot-password" className="text-sm text-[#C4634F] hover:underline font-medium">
                  Forgot Password?
                </Link>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {email.toLowerCase().trim() === ADMIN_EMAIL ? 'Sign In to Dashboard' : 'Sign In'}
            </Button>
          </form>
        </div>

        {email.toLowerCase().trim() !== ADMIN_EMAIL && (
          <p className="text-center mt-5 text-[#7A6A64] text-sm">
            Don&apos;t have an account?{' '}
            <Link
              href={`/auth/signup${sp.redirect ? `?redirect=${encodeURIComponent(sp.redirect)}` : ''}`}
              className="text-[#C4634F] font-semibold hover:underline"
            >
              Create Account
            </Link>
          </p>
        )}

        <p className="text-center mt-4 text-xs text-[#7A6A64]">
          By continuing, you agree to our{' '}
          <a href="#" className="text-[#C4634F] hover:underline">Terms</a> &amp;{' '}
          <a href="#" className="text-[#C4634F] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
