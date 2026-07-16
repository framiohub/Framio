import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { Users } from 'lucide-react';

export const runtime = 'nodejs';

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await getAdminOrRedirect();
  const sp = await searchParams;
  const q = sp.q?.trim();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('profiles')
    .select('*, orders(id, total_amount, status)')
    .order('created_at', { ascending: false });

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data: customers } = await query.limit(50);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Customers</h1>
          <p className="text-[#7A6A64] text-sm">{customers?.length || 0} customers</p>
        </div>
        <form method="GET" className="flex gap-2 w-full sm:w-auto">
          <input name="q" defaultValue={q} placeholder="Search by name or email…"
            className="flex-1 sm:w-56 h-10 px-4 rounded-xl border border-[#E8DDD6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4634F]" />
          <button type="submit"
            className="h-10 px-4 bg-[#C4634F] hover:bg-[#a8513f] text-white rounded-xl text-sm font-medium flex-shrink-0">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#F5EDE5]">
              {['Customer', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5EDE5]">
            {(customers || []).map(c => {
              const orders = c.orders || [];
              const totalSpent = orders
                .filter((o: { status: string }) => o.status !== 'cancelled')
                .reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0);
              return (
                <tr key={c.id} className="hover:bg-[#FDF8F4]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#C4634F]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#C4634F] font-bold text-sm">{(c.full_name || c.email || '?')[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-sm text-[#2D1F1A]">{c.full_name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-[#7A6A64]">{c.email || '—'}</td>
                  <td className="px-4 py-4 text-sm text-[#7A6A64]">{c.phone || '—'}</td>
                  <td className="px-4 py-4 text-sm text-center font-semibold text-[#2D1F1A]">{orders.length}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-[#2D1F1A]">
                    ₹{(totalSpent / 100).toFixed(0)}
                  </td>
                  <td className="px-4 py-4 text-xs text-[#7A6A64]">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
        {!customers?.length && (
          <div className="py-16 text-center text-[#7A6A64]">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No customers found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
