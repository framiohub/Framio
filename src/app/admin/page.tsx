import { createClient } from '@supabase/supabase-js';
import { getAdminOrRedirect } from '@/lib/admin-auth';
import {
  Package, TrendingUp, ShoppingBag, Users, ArrowUpRight,
  Clock, CheckCircle, Truck, XCircle, Plus, Tag, Archive,
} from 'lucide-react';
import Link from 'next/link';

export const runtime = 'nodejs';

function formatMoney(paise: number) {
  if (paise >= 100000) return `₹${(paise / 100000).toFixed(1)}L`;
  if (paise >= 1000)   return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return `₹${(paise / 100).toFixed(0)}`;
}

async function getDashboardData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today          = new Date();
  const startOfToday   = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const startOfMonth   = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();

  const [
    { count: totalOrders },
    { data: revenueData },
    { data: monthRevData },
    { data: lastMonthRevData },
    { count: totalProducts },
    { count: totalCustomers },
    { count: pendingOrders },
    { count: todayOrders },
    { data: recentOrders },
    { data: statusBreakdown },
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', startOfMonth),
    supabase.from('orders').select('total_amount').eq('payment_status', 'paid').gte('created_at', startOfLastMonth).lt('created_at', startOfMonth),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfToday),
    supabase.from('orders')
      .select('id, status, total_amount, created_at, payment_status, shipping_address, profiles(full_name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('orders').select('status'),
  ]);

  const totalRevenue    = (revenueData     || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const monthRevenue    = (monthRevData    || []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const lastMonthRevenue= (lastMonthRevData|| []).reduce((s, o) => s + (o.total_amount || 0), 0);
  const revenueGrowth   = lastMonthRevenue > 0
    ? (((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  const statusMap: Record<string, number> = {};
  for (const o of statusBreakdown || []) {
    statusMap[o.status] = (statusMap[o.status] || 0) + 1;
  }

  return {
    totalOrders: totalOrders || 0,
    totalRevenue,
    monthRevenue,
    revenueGrowth,
    totalProducts: totalProducts || 0,
    totalCustomers: totalCustomers || 0,
    pendingOrders: pendingOrders || 0,
    todayOrders: todayOrders || 0,
    recentOrders: recentOrders || [],
    statusMap,
  };
}

const STATUS_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  confirmed: { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  printing:  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  packed:    { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  shipped:   { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  delivered: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-400' },
  returned:  { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
};

export default async function AdminDashboard() {
  await getAdminOrRedirect();
  const d = await getDashboardData();

  const statCards = [
    {
      label:    'Total Revenue',
      value:    formatMoney(d.totalRevenue),
      sub:      d.revenueGrowth
                  ? `${Number(d.revenueGrowth) >= 0 ? '+' : ''}${d.revenueGrowth}% vs last month`
                  : `${formatMoney(d.monthRevenue)} this month`,
      positive: !d.revenueGrowth || Number(d.revenueGrowth) >= 0,
      icon:     TrendingUp,
      accent:   '#10b981',  // emerald
      light:    '#f0fdf4',
    },
    {
      label:    'Total Orders',
      value:    d.totalOrders.toString(),
      sub:      `${d.todayOrders} new today`,
      positive: true,
      icon:     Package,
      accent:   '#C4634F',
      light:    '#fef3f0',
    },
    {
      label:    'Products',
      value:    d.totalProducts.toString(),
      sub:      'Active listings',
      positive: null,
      icon:     ShoppingBag,
      accent:   '#3b82f6',
      light:    '#eff6ff',
    },
    {
      label:    'Customers',
      value:    d.totalCustomers.toString(),
      sub:      'Registered users',
      positive: null,
      icon:     Users,
      accent:   '#8b5cf6',
      light:    '#f5f3ff',
    },
  ];

  const quickActions = [
    { href: '/admin/orders',      label: 'View Orders',  icon: Package,  color: 'bg-[#C4634F]' },
    { href: '/admin/products/new',label: 'Add Product',  icon: Plus,     color: 'bg-blue-500'  },
    { href: '/admin/coupons/new', label: 'New Coupon',   icon: Tag,      color: 'bg-amber-500' },
    { href: '/admin/inventory',   label: 'Inventory',    icon: Archive,  color: 'bg-purple-500'},
  ];

  const statusSummary = [
    { label: 'Pending',   count: d.statusMap['pending']   || 0, icon: Clock,         color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100' },
    { label: 'Shipped',   count: d.statusMap['shipped']   || 0, icon: Truck,         color: 'text-purple-600', bg: 'bg-purple-50',  border: 'border-purple-100' },
    { label: 'Delivered', count: d.statusMap['delivered'] || 0, icon: CheckCircle,   color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Cancelled', count: d.statusMap['cancelled'] || 0, icon: XCircle,       color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-100' },
  ];

  return (
    <div className="p-4 md:p-7 space-y-5 md:space-y-7 min-h-screen">

      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-[1.6rem] font-bold text-[#2D1F1A] tracking-tight leading-none">
            Dashboard
          </h1>
          <p className="text-[#7A6A64] text-sm mt-1.5">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>

        {d.pendingOrders > 0 && (
          <Link
            href="/admin/orders?status=pending"
            className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-amber-50 border border-amber-200
                       text-amber-700 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors flex-shrink-0"
          >
            <Clock size={14} />
            {d.pendingOrders} Pending{d.pendingOrders > 1 ? ' Orders' : ' Order'}
          </Link>
        )}
      </div>

      {/* ── Stat Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {statCards.map(card => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-[#E8DDD6] p-5 flex flex-col justify-between gap-4"
          >
            {/* Top row: label + icon */}
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-[#7A6A64]">{card.label}</p>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: card.light }}
              >
                <card.icon size={16} style={{ color: card.accent }} />
              </div>
            </div>

            {/* Value */}
            <div>
              <p className="text-2xl md:text-3xl font-bold text-[#2D1F1A] leading-none tracking-tight">
                {card.value}
              </p>
              <p
                className="text-xs font-medium mt-2"
                style={{
                  color: card.positive === null ? '#7A6A64'
                       : card.positive         ? '#10b981'
                       :                         '#ef4444',
                }}
              >
                {card.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Recent Orders — full width on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD6]">
            <div>
              <h2 className="font-bold text-[#2D1F1A]">Recent Orders</h2>
              <p className="text-xs text-[#7A6A64] mt-0.5">Latest activity across the store</p>
            </div>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#C4634F]
                         hover:text-[#a8523f] transition-colors"
            >
              View All <ArrowUpRight size={13} />
            </Link>
          </div>

          {d.recentOrders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F5EDE5] flex items-center justify-center mx-auto mb-4">
                <Package size={22} className="text-[#C4634F] opacity-50" />
              </div>
              <p className="font-semibold text-sm text-[#2D1F1A]">No orders yet</p>
              <p className="text-xs text-[#7A6A64] mt-1">
                Orders will appear here once customers start buying
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F5EDE5]">
                    {['Order ID', 'Customer', 'Amount', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[11px] font-semibold
                                   text-[#7A6A64] uppercase tracking-wider bg-[#FAFAF9]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.recentOrders.map((order, i) => {
                    const style = STATUS_STYLE[order.status] || {
                      bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400',
                    };
                    const customer =
                      Array.isArray(order.profiles)
                        ? order.profiles[0]?.full_name
                        : (order.profiles as { full_name?: string } | null)?.full_name;

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-[#F5EDE5] hover:bg-[#FDFAF8] transition-colors
                                    ${i === d.recentOrders.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <p className="font-mono text-xs font-bold text-[#2D1F1A]">
                            #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-[#7A6A64] mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short',
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#2D1F1A]">
                            {customer || order.shipping_address?.name || '—'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-[#2D1F1A]">
                            {formatMoney(order.total_amount || 0)}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                                        text-[11px] font-semibold capitalize ${style.bg} ${style.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-xs font-semibold text-[#C4634F] hover:underline"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Right sidebar — 1/3 ────────────────────────────── */}
        <div className="space-y-4">

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8DDD6]">
              <h2 className="font-bold text-[#2D1F1A]">Quick Actions</h2>
            </div>
            <div className="p-2">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl
                             hover:bg-[#F5EDE5] transition-colors group"
                >
                  <div className={`w-8 h-8 ${action.color} rounded-xl flex items-center
                                  justify-center flex-shrink-0`}>
                    <action.icon size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium text-[#2D1F1A] flex-1">{action.label}</span>
                  <ArrowUpRight size={13} className="text-[#7A6A64] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8DDD6]">
              <h2 className="font-bold text-[#2D1F1A]">Order Status</h2>
            </div>
            <div className="p-5">
              {Object.keys(d.statusMap).length === 0 ? (
                <p className="text-sm text-[#7A6A64] text-center py-3">No orders yet</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(d.statusMap)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const style = STATUS_STYLE[status] || {
                        bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400',
                      };
                      const pct = Math.round((count / d.totalOrders) * 100);
                      return (
                        <div key={status}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
                              <span className="text-xs font-medium text-[#2D1F1A] capitalize">
                                {status}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-[#2D1F1A]">
                              {count}
                              <span className="text-[#7A6A64] font-normal ml-1">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-[#F5EDE5] rounded-full h-1.5">
                            <div
                              className={`${style.dot} rounded-full h-1.5 transition-all`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Status summary pills */}
          <div className="grid grid-cols-2 gap-3">
            {statusSummary.map(s => (
              <div
                key={s.label}
                className={`${s.bg} ${s.border} border rounded-2xl p-4 flex flex-col gap-1`}
              >
                <s.icon size={15} className={s.color} />
                <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.count}</p>
                <p className="text-[11px] text-[#7A6A64] font-medium">{s.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
