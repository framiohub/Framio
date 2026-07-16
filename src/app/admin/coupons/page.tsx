import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Plus, Tag } from 'lucide-react';
import CouponActions from './CouponActions';

export const runtime = 'nodejs';

export default async function AdminCouponsPage() {
  await getAdminOrRedirect();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: coupons } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Coupons</h1>
          <p className="text-[#7A6A64] text-sm">{coupons?.length || 0} discount codes</p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-2 bg-[#C4634F] hover:bg-[#a8513f] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex-shrink-0"
        >
          <Plus size={16} /> Create Coupon
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EDE5]">
              {['Code', 'Type', 'Value', 'Min Order', 'Used / Limit', 'Expires', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5EDE5]">
            {(coupons || []).map(c => (
              <tr key={c.id} className="hover:bg-[#FDF8F4]">
                <td className="px-4 py-4">
                  <span className="font-mono font-bold text-[#2D1F1A] bg-[#F5EDE5] px-2 py-1 rounded-lg text-sm">{c.code}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                    c.type === 'percentage' ? 'bg-blue-100 text-blue-700' :
                    c.type === 'free_shipping' ? 'bg-purple-100 text-purple-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{c.type?.replace('_', ' ')}</span>
                </td>
                <td className="px-4 py-4 font-semibold text-[#2D1F1A] text-sm">
                  {c.type === 'percentage' ? `${c.value}%` : c.type === 'free_shipping' ? 'Free' : formatPrice(c.value)}
                </td>
                <td className="px-4 py-4 text-sm text-[#7A6A64]">{c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : '—'}</td>
                <td className="px-4 py-4 text-sm text-[#7A6A64]">{c.used_count} / {c.max_uses ?? '∞'}</td>
                <td className="px-4 py-4 text-xs text-[#7A6A64]">
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${c.is_active ? 'text-emerald-600' : 'text-red-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <CouponActions id={c.id} isActive={c.is_active} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!coupons?.length && (
          <div className="py-16 text-center text-[#7A6A64]">
            <Tag size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No coupons yet. Create your first discount code.</p>
          </div>
        )}
      </div>
    </div>
  );
}
