'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, Heart, MapPin, User, Settings,
  HelpCircle, LogOut, ChevronRight, Loader2, Save, Plus,
  MessageCircle, Mail, Phone, Shield, Bell, Lock,
  ArrowRight, Star, Trash2, Edit3, Camera, CheckCircle, RefreshCw, X,
} from 'lucide-react';

const AdminIcon = LayoutDashboard;
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPrice, getOrderStatusLabel } from '@/lib/utils';
import { toast } from 'sonner';

const ADMIN_EMAIL = 'admin@framio.shop';

type Section = 'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'profile' | 'settings' | 'help';

interface Profile  { name: string; phone: string; email: string; avatarUrl: string | null; }
interface Order    { id: string; status: string; total: number; created_at: string; }
interface Address  { id: string; label: string; line1: string; line2?: string; city: string; state: string; pincode: string; phone: string; isDefault: boolean; }

const NAV = [
  { id: 'dashboard' as Section, label: 'Dashboard',       icon: LayoutDashboard },
  { id: 'orders'    as Section, label: 'My Orders',        icon: Package },
  { id: 'wishlist'  as Section, label: 'Wishlist',          icon: Heart },
  { id: 'addresses' as Section, label: 'Saved Addresses',  icon: MapPin },
  { id: 'profile'   as Section, label: 'Profile',           icon: User },
  { id: 'settings'  as Section, label: 'Account Settings', icon: Settings },
  { id: 'help'      as Section, label: 'Help & Support',   icon: HelpCircle },
];

const STATUS_COLOR: Record<string, string> = {
  processing: 'bg-amber-50 text-amber-700 border-amber-200',
  shipped:    'bg-blue-50 text-blue-700 border-blue-200',
  delivered:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:  'bg-red-50 text-red-700 border-red-200',
};

