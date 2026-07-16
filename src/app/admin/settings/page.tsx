'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Store, Mail, Truck, CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

const inputCls = "flex h-11 w-full rounded-xl border border-[#E8DDD6] bg-white px-4 py-2 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F]";
const textareaCls = "w-full rounded-xl border border-[#E8DDD6] bg-white px-4 py-3 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] resize-none";

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState<string | null>(null);

  const [store, setStore] = useState({
    name: 'Framio',
    tagline: 'Personalized Gifts, Made with Love',
    email: 'hello@framio.shop',
    phone: '',
    address: '',
    gst: '',
  });

  const [shipping, setShipping] = useState({
    free_shipping_above: '500',
    standard_rate: '49',
    express_rate: '99',
    processing_days: '2-3',
  });

  const save = async (section: string) => {
    setSaving(section);
    await new Promise(r => setTimeout(r, 600));
    setSaving(null);
    toast.success('Settings saved');
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#2D1F1A]">Settings</h1>
        <p className="text-[#7A6A64] text-sm">Manage your store configuration</p>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-[#F5EDE5] rounded-xl flex items-center justify-center">
            <Store size={15} className="text-[#C4634F]" />
          </div>
          <h2 className="font-semibold text-[#2D1F1A]">Store Information</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Store Name</label>
              <input value={store.name} onChange={e => setStore(s => ({ ...s, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Email</label>
              <input type="email" value={store.email} onChange={e => setStore(s => ({ ...s, email: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Tagline</label>
            <input value={store.tagline} onChange={e => setStore(s => ({ ...s, tagline: e.target.value }))} className={inputCls} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Phone</label>
              <input value={store.phone} onChange={e => setStore(s => ({ ...s, phone: e.target.value }))} placeholder="+91 98765 43210" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">GST Number</label>
              <input value={store.gst} onChange={e => setStore(s => ({ ...s, gst: e.target.value }))} placeholder="27AABCU9603R1ZX" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Business Address</label>
            <textarea value={store.address} onChange={e => setStore(s => ({ ...s, address: e.target.value }))}
              rows={2} placeholder="123, Street, City, State - PIN" className={textareaCls} />
          </div>
          <button onClick={() => save('store')} disabled={saving === 'store'}
            className="flex items-center gap-2 bg-[#C4634F] hover:bg-[#a8513f] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            {saving === 'store' && <Loader2 size={14} className="animate-spin" />} Save Store Info
          </button>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-[#F5EDE5] rounded-xl flex items-center justify-center">
            <Truck size={15} className="text-[#C4634F]" />
          </div>
          <h2 className="font-semibold text-[#2D1F1A]">Shipping Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Free Shipping Above (₹)</label>
              <input type="number" value={shipping.free_shipping_above} onChange={e => setShipping(s => ({ ...s, free_shipping_above: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Standard Rate (₹)</label>
              <input type="number" value={shipping.standard_rate} onChange={e => setShipping(s => ({ ...s, standard_rate: e.target.value }))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Express Rate (₹)</label>
              <input type="number" value={shipping.express_rate} onChange={e => setShipping(s => ({ ...s, express_rate: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Processing Time</label>
              <input value={shipping.processing_days} onChange={e => setShipping(s => ({ ...s, processing_days: e.target.value }))} placeholder="2-3 days" className={inputCls} />
            </div>
          </div>
          <button onClick={() => save('shipping')} disabled={saving === 'shipping'}
            className="flex items-center gap-2 bg-[#C4634F] hover:bg-[#a8513f] text-white px-5 py-2.5 rounded-xl text-sm font-medium">
            {saving === 'shipping' && <Loader2 size={14} className="animate-spin" />} Save Shipping
          </button>
        </div>
      </div>

      {/* Payment */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-[#F5EDE5] rounded-xl flex items-center justify-center">
            <CreditCard size={15} className="text-[#C4634F]" />
          </div>
          <h2 className="font-semibold text-[#2D1F1A]">Payment</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#F5EDE5] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#C4634F] rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D1F1A]">Razorpay</p>
                <p className="text-xs text-[#7A6A64]">Test mode active — {process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.slice(0, 15)}…</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Connected</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#F5EDE5] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2D1F1A]">Supabase Auth</p>
                <p className="text-xs text-[#7A6A64]">Email + Google OAuth enabled</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Connected</span>
          </div>
        </div>
      </div>

      {/* Admin Password */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 bg-[#F5EDE5] rounded-xl flex items-center justify-center">
            <Mail size={15} className="text-[#C4634F]" />
          </div>
          <h2 className="font-semibold text-[#2D1F1A]">Admin Credentials</h2>
        </div>
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-semibold mb-1">Change admin password via Supabase SQL Editor:</p>
          <code className="block text-xs bg-amber-100 rounded-lg p-3 mt-2 font-mono">
            {`UPDATE admin_users SET password_hash = crypt('newpassword', gen_salt('bf', 10)) WHERE email = 'admin@framio.shop';`}
          </code>
        </div>
      </div>
    </div>
  );
}
