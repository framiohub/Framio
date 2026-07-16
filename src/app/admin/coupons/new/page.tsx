'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type CouponType = 'percentage' | 'fixed' | 'free_shipping';

export default function NewCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage' as CouponType,
    value: '',
    min_order_amount: '',
    max_uses: '',
    valid_until: '',
    is_active: true,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) { toast.error('Enter a coupon code'); return; }
    if (form.type !== 'free_shipping' && !form.value) { toast.error('Enter discount value'); return; }

    setLoading(true);
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: form.type === 'free_shipping' ? 0 : parseFloat(form.value) || 0,
        min_order_amount: parseFloat(form.min_order_amount) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        valid_until: form.valid_until || null,
        is_active: form.is_active,
      }),
    });
    setLoading(false);

    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Failed to create coupon'); return; }
    toast.success('Coupon created!');
    router.push('/admin/coupons');
  };

  const inputCls = "flex h-11 w-full rounded-xl border border-[#E8DDD6] bg-white px-4 py-2 text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F] focus:border-transparent";

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <Link href="/admin/coupons" className="flex items-center gap-2 text-sm text-[#7A6A64] hover:text-[#2D1F1A] mb-5">
        <ArrowLeft size={14} /> Back to Coupons
      </Link>

      <h1 className="text-2xl font-bold text-[#2D1F1A] mb-6">Create Coupon</h1>

      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Coupon Code *</label>
              <input placeholder="SAVE20" value={form.code} onChange={set('code')}
                className={`${inputCls} uppercase`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Discount Type *</label>
              <select value={form.type} onChange={set('type')} className={inputCls}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Flat Amount (₹)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>

          {form.type !== 'free_shipping' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">
                  {form.type === 'percentage' ? 'Discount %' : 'Flat Amount (₹)'} *
                </label>
                <input type="number" min="0" max={form.type === 'percentage' ? 100 : undefined}
                  placeholder={form.type === 'percentage' ? '20' : '100'}
                  value={form.value} onChange={set('value')} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Min Order Amount (₹)</label>
                <input type="number" min="0" placeholder="499" value={form.min_order_amount} onChange={set('min_order_amount')} className={inputCls} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Usage Limit</label>
              <input type="number" min="1" placeholder="Unlimited" value={form.max_uses} onChange={set('max_uses')} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Expiry Date</label>
              <input type="date" value={form.valid_until} onChange={set('valid_until')} className={inputCls} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={form.is_active}
              onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
              className="w-4 h-4 accent-[#C4634F] rounded" />
            <label htmlFor="active" className="text-sm font-medium text-[#2D1F1A]">Active immediately</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-[#C4634F] hover:bg-[#a8513f] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Create Coupon
            </button>
            <Link href="/admin/coupons"
              className="px-6 py-2.5 rounded-xl border border-[#E8DDD6] text-sm font-medium text-[#7A6A64] hover:border-[#2D1F1A] transition-all">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
