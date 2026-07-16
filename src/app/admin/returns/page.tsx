import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { RotateCcw } from 'lucide-react';
import ReturnActions from './ReturnActions';

export const runtime = 'nodejs';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  refunded: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-purple-100 text-purple-700',
};

export default async function AdminReturnsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await getAdminOrRedirect();
  const sp = await searchParams;
  const statusFilter = sp.status || 'pending';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('return_requests')
    .select('*, orders(id, total_amount, profiles(full_name))')
    .order('created_at', { ascending: false });

  if (statusFilter !== 'all') query = query.eq('status', statusFilter);

  const { data: returns } = await query;

  const tabs = ['pending', 'approved', 'rejected', 'refunded', 'all'];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6">
        <h1 className="text-2xl font-bold text-[#2D1F1A]">Return Requests</h1>
        <p className="text-[#7A6A64] text-sm">{returns?.length || 0} requests</p>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <a key={t} href={`/admin/returns?status=${t}`}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${statusFilter === t ? 'bg-[#C4634F] text-white' : 'bg-white border border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F]'}`}>
            {t}
          </a>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EDE5]">
              {['Order', 'Customer', 'Reason', 'Amount', 'Requested', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5EDE5]">
            {(returns || []).map(r => (
              <tr key={r.id} className="hover:bg-[#FDF8F4]">
                <td className="px-4 py-4">
                  <a href={`/admin/orders/${r.order_id}`} className="text-sm font-mono font-medium text-[#C4634F] hover:underline">
                    #{r.order_id?.slice(-8).toUpperCase()}
                  </a>
                </td>
                <td className="px-4 py-4 text-sm text-[#2D1F1A]">{r.orders?.profiles?.full_name || '—'}</td>
                <td className="px-4 py-4 text-sm text-[#7A6A64] max-w-[200px] truncate">{r.reason || '—'}</td>
                <td className="px-4 py-4 text-sm font-semibold text-[#2D1F1A]">
                  ₹{((r.orders?.total_amount || 0) / 100).toFixed(0)}
                </td>
                <td className="px-4 py-4 text-xs text-[#7A6A64]">
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-600'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <ReturnActions id={r.id} status={r.status} orderId={r.order_id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!returns?.length && (
          <div className="py-16 text-center text-[#7A6A64]">
            <RotateCcw size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No return requests in this status.</p>
          </div>
        )}
      </div>
    </div>
  );
}
