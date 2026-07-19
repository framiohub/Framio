'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, ArrowRight, Loader2, CheckCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function PhonePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp      = use(searchParams);
  const nextUrl = sp.next || '/account';

  const router   = useRouter();
  const supabase = createClient();

  const [step,       setStep]       = useState<'phone' | 'otp' | 'done'>('phone');
  const [phone,      setPhone]      = useState('');
  const [otp,        setOtp]        = useState(['', '', '', '', '', '']);
  const [loading,    setLoading]    = useState(false);
  const [resendSecs, setResendSecs] = useState(0);
  const otpRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/auth/login');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResendTimer = () => {
    setResendSecs(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendSecs(s => { if (s <= 1) { clearInterval(timerRef.current!); return 0; } return s - 1; });
    }, 1000);
  };

  const e164 = `+91${phone.replace(/\D/g, '')}`;

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { toast.error('Enter a valid 10-digit mobile number'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ phone: e164 });
    setLoading(false);
    if (error) {
      // SMS/phone provider not configured in Supabase — save number directly
      if (
        error.message.toLowerCase().includes('sms') ||
        error.message.toLowerCase().includes('provider') ||
        error.message.toLowerCase().includes('phone') ||
        error.message.toLowerCase().includes('not enabled')
      ) {
        await savePhoneDirectly();
        return;
      }
      toast.error(error.message);
      return;
    }
    setStep('otp');
    startResendTimer();
    setTimeout(() => otpRefs.current[0]?.focus(), 100);
  };

  const savePhoneDirectly = async () => {
    const res = await fetch('/api/auth/save-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: e164 }),
    });
    if (res.ok) {
      setStep('done');
      setTimeout(() => router.replace(nextUrl), 1200);
    } else {
      toast.error('Could not save phone number. Please try again.');
    }
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: e164, token, type: 'phone_change' });
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, phone: e164 });
    }
    setStep('done');
    toast.success('Mobile number verified!');
    setTimeout(() => router.replace(nextUrl), 1200);
  };

  const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const handleOtpInput = (i: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next  = [...otp]; next[i] = digit; setOtp(next);
    if (digit && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) { setOtp(text.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const skip = () => router.replace(nextUrl);

  return (
    <div className="min-h-screen bg-[#F5EDE5] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
            <Image src="/logo.png" alt="Framio" width={40} height={40}
              className="rounded-2xl border border-[#E8DDD6] shadow-sm" />
            <span className="text-2xl font-bold text-[#2D1F1A]">Framio</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#E8DDD6]">

          {step === 'done' && (
            <div className="text-center py-4">
              <CheckCircle size={52} className="text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-[#2D1F1A] mb-1">All set!</h2>
              <p className="text-sm text-[#7A6A64]">Taking you to your account…</p>
            </div>
          )}

          {step === 'phone' && (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-[#C4634F]/10 flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-[#C4634F]" />
                </div>
                <h1 className="text-2xl font-bold text-[#2D1F1A]">Add your mobile number</h1>
                <p className="text-sm text-[#7A6A64] mt-1.5">We use this for order updates and delivery.</p>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#2D1F1A] mb-1.5 uppercase tracking-wide">Mobile Number</label>
                <div className="flex items-center border-2 border-[#E8DDD6] rounded-xl overflow-hidden focus-within:border-[#C4634F] transition-colors">
                  <span className="px-3 py-3 bg-[#F5EDE5] text-sm font-semibold text-[#2D1F1A] border-r border-[#E8DDD6] flex-shrink-0">🇮🇳 +91</span>
                  <input
                    type="tel" inputMode="numeric" maxLength={10} autoFocus
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && sendOtp()}
                    className="flex-1 px-3 py-3 text-sm text-[#2D1F1A] outline-none bg-white placeholder:text-[#C9B8B0]"
                  />
                </div>
              </div>

              <button onClick={sendOtp} disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#C4634F] hover:bg-[#b5574a] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 mb-3">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Send OTP
              </button>
              <button onClick={skip}
                className="w-full text-center text-xs text-[#7A6A64] hover:text-[#2D1F1A] transition-colors py-1">
                Skip for now
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <Phone size={24} className="text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-[#2D1F1A]">Enter the code</h1>
                <p className="text-sm text-[#7A6A64] mt-1.5">Sent to <strong className="text-[#2D1F1A]">+91 {phone}</strong></p>
              </div>

              <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleOtpInput(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    className="w-11 text-center text-lg font-bold border-2 border-[#E8DDD6] rounded-xl focus:border-[#C4634F] focus:outline-none transition-colors"
                    style={{ height: '52px' }}
                  />
                ))}
              </div>

              <button onClick={verifyOtp} disabled={loading || otp.join('').length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-[#C4634F] hover:bg-[#b5574a] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-60 mb-4">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Verify & Continue
              </button>

              <div className="flex items-center justify-between text-xs text-[#7A6A64]">
                <button onClick={() => { setStep('phone'); setOtp(['','','','','','']); }}
                  className="hover:text-[#2D1F1A] transition-colors">← Change number</button>
                {resendSecs > 0
                  ? <span>Resend in {resendSecs}s</span>
                  : <button onClick={() => { setOtp(['','','','','','']); sendOtp(); }}
                      className="flex items-center gap-1 text-[#C4634F] font-semibold hover:underline">
                      <RefreshCw size={11} /> Resend OTP
                    </button>
                }
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
