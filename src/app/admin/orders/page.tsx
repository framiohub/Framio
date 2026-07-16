import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { Search } from 'lucide-react';

export const runtime = 'nodejs';

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-amber-100 text-amber-700',
  printing:   'bg-blue-100 text-blue-700',
  packed:     'bg-purple-100 text-purple-700',
  shipped:    'bg-indigo-100 text-indigo-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter = sp.status || '';

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabaseAdmin
    .from('orders')
    .select('id, status, total, payment_status, created_at, shipping_address, order_items(product_name, quantity)')
    .order('created_at', { ascending: false });

  if (statusFilter) query = query.eq('status', statusFilter);

  const { data: orders } = await query;

  const statuses = ['all', 'processing', 'printing', 'packed', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5 md:mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Orders</h1>
          <p className="text-[#7A6A64] text-sm">{orders?.length || 0} total orders</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {statuses.map(s => (
          <Link
            key={s}
            href={s === 'all' ? '/admin/orders' : `/admin/orders?status=${s}`}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
              (s === 'all' && !statusFilter) || statusFilter === s
                ? 'bg-[#2D1F1A] text-white'
                : 'bg-white border border-[#E8DDD6] text-[#7A6A64] hover:border-[#2D1F1A]'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5EDE5]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Items</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Payment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDE5]">
              {(orders || []).map((order: {
                id: string;
                status: string;
                total: number;
                payment_status: string;
                created_at: string;
                shipping_address: { name: string; phone: string };
                order_items: Array<{ product_name: string; quantity: number }>;
              }) => (
                <tr key={order.id} className="hover:bg-[#FDF8F4] transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-[#7A6A64]">#{order.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-[#2D1F1A]">{order.shipping_address?.name || '—'}</p>
                    <p className="text-xs text-[#7A6A64]">{order.shipping_address?.phone || ''}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7A6A64] max-w-[160px]">
                    {order.order_items?.map((i: { product_name: string; quantity: number }, idx: number) => (
                      <span key={idx}>{i.product_name} ×{i.quantity}{idx < order.order_items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7A6A64]">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-[#C4634F]">{formatPrice(order.total)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-[#C4634F] font-medium hover:underline">
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders?.length && (
            <div className="py-16 text-center text-[#7A6A64]">
              <Search size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No orders found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