export default function AccountPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [section,   setSection]   = useState<Section>('dashboard');
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  const [authUser,   setAuthUser]   = useState<{ id: string; email?: string } | null>(null);
  const [profile,    setProfile]    = useState<Profile>({ name: '', phone: '', email: '', avatarUrl: null });
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [addresses,  setAddresses]  = useState<Address[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);

  /* phone edit state */
  const [phoneStep,    setPhoneStep]    = useState<'idle' | 'input' | 'otp'>('idle');
  const [newPhone,     setNewPhone]     = useState('');
  const [phoneOtp,     setPhoneOtp]     = useState(['', '', '', '', '', '']);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneTimer,   setPhoneTimer]   = useState(0);
  const phoneOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const phoneTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* address form state */
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress,  setEditingAddress]  = useState<Address | null>(null);
  const [addrForm, setAddrForm] = useState<Omit<Address, 'id' | 'isDefault'>>({
    label: 'Home', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '', phone: '',
  });

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace('/auth/login?redirect=/account'); return; }
      setAuthUser({ id: u.id, email: u.email });

      const [{ data: p }, { data: o }, { data: addr }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', u.id).single(),
        supabase.from('orders').select('id, status, total, created_at').eq('user_id', u.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('addresses').select('*').eq('user_id', u.id).order('is_default', { ascending: false }),
      ]);

      if (p) {
        setProfile({
          name:      p.name || p.full_name || '',
          phone:     p.phone || '',
          email:     p.email || u.email || '',
          avatarUrl: p.avatar_url || u.user_metadata?.avatar_url || null,
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email:     u.email || '',
          avatarUrl: u.user_metadata?.avatar_url || null,
        }));
      }
      setOrders(o || []);
      setAddresses((addr || []).map((a: Record<string, unknown>) => ({
        id:        a.id as string,
        label:     (a.label as string)   || 'Home',
        line1:     (a.line1 as string)   || '',
        line2:     (a.line2 as string)   || '',
        city:      (a.city as string)    || '',
        state:     (a.state as string)   || '',
        pincode:   (a.pincode as string) || '',
        phone:     (a.phone as string)   || '',
        isDefault: !!(a.is_default),
      })));
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Photo upload ───────────────────────────────────────────── */
  const handlePhotoUpload = async (file: File) => {
    if (!authUser) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
    setUploading(true);

    const ext  = file.name.split('.').pop() ?? 'jpg';
    const path = `${authUser.id}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('customer-uploads')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      toast.error('Upload failed: ' + upErr.message);
      setUploading(false);
      return;
    }

    // Generate a 10-year signed URL (bucket is private)
    const { data: signed } = await supabase.storage
      .from('customer-uploads')
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);

    const url = signed?.signedUrl ?? null;
    if (url) {
      await supabase.from('profiles').upsert({
        id: authUser.id, avatar_url: url,
        updated_at: new Date().toISOString(),
      });
      setProfile(p => ({ ...p, avatarUrl: url }));
      toast.success('Profile photo updated!');
    }
    setUploading(false);
  };

  /* ── Phone edit helpers ─────────────────────────────────────── */
  const phoneE164 = `+91${newPhone.replace(/\D/g, '')}`;

  const startPhoneTimer = () => {
    setPhoneTimer(30);
    if (phoneTimerRef.current) clearInterval(phoneTimerRef.current);
    phoneTimerRef.current = setInterval(() => {
      setPhoneTimer(s => { if (s <= 1) { clearInterval(phoneTimerRef.current!); return 0; } return s - 1; });
    }, 1000);
  };

  const sendPhoneOtp = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length !== 10) { toast.error('Enter a valid 10-digit number'); return; }
    setPhoneLoading(true);
    const { error } = await supabase.auth.updateUser({ phone: phoneE164 });
    setPhoneLoading(false);
    if (error) {
      // SMS provider not configured — save directly
      if (error.message.toLowerCase().includes('sms') || error.message.toLowerCase().includes('provider')) {
        await savePhoneDirect();
        return;
      }
      toast.error(error.message); return;
    }
    setPhoneOtp(['', '', '', '', '', '']);
    setPhoneStep('otp');
    startPhoneTimer();
    setTimeout(() => phoneOtpRefs.current[0]?.focus(), 100);
  };

  const savePhoneDirect = async () => {
    const res = await fetch('/api/auth/save-phone', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phoneE164 }),
    });
    if (res.ok) {
      setProfile(p => ({ ...p, phone: phoneE164 }));
      setPhoneStep('idle'); setNewPhone('');
      toast.success('Phone number updated!');
    } else {
      toast.error('Could not save phone number.');
    }
  };

  const verifyPhoneOtp = async () => {
    const token = phoneOtp.join('');
    if (token.length !== 6) { toast.error('Enter the 6-digit code'); return; }
    setPhoneLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone: phoneE164, token, type: 'phone_change' });
    setPhoneLoading(false);
    if (error) { toast.error(error.message); return; }
    if (authUser) {
      await supabase.from('profiles').upsert({ id: authUser.id, phone: phoneE164, updated_at: new Date().toISOString() });
    }
    setProfile(p => ({ ...p, phone: phoneE164 }));
    setPhoneStep('idle'); setNewPhone(''); setPhoneOtp(['', '', '', '', '', '']);
    toast.success('Phone number verified and updated!');
  };

  const handlePhoneOtpInput = (i: number, val: string) => {
    const d = val.replace(/\D/g, '').slice(-1);
    const next = [...phoneOtp]; next[i] = d; setPhoneOtp(next);
    if (d && i < 5) phoneOtpRefs.current[i + 1]?.focus();
  };
  const handlePhoneOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !phoneOtp[i] && i > 0) phoneOtpRefs.current[i - 1]?.focus();
  };
  const handlePhoneOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) { setPhoneOtp(text.split('')); phoneOtpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  /* ── Save profile ───────────────────────────────────────────── */
  const saveProfile = async () => {
    if (!authUser) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id:        authUser.id,
      full_name: profile.name,
      email:     profile.email,
    });
    setSaving(false);
    if (error) toast.error('Failed to save: ' + error.message);
    else toast.success('Profile updated!');
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const navigate = (s: Section) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Address helpers ────────────────────────────────────────── */
  const saveAddress = async () => {
    if (!authUser) return;
    if (!addrForm.line1 || !addrForm.city || !addrForm.pincode || !addrForm.phone) {
      toast.error('Please fill all required fields'); return;
    }
    const payload = { user_id: authUser.id, ...addrForm, is_default: addresses.length === 0 };
    if (editingAddress) {
      const { error } = await supabase.from('addresses').update(payload).eq('id', editingAddress.id);
      if (error) { toast.error('Failed to update address'); return; }
      setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...addrForm, isDefault: payload.is_default } : a));
    } else {
      const { data, error } = await supabase.from('addresses').insert(payload).select('id').single();
      if (error || !data) { toast.error('Failed to save address'); return; }
      setAddresses(prev => [...prev, { id: data.id, ...addrForm, isDefault: payload.is_default }]);
    }
    toast.success(editingAddress ? 'Address updated!' : 'Address saved!');
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddrForm({ label: 'Home', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '', phone: '' });
  };

  const deleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast.success('Address removed');
  };

  /* ── Loading ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[#C4634F]" />
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : (authUser?.email?.[0] || 'U').toUpperCase();

  /* ── Shared avatar renderer ─────────────────────────────────── */
  function AvatarCircle({ size, className = '', shape = 'rounded-xl' }: { size: number; className?: string; shape?: string }) {
    if (profile.avatarUrl) {
      return (
        <div style={{ width: size, height: size }} className={`relative ${shape} overflow-hidden flex-shrink-0 bg-[#C4634F]/10 ${className}`}>
          <Image src={profile.avatarUrl} alt="avatar" fill sizes={`${size}px`} className="object-cover" />
        </div>
      );
    }
    return (
      <div style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
        className={`${shape} bg-[#C4634F] flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}>
        {initials}
      </div>
    );
  }

  /* ── Derived ────────────────────────────────────────────────── */
  const delivered  = orders.filter(o => o.status === 'delivered').length;

  /* ── Section renderers ───────────────────────────────────────── */
  const sections: Record<Section, React.ReactNode> = {

    /* Dashboard */
    dashboard: (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#2D1F1A]">Welcome back{profile.name ? `, ${profile.name.split(' ')[0]}` : ''}!</h2>
          <p className="text-sm text-[#7A6A64] mt-0.5">Here's a snapshot of your account.</p>
        </div>

        {authUser?.email === ADMIN_EMAIL && (
          <Link href="/admin" className="flex items-center gap-3 p-4 bg-[#2D1F1A] rounded-2xl hover:bg-[#3d2b24] transition-all group">
            <div className="w-10 h-10 bg-[#C4634F] rounded-xl flex items-center justify-center flex-shrink-0">
              <AdminIcon size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white text-sm">Admin Dashboard</p>
              <p className="text-white/50 text-xs">Manage orders, products & more</p>
            </div>
            <ChevronRight size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
          </Link>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Orders',    value: orders.length,    icon: <Package size={18} />,  color: 'text-[#C4634F]',   bg: 'bg-[#C4634F]/10',  action: () => navigate('orders') },
            { label: 'Delivered',       value: delivered,         icon: <Star size={18} />,     color: 'text-emerald-600', bg: 'bg-emerald-50',    action: () => navigate('orders') },
            { label: 'Saved Addresses', value: addresses.length,  icon: <MapPin size={18} />,   color: 'text-[#C9A84C]',   bg: 'bg-[#C9A84C]/10', action: () => navigate('addresses') },
          ].map(s => (
            <button key={s.label} onClick={s.action}
              className="bg-white rounded-2xl border border-[#E8DDD6] p-5 text-left hover:border-[#C4634F]/40 hover:shadow-sm transition-all">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-[#2D1F1A]">{s.value}</p>
              <p className="text-xs text-[#7A6A64] mt-0.5">{s.label}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DDD6]">
            <h3 className="font-bold text-[#2D1F1A] text-sm">Recent Orders</h3>
            {orders.length > 0 && (
              <button onClick={() => navigate('orders')} className="text-xs text-[#C4634F] font-semibold hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </button>
            )}
          </div>
          {orders.length === 0 ? (
            <div className="py-10 text-center">
              <Package size={32} className="mx-auto mb-3 text-[#E8DDD6]" />
              <p className="text-sm text-[#7A6A64] mb-4">No orders yet</p>
              <Button asChild size="sm"><Link href="/products">Shop Now</Link></Button>
            </div>
          ) : (
            <div>
              {orders.slice(0, 4).map(o => (
                <Link key={o.id} href={`/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8DDD6] last:border-0 hover:bg-[#FDF8F4] transition-colors group">
                  <div>
                    <p className="text-xs font-mono text-[#7A6A64]">#{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="font-semibold text-[#2D1F1A] text-sm">{formatPrice(o.total)}</p>
                    <p className="text-xs text-[#7A6A64]">{new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_COLOR[o.status] || 'bg-[#F5EDE5] text-[#7A6A64] border-[#E8DDD6]'}`}>
                      {getOrderStatusLabel(o.status)}
                    </span>
                    <ChevronRight size={15} className="text-[#E8DDD6] group-hover:text-[#C4634F] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Browse Frames', href: '/products', icon: <ArrowRight size={14} /> },
            { label: 'Track an Order', action: () => navigate('orders'), icon: <Package size={14} /> },
          ].map(a => (
            a.href ? (
              <Link key={a.label} href={a.href}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DDD6] hover:border-[#C4634F]/40 hover:shadow-sm transition-all text-sm font-medium text-[#2D1F1A]">
                {a.label} <span className="text-[#C4634F]">{a.icon}</span>
              </Link>
            ) : (
              <button key={a.label} onClick={a.action}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E8DDD6] hover:border-[#C4634F]/40 hover:shadow-sm transition-all text-sm font-medium text-[#2D1F1A]">
                {a.label} <span className="text-[#C4634F]">{a.icon}</span>
              </button>
            )
          ))}
        </div>
      </div>
    ),

    /* My Orders */
    orders: (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#2D1F1A]">My Orders</h2>
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8DDD6] py-16 text-center">
            <Package size={48} className="mx-auto mb-4 text-[#E8DDD6]" />
            <p className="font-semibold text-[#2D1F1A] mb-1">No orders yet</p>
            <p className="text-sm text-[#7A6A64] mb-6">Your orders will appear here once you shop</p>
            <Button asChild><Link href="/products">Shop All Frames</Link></Button>
          </div>
        ) : (
          orders.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`}
              className="flex items-center justify-between bg-white rounded-2xl border border-[#E8DDD6] px-5 py-4 hover:border-[#C4634F]/50 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5EDE5] flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-[#C4634F]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2D1F1A] text-sm">Order #{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-[#7A6A64] mt-0.5">
                    {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{formatPrice(o.total)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border hidden sm:block ${STATUS_COLOR[o.status] || 'bg-[#F5EDE5] text-[#7A6A64] border-[#E8DDD6]'}`}>
                  {getOrderStatusLabel(o.status)}
                </span>
                <ChevronRight size={16} className="text-[#E8DDD6] group-hover:text-[#C4634F] transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    ),

    /* Wishlist */
    wishlist: (
      <div>
        <h2 className="text-xl font-bold text-[#2D1F1A] mb-6">Wishlist</h2>
        <div className="bg-white rounded-2xl border border-[#E8DDD6] py-16 text-center">
          <Heart size={48} className="mx-auto mb-4 text-[#E8DDD6]" />
          <p className="font-semibold text-[#2D1F1A] mb-1">Your wishlist is empty</p>
          <p className="text-sm text-[#7A6A64] mb-6">
            Tap the <Heart size={13} className="inline text-[#C4634F] fill-[#C4634F]" /> on any frame to save it here
          </p>
          <Button asChild><Link href="/products">Browse Frames</Link></Button>
        </div>
      </div>
    ),

    /* Saved Addresses */
    addresses: (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#2D1F1A]">Saved Addresses</h2>
          {!showAddressForm && (
            <Button size="sm" onClick={() => {
              setEditingAddress(null);
              setAddrForm({ label: 'Home', line1: '', line2: '', city: '', state: 'Maharashtra', pincode: '', phone: '' });
              setShowAddressForm(true);
            }}>
              <Plus size={14} /> Add New
            </Button>
          )}
        </div>

        {showAddressForm && (
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
            <h3 className="font-bold text-[#2D1F1A] mb-5">{editingAddress ? 'Edit Address' : 'New Address'}</h3>
            <div className="space-y-4">
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map(l => (
                  <button key={l} onClick={() => setAddrForm(f => ({ ...f, label: l }))}
                    className={`px-4 py-1.5 rounded-xl text-sm font-medium border-2 transition-all ${addrForm.label === l ? 'border-[#C4634F] bg-[#C4634F] text-white' : 'border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F]/50'}`}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Phone *" placeholder="9876543210" type="tel" maxLength={10}
                  value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} className="sm:col-span-2" />
                <Input label="Address Line 1 *" placeholder="Flat / House No., Street"
                  value={addrForm.line1} onChange={e => setAddrForm(f => ({ ...f, line1: e.target.value }))} className="sm:col-span-2" />
                <Input label="Address Line 2" placeholder="Landmark, Area (optional)"
                  value={addrForm.line2 || ''} onChange={e => setAddrForm(f => ({ ...f, line2: e.target.value }))} className="sm:col-span-2" />
                <Input label="City *" placeholder="Mumbai"
                  value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} />
                <Input label="PIN Code *" placeholder="400001" type="tel" maxLength={6}
                  value={addrForm.pincode} onChange={e => setAddrForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={saveAddress}><Save size={14} /> Save Address</Button>
              <Button variant="outline" onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showAddressForm ? (
          <div className="bg-white rounded-2xl border border-[#E8DDD6] py-14 text-center">
            <MapPin size={44} className="mx-auto mb-4 text-[#E8DDD6]" />
            <p className="font-semibold text-[#2D1F1A] mb-1">No saved addresses</p>
            <p className="text-sm text-[#7A6A64] mb-5">Add an address to speed up checkout</p>
            <Button size="sm" onClick={() => setShowAddressForm(true)}><Plus size={14} /> Add Address</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-[#F5EDE5] text-[#C4634F]">{a.label}</span>
                    {a.isDefault && <span className="text-xs font-medium text-emerald-600">Default</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      setEditingAddress(a);
                      setAddrForm({ label: a.label, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pincode: a.pincode, phone: a.phone });
                      setShowAddressForm(true);
                    }} className="p-1.5 text-[#7A6A64] hover:text-[#C4634F] hover:bg-[#F5EDE5] rounded-lg transition-all">
                      <Edit3 size={13} />
                    </button>
                    <button onClick={() => deleteAddress(a.id)}
                      className="p-1.5 text-[#7A6A64] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[#2D1F1A]">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</p>
                <p className="text-sm text-[#7A6A64]">{a.city}, {a.state} — {a.pincode}</p>
                <p className="text-xs text-[#7A6A64] mt-1 flex items-center gap-1"><Phone size={11} /> {a.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    ),

    /* Profile */
    profile: (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D1F1A]">Profile</h2>

        {/* Photo card */}
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
          <p className="text-sm font-semibold text-[#2D1F1A] mb-4">Profile Photo</p>
          <div className="flex items-center gap-5">
            {/* Avatar with camera overlay */}
            <div className="relative flex-shrink-0">
              <AvatarCircle size={80} shape="rounded-full" />
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                aria-label="Change photo"
              >
                {uploading
                  ? <Loader2 size={20} className="text-white animate-spin" />
                  : <Camera size={20} className="text-white" />}
              </button>
              {/* Mobile: separate button since hover doesn't work on touch */}
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="sm:hidden absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#C4634F] flex items-center justify-center shadow-lg"
              >
                {uploading ? <Loader2 size={12} className="text-white animate-spin" /> : <Camera size={12} className="text-white" />}
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-[#2D1F1A]">
                {profile.avatarUrl ? 'Change your photo' : 'Upload a profile photo'}
              </p>
              <p className="text-xs text-[#7A6A64] mt-0.5">JPG, PNG or WebP · max 5 MB</p>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={uploading}
                className="mt-2 text-xs font-semibold text-[#C4634F] hover:underline disabled:opacity-50 flex items-center gap-1"
              >
                <Camera size={11} />
                {uploading ? 'Uploading…' : profile.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {/* Personal details card */}
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
          <p className="text-sm font-semibold text-[#2D1F1A] mb-4">Personal Details</p>
          <div className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Priya Sharma"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              icon={<User size={15} />}
            />
            <Input
              label="Email Address"
              placeholder="you@email.com"
              type="email"
              value={profile.email}
              onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
              icon={<Mail size={15} />}
            />

            {/* Editable phone with inline OTP */}
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Phone Number</label>

              {phoneStep === 'idle' && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl border border-[#E8DDD6] bg-[#F5EDE5]/50 text-sm text-[#2D1F1A]">
                    <Phone size={14} className="text-[#7A6A64] flex-shrink-0" />
                    <span className={profile.phone ? 'text-[#2D1F1A]' : 'text-[#7A6A64]'}>
                      {profile.phone || 'Not added yet'}
                    </span>
                  </div>
                  <button
                    onClick={() => { setNewPhone(''); setPhoneStep('input'); }}
                    className="h-11 px-4 rounded-xl border-2 border-[#E8DDD6] text-sm font-semibold text-[#2D1F1A] hover:border-[#C4634F]/50 hover:bg-[#F5EDE5] transition-all flex-shrink-0 flex items-center gap-1.5"
                  >
                    <Edit3 size={13} />
                    {profile.phone ? 'Change' : 'Add'}
                  </button>
                </div>
              )}

              {phoneStep === 'input' && (
                <div className="rounded-2xl border-2 border-[#C4634F]/30 bg-[#FDF8F4] p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wide">Enter new mobile number</p>
                  <div className="flex items-center border-2 border-[#E8DDD6] rounded-xl overflow-hidden focus-within:border-[#C4634F] transition-colors bg-white">
                    <span className="px-3 py-2.5 bg-[#F5EDE5] text-sm font-semibold text-[#2D1F1A] border-r border-[#E8DDD6] flex-shrink-0">🇮🇳 +91</span>
                    <input
                      type="tel" inputMode="numeric" maxLength={10} autoFocus
                      placeholder="98765 43210"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onKeyDown={e => e.key === 'Enter' && sendPhoneOtp()}
                      className="flex-1 px-3 py-2.5 text-sm text-[#2D1F1A] outline-none bg-white placeholder:text-[#C9B8B0]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={sendPhoneOtp} disabled={phoneLoading}
                      className="flex items-center gap-1.5 bg-[#C4634F] hover:bg-[#b5574a] text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60 transition-colors">
                      {phoneLoading ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
                      Send OTP
                    </button>
                    <button onClick={() => { setPhoneStep('idle'); setNewPhone(''); }}
                      className="flex items-center gap-1 text-sm text-[#7A6A64] hover:text-[#2D1F1A] px-3 py-2 rounded-xl border border-[#E8DDD6] hover:border-[#2D1F1A]/30 transition-colors">
                      <X size={13} /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {phoneStep === 'otp' && (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                  <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wide">
                    Enter 6-digit code sent to +91 {newPhone}
                  </p>
                  <div className="flex gap-1.5" onPaste={handlePhoneOtpPaste}>
                    {phoneOtp.map((d, i) => (
                      <input key={i}
                        ref={el => { phoneOtpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1}
                        value={d}
                        onChange={e => handlePhoneOtpInput(i, e.target.value)}
                        onKeyDown={e => handlePhoneOtpKey(i, e)}
                        className="w-10 text-center text-base font-bold border-2 border-[#E8DDD6] rounded-xl focus:border-[#C4634F] focus:outline-none transition-colors bg-white"
                        style={{ height: '42px' }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={verifyPhoneOtp} disabled={phoneLoading || phoneOtp.join('').length !== 6}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-60 transition-colors">
                      {phoneLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Verify
                    </button>
                    <button onClick={() => { setPhoneStep('input'); setPhoneOtp(['','','','','','']); }}
                      className="text-xs text-[#7A6A64] hover:text-[#2D1F1A] flex items-center gap-1">
                      ← Change number
                    </button>
                    {phoneTimer > 0
                      ? <span className="text-xs text-[#7A6A64]">Resend in {phoneTimer}s</span>
                      : <button onClick={() => { setPhoneOtp(['','','','','','']); sendPhoneOtp(); }}
                          className="text-xs text-[#C4634F] font-semibold hover:underline flex items-center gap-1">
                          <RefreshCw size={11} /> Resend
                        </button>
                    }
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button onClick={saveProfile} disabled={saving} className="mt-6">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </Button>
        </div>
      </div>
    ),

    /* Account Settings */
    settings: (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D1F1A]">Account Settings</h2>

        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#F5EDE5] flex items-center justify-center">
                <Lock size={16} className="text-[#C4634F]" />
              </div>
              <div>
                <p className="font-semibold text-[#2D1F1A] text-sm">Password</p>
                <p className="text-xs text-[#7A6A64]">Change your account password</p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/forgot-password">Change</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#F5EDE5] flex items-center justify-center">
              <Bell size={16} className="text-[#C4634F]" />
            </div>
            <div>
              <p className="font-semibold text-[#2D1F1A] text-sm">Notifications</p>
              <p className="text-xs text-[#7A6A64]">Manage your notification preferences</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Order updates', desc: 'Status changes, dispatch & delivery alerts', checked: true },
              { label: 'Promotions & offers', desc: 'Exclusive deals and seasonal sales', checked: false },
              { label: 'New arrivals', desc: 'Be first to know about new frame collections', checked: false },
            ].map(n => (
              <label key={n.label} className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" defaultChecked={n.checked} className="mt-0.5 accent-[#C4634F] w-4 h-4 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[#2D1F1A]">{n.label}</p>
                  <p className="text-xs text-[#7A6A64]">{n.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#F5EDE5] flex items-center justify-center">
              <Shield size={16} className="text-[#C4634F]" />
            </div>
            <div>
              <p className="font-semibold text-[#2D1F1A] text-sm">Privacy & Data</p>
              <p className="text-xs text-[#7A6A64]">Manage your data and privacy settings</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild><Link href="#">Privacy Policy</Link></Button>
            <Button variant="outline" size="sm" asChild><Link href="#">Terms of Service</Link></Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-red-100 p-5">
          <p className="font-semibold text-red-600 text-sm mb-1">Danger Zone</p>
          <p className="text-xs text-[#7A6A64] mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
          <Button variant="outline" size="sm" className="border-red-200 text-red-500 hover:bg-red-50 hover:border-red-400">
            Delete Account
          </Button>
        </div>
      </div>
    ),

    /* Help & Support */
    help: (
      <div className="space-y-5">
        <h2 className="text-xl font-bold text-[#2D1F1A]">Help & Support</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: <MessageCircle size={20} className="text-green-600" />, bg: 'bg-green-50', label: 'WhatsApp Chat', desc: 'Fastest — usually replies in under 30 min', href: 'https://wa.me/917010388736', cta: 'Chat Now' },
            { icon: <Mail size={20} className="text-[#C4634F]" />,          bg: 'bg-[#F5EDE5]', label: 'Email Support', desc: 'Replies within 4–6 business hours',          href: 'mailto:hello@framio.shop', cta: 'Send Email' },
          ].map(c => (
            <a key={c.label} href={c.href} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-2xl border border-[#E8DDD6] p-5 hover:border-[#C4634F]/40 hover:shadow-sm transition-all group">
              <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>{c.icon}</div>
              <p className="font-semibold text-[#2D1F1A] text-sm mb-0.5">{c.label}</p>
              <p className="text-xs text-[#7A6A64] mb-3">{c.desc}</p>
              <span className="text-xs font-semibold text-[#C4634F] flex items-center gap-1 group-hover:underline">
                {c.cta} <ArrowRight size={11} />
              </span>
            </a>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8DDD6]">
            <p className="font-bold text-[#2D1F1A] text-sm">Quick Help</p>
          </div>
          {[
            { q: 'How do I track my order?', href: '#' },
            { q: 'What is your return & replacement policy?', href: '#' },
            { q: 'How long does delivery take?', href: '#' },
            { q: 'Can I change my order after placing it?', href: '#' },
            { q: 'What image quality do I need?', href: '#' },
          ].map(item => (
            <Link key={item.q} href={item.href}
              className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8DDD6] last:border-0 hover:bg-[#FDF8F4] transition-colors group text-sm text-[#2D1F1A]">
              {item.q}
              <ChevronRight size={14} className="text-[#E8DDD6] group-hover:text-[#C4634F] flex-shrink-0 ml-2" />
            </Link>
          ))}
        </div>
        <div className="bg-[#F5EDE5] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[#2D1F1A] text-sm">Support Hours</p>
            <p className="text-xs text-[#7A6A64] mt-0.5">Mon–Sat · 9 AM – 8 PM IST</p>
          </div>
          <Link href="/contact" className="text-xs text-[#C4634F] font-semibold hover:underline flex items-center gap-1">
            Contact Page <ArrowRight size={11} />
          </Link>
        </div>
      </div>
    ),
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="bg-[#FDF8F4] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* ── Desktop Sidebar ────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-24">
            {/* User card */}
            <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5 mb-3">
              <div className="flex items-center gap-3">
                <AvatarCircle size={48} shape="rounded-xl" />
                <div className="min-w-0">
                  <p className="font-bold text-[#2D1F1A] text-sm truncate">{profile.name || 'My Account'}</p>
                  <p className="text-xs text-[#7A6A64] truncate">{authUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden mb-3">
              {NAV.map(({ id, label, icon: Icon }, idx) => (
                <button key={id} onClick={() => navigate(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${idx < NAV.length - 1 ? 'border-b border-[#F5EDE5]' : ''} ${
                    section === id
                      ? 'bg-[#C4634F]/8 text-[#C4634F] font-semibold'
                      : 'text-[#7A6A64] hover:bg-[#FDF8F4] hover:text-[#2D1F1A]'
                  }`}>
                  <Icon size={16} className={section === id ? 'text-[#C4634F]' : 'text-[#7A6A64]'} />
                  {label}
                  {section === id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C4634F]" />}
                </button>
              ))}
            </nav>

            <button onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-[#E8DDD6] text-sm text-[#7A6A64] hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all">
              <LogOut size={16} /> Sign Out
            </button>
          </aside>

          {/* ── Main content ───────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile: user header */}
            <div className="lg:hidden flex items-center gap-3 mb-5">
              <AvatarCircle size={44} shape="rounded-xl" />
              <div className="min-w-0">
                <p className="font-bold text-[#2D1F1A] text-sm truncate">{profile.name || 'My Account'}</p>
                <p className="text-xs text-[#7A6A64] truncate">{authUser?.email}</p>
              </div>
              <button onClick={signOut} className="ml-auto p-2 text-[#7A6A64] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0">
                <LogOut size={16} />
              </button>
            </div>

            {/* Mobile: horizontal scroll nav */}
            <div className="lg:hidden -mx-4 px-4 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {NAV.map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => navigate(id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-all border ${
                      section === id
                        ? 'bg-[#C4634F] text-white border-[#C4634F] shadow-sm'
                        : 'bg-white text-[#7A6A64] border-[#E8DDD6] hover:border-[#C4634F]/40'
                    }`}>
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section content */}
            {sections[section]}
          </div>
        </div>
      </div>
    </div>
  );
}
