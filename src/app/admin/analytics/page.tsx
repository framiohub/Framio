import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import { TrendingUp, ShoppingBag, Users, Package, IndianRupee, Star } from 'lucide-react';

export const runtime = 'nodejs';

function formatMoney(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default async function AdminAnalyticsPage() {
  await getAdminOrRedirect();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    { data: allOrders },
    { data: thisMonthOrders },
    { data: lastMonthOrders },
    { data: customers },
    { data: products },
    { data: topProducts },
    { data: recentOrders },
  ] = await Promise.all([
    supabase.from('orders').select('id, total_amount, status, created_at'),
    supabase.from('orders').select('id, total_amount, status').gte('created_at', startOfMonth),
    supabase.from('orders').select('id, total_amount, status').gte('created_at', startOfLastMonth).lt('created_at', startOfMonth),
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('order_items').select('product_id, quantity, products(name, images)').limit(100),
    supabase.from('orders').select('id, total_amount, status, created_at, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
  ]);

  const delivered = (orders: { status: string; total_amount: number }[] | null) =>
    (orders || []).filter(o => o.status === 'delivered');

  const revenue = (orders: { status: string; total_amount: number }[] | null) =>
    delivered(orders).reduce((s, o) => s + (o.total_amount || 0), 0);

  const thisRevenue = revenue(thisMonthOrders);
  const lastRevenue = revenue(lastMonthOrders);
  const revenueGrowth = lastRevenue ? (((thisRevenue - lastRevenue) / lastRevenue) * 100).toFixed(1) : null;

  // Aggregate top products
  const productMap: Record<string, { name: string; img?: string; qty: number }> = {};
  for (const item of topProducts || []) {
    const pid = item.product_id;
    const prod = Array.isArray(item.products) ? item.products[0] : item.products;
    if (!productMap[pid]) productMap[pid] = { name: prod?.name || pid, img: prod?.images?.[0], qty: 0 };
    productMap[pid].qty += item.quantity || 0;
  }
  const topSelling = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const statusCounts = (allOrders || []).reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const statCards = [
    { label: 'Total Revenue', value: formatMoney(revenue(allOrders)), icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'This Month', value: formatMoney(thisRevenue), sub: revenueGrowth ? `${revenueGrowth > '0' ? '+' : ''}${revenueGrowth}% vs last month` : '', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Orders', value: allOrders?.length || 0, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Customers', value: customers?.length || 0, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Products', value: products?.length || 0, icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50' },
  ];

  const ORDER_COLORS: Record<string, string> = {
    delivered: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    shipped: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-600',
    confirmed: 'bg-purple-100 text-purple-700',
    printing: 'bg-cyan-100 text-cyan-700',
    packed: 'bg-indigo-100 text-indigo-700',
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2D1F1A]">Analytics</h1>
        <p className="text-[#7A6A64] text-sm">Overview of your store performance</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-[#E8DDD6] p-4 md:p-5">
            <div className={`w-9 h-9 md:w-10 md:h-10 ${card.bg} rounded-xl flex items-center justify-center mb-2 md:mb-3`}>
              <card.icon size={16} className={card.color} />
            </div>
            <p className="text-xl md:text-2xl font-bold text-[#2D1F1A]">{card.value}</p>
            <p className="text-xs md:text-sm text-[#7A6A64] mt-0.5">{card.label}</p>
            {card.sub && <p className="text-xs text-emerald-600 font-medium mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Orders by Status</h2>
          <div className="space-y-2.5">
            {Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${ORDER_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-[#F5EDE5] rounded-full h-1.5">
                    <div className="bg-[#C4634F] rounded-full h-1.5" style={{ width: `${Math.min((count / (allOrders?.length || 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-[#2D1F1A] w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">Top Selling Products</h2>
          <div className="space-y-3">
            {topSelling.length > 0 ? topSelling.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[#7A6A64] text-xs w-4">{i + 1}.</span>
                {p.img && (
                  <img src={p.img} alt="" className="w-9 h-9 rounded-lg object-cover bg-[#F5EDE5]" />
                )}
                <span className="text-sm text-[#2D1F1A] flex-1 truncate">{p.name}</span>
                <span className="text-xs font-bold text-[#C4634F]">{p.qty} sold</span>
              </div>
            )) : (
              <p className="text-sm text-[#7A6A64]">No order data yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-4 md:p-5">
        <h2 className="font-semibold text-[#2D1F1A] mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {['Order', 'Customer', 'Amount', 'Status', 'Date'].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-[#7A6A64] uppercase pb-2">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5EDE5]">
            {(recentOrders || []).map(o => (
              <tr key={o.id}>
                <td className="py-3">
                  <a href={`/admin/orders/${o.id}`} className="text-sm font-mono text-[#C4634F] hover:underline">
                    #{o.id.slice(-8).toUpperCase()}
                  </a>
                </td>
                <td className="py-3 text-sm text-[#2D1F1A]">{(Array.isArray(o.profiles) ? o.profiles[0] : o.profiles)?.full_name || '—'}</td>
                <td className="py-3 text-sm font-semibold text-[#2D1F1A]">{formatMoney(o.total_amount)}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${ORDER_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-3 text-xs text-[#7A6A64]">
                  {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
