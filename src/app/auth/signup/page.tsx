'use client';

export const dynamic = 'force-dynamic';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = use(searchParams);
  const redirectTo = sp.redirect || '/account';

  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) { toast.error('Please enter your full name'); return; }
    if (!form.email) { toast.error('Please enter your email'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.name.trim(),
          phone: form.phone.replace(/\D/g, '') || null,
        },
        // Kept as fallback in case email confirmation is still enabled
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);

    if (error) {
      const msg = typeof error.message === 'string' ? error.message : '';
      toast.error(
        msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already registered')
          ? 'This email is already registered. Try logging in.'
          : msg || 'Something went wrong. Please try again.'
      );
      return;
    }

    if (data.session) {
      // Email confirmation disabled — user is signed in immediately.
      // Send welcome email NOW (don't rely on phone page — user can skip it).
      await fetch('/api/auth/welcome-email', { method: 'POST' });
      // Then collect their phone number
      router.replace(`/auth/phone?next=${encodeURIComponent(redirectTo)}`);
      return;
    }

    // Email confirmation still enabled — show "check your inbox" screen
    setEmailSent(true);
  };

  const handleGoogleSignup = async () => {
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

  // ── Email sent confirmation state ─────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F5EDE5] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-3xl p-10 shadow-sm border border-[#E8DDD6]">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#2D1F1A] mb-2">Check your email</h2>
            <p className="text-[#7A6A64] mb-1">
              We sent a verification link to
            </p>
            <p className="font-semibold text-[#2D1F1A] mb-5">{form.email}</p>
            <p className="text-sm text-[#7A6A64] mb-6">
              Click the link in the email to verify your account and start shopping.
              Check your spam folder if you don&apos;t see it.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Create your account</h1>
          <p className="text-[#7A6A64] mt-1 text-sm">Join Framio and start gifting</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD6]">

          {/* Google */}
          <button
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border-2 border-[#E8DDD6] rounded-2xl py-3 px-4 font-medium text-[#2D1F1A] hover:bg-[#F5EDE5] hover:border-[#C4634F]/40 transition-all disabled:opacity-60 mb-5"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#E8DDD6]" />
            <span className="text-xs text-[#7A6A64] font-semibold tracking-wide uppercase">or</span>
            <div className="flex-1 h-px bg-[#E8DDD6]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Priya Sharma"
              value={form.name}
              onChange={set('name')}
              icon={<User size={15} />}
              autoComplete="name"
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              icon={<Mail size={15} />}
              autoComplete="email"
            />

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64]">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64]">
                  <Lock size={15} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  autoComplete="new-password"
                  className={`flex h-11 w-full rounded-xl border bg-white pl-10 pr-11 py-2 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] transition-all focus:outline-none focus:ring-2 focus:border-transparent ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-red-400 focus:ring-red-400'
                      : 'border-[#E8DDD6] focus:ring-[#C4634F]'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                Phone Number <span className="text-[#7A6A64] font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <div className="h-11 px-3 flex items-center bg-[#F5EDE5] border border-[#E8DDD6] rounded-xl text-sm font-medium text-[#2D1F1A] flex-shrink-0 gap-1.5">
                  <Phone size={14} className="text-[#7A6A64]" />
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                  className="flex-1 h-11 px-4 rounded-xl border border-[#E8DDD6] text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center mt-5 text-[#7A6A64] text-sm">
          Already have an account?{' '}
          <Link
            href={`/auth/login${sp.redirect ? `?redirect=${encodeURIComponent(sp.redirect)}` : ''}`}
            className="text-[#C4634F] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>

        <p className="text-center mt-4 text-xs text-[#7A6A64]">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-[#C4634F] hover:underline">Terms</a> &amp;{' '}
          <a href="#" className="text-[#C4634F] hover:underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
