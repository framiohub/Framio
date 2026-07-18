'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Users, Search, X, ChevronRight, RefreshCw,
  Trash2, UserCheck, UserX, Mail, Phone, MapPin,
  ShoppingBag, Calendar, Clock, Shield, ExternalLink,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  provider: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_active: boolean;
  totalOrders: number;
  totalSpent: number;
}

interface CustomerDetail extends Customer {
  addresses: { label?: string; line1: string; city: string; state: string; pincode: string }[];
  orders: {
    id: string;
    status: string;
    total_amount: number;
    created_at: string;
  }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function initials(name: string | null, email: string | null) {
  const src = name || email || '?';
  return src.slice(0, 2).toUpperCase();
}

const PROVIDER_LABEL: Record<string, string> = {
  google: 'Google',
  email: 'Email',
  phone: 'Phone',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  processing: 'bg-amber-100 text-amber-700',
  printing:   'bg-blue-100 text-blue-700',
  packed:     'bg-purple-100 text-purple-700',
  shipped:    'bg-sky-100 text-sky-700',
  delivered:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-red-100 text-red-700',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, email, size = 36 }: {
  src?: string | null; name?: string | null; email?: string | null; size?: number;
}) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return (
      <div style={{ width: size, height: size }} className="rounded-full overflow-hidden flex-shrink-0 bg-[#C4634F]/10">
        <Image src={src} alt={name || 'avatar'} width={size} height={size}
          className="object-cover w-full h-full" onError={() => setErr(true)} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full flex-shrink-0 bg-[#C4634F]/20 flex items-center justify-center font-bold text-[#C4634F]">
      {initials(name ?? null, email ?? null)}
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  customerId, onClose, onToggleActive, onDelete,
}: {
  customerId: string;
  onClose: () => void;
  onToggleActive: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/customers/${customerId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [customerId]);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DDD6]">
          <span className="font-bold text-[#2D1F1A] text-sm">Customer Profile</span>
          <button onClick={onClose} className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors">
            <X size={16} className="text-[#7A6A64]" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw size={20} className="text-[#C4634F] animate-spin" />
          </div>
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-[#7A6A64] text-sm">
            Failed to load customer.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Profile header */}
            <div className="px-5 py-6 border-b border-[#F5EDE5]">
              <div className="flex items-start gap-4">
                <Avatar src={data.avatar_url} name={data.full_name} email={data.email} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2D1F1A] text-base truncate">{data.full_name || '(No name)'}</p>
                  <p className="text-[#7A6A64] text-sm truncate">{data.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      data.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {data.is_active ? <UserCheck size={10} /> : <UserX size={10} />}
                      {data.is_active ? 'Active' : 'Deactivated'}
                    </span>
                    {data.provider && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F5EDE5] text-[#7A6A64]">
                        <Shield size={10} />
                        {PROVIDER_LABEL[data.provider] ?? data.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#F5EDE5] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#7A6A64]">Total Orders</p>
                  <p className="text-xl font-bold text-[#2D1F1A]">{data.totalOrders}</p>
                </div>
                <div className="bg-[#F5EDE5] rounded-xl px-4 py-3">
                  <p className="text-xs text-[#7A6A64]">Total Spent</p>
                  <p className="text-xl font-bold text-[#C4634F]">{formatRupees(data.totalSpent)}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="px-5 py-4 border-b border-[#F5EDE5] space-y-3">
              <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Contact</p>
              <div className="flex items-center gap-3 text-sm text-[#2D1F1A]">
                <Mail size={14} className="text-[#C4634F] flex-shrink-0" />
                <span className="truncate">{data.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#2D1F1A]">
                <Phone size={14} className="text-[#C4634F] flex-shrink-0" />
                <span>{data.phone || '—'}</span>
              </div>
              {(data.addresses ?? []).length > 0 && (
                <div className="flex items-start gap-3 text-sm text-[#2D1F1A]">
                  <MapPin size={14} className="text-[#C4634F] flex-shrink-0 mt-0.5" />
                  <span>
                    {data.addresses[0].line1}, {data.addresses[0].city}, {data.addresses[0].state} – {data.addresses[0].pincode}
                  </span>
                </div>
              )}
            </div>

            {/* Activity */}
            <div className="px-5 py-4 border-b border-[#F5EDE5] space-y-3">
              <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Activity</p>
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-[#C4634F] flex-shrink-0" />
                <span className="text-[#7A6A64]">Signed up</span>
                <span className="ml-auto text-[#2D1F1A] text-xs">{formatDate(data.created_at)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={14} className="text-[#C4634F] flex-shrink-0" />
                <span className="text-[#7A6A64]">Last login</span>
                <span className="ml-auto text-[#2D1F1A] text-xs text-right">{formatTime(data.last_sign_in_at)}</span>
              </div>
            </div>

            {/* Orders */}
            {data.orders.length > 0 && (
              <div className="px-5 py-4 border-b border-[#F5EDE5]">
                <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-3">Recent Orders</p>
                <div className="space-y-2">
                  {data.orders.slice(0, 5).map(o => (
                    <div key={o.id} className="flex items-center gap-3 bg-[#F5EDE5] rounded-xl px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-[#7A6A64] truncate">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-[#2D1F1A]">{formatDate(o.created_at)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                        ORDER_STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-600'
                      }`}>
                        {o.status}
                      </span>
                      <span className="text-sm font-bold text-[#2D1F1A] flex-shrink-0">
                        {formatRupees(o.total_amount ?? 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-3">Actions</p>
              <button
                onClick={() => { onToggleActive(data.id, !data.is_active); onClose(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8DDD6] text-sm font-medium text-[#2D1F1A] hover:bg-[#F5EDE5] transition-colors"
              >
                {data.is_active
                  ? <><UserX size={14} className="text-amber-500" /> Deactivate Account</>
                  : <><UserCheck size={14} className="text-emerald-500" /> Activate Account</>}
              </button>
              <a href={`mailto:${data.email}`}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8DDD6] text-sm font-medium text-[#2D1F1A] hover:bg-[#F5EDE5] transition-colors">
                <ExternalLink size={14} className="text-[#C4634F]" /> Send Email
              </a>
              <button
                onClick={() => {
                  if (confirm(`Delete ${data.full_name || data.email}? This cannot be undone.`)) {
                    onDelete(data.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
              >
                <Trash2 size={14} /> Delete Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCustomersPage() {
  const [customers,    setCustomers]    = useState<Customer[]>([]);
  const [total,        setTotal]        = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,         setPage]         = useState(1);
  const [selected,     setSelected]     = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((q: string, s: string, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (q) params.set('search', q);
    if (s) params.set('status', s);
    fetch(`/api/admin/customers?${params}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.customers ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(search, statusFilter, page); }, [page, statusFilter, load]);

  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { setPage(1); load(v, statusFilter, 1); }, 350);
  };

  const handleToggleActive = (id: string, active: boolean) => {
    fetch(`/api/admin/customers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    }).then(() => load(search, statusFilter, page));
  };

  const handleDelete = (id: string) => {
    fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
      .then(() => { setSelected(null); load(search, statusFilter, page); });
  };

  const totalPages  = Math.ceil(total / 50);
  const activeCount = customers.filter(c => c.is_active).length;
  const googleCount = customers.filter(c => c.provider === 'google').length;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-[#FDF8F4]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Customers</h1>
          <p className="text-[#7A6A64] text-sm mt-0.5">{total} total customers</p>
        </div>
        <button onClick={() => load(search, statusFilter, page)}
          className="flex items-center gap-2 h-9 px-3 rounded-xl border border-[#E8DDD6] bg-white text-sm text-[#7A6A64] hover:text-[#2D1F1A] transition-colors">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',   value: total,        icon: <Users size={16} />,       color: 'text-[#C4634F]' },
          { label: 'Active',  value: activeCount,   icon: <UserCheck size={16} />,   color: 'text-emerald-600' },
          { label: 'Google',  value: googleCount,   icon: <Shield size={16} />,      color: 'text-blue-600' },
          { label: 'Pages',   value: totalPages || 1, icon: <ShoppingBag size={16} />, color: 'text-[#C9A84C]' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E8DDD6] px-4 py-3 flex items-center gap-3">
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-lg font-bold text-[#2D1F1A]">{s.value}</p>
              <p className="text-xs text-[#7A6A64]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64]" />
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search name or email…"
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#E8DDD6] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#C4634F]/30"
          />
          {search && (
            <button onClick={() => { setSearch(''); setPage(1); load('', statusFilter, 1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A6A64] hover:text-[#2D1F1A]">
              <X size={13} />
            </button>
          )}
        </div>
        {(['', 'active', 'inactive'] as const).map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); load(search, s, 1); }}
            className={`h-10 px-4 rounded-xl text-sm font-medium border transition-colors ${
              statusFilter === s
                ? 'bg-[#C4634F] text-white border-[#C4634F]'
                : 'bg-white text-[#7A6A64] border-[#E8DDD6] hover:border-[#C4634F]'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5EDE5]">
                {['Customer', 'Contact', 'Provider', 'Joined', 'Last Login', 'Orders', 'Spent', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#7A6A64] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDE5]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <RefreshCw size={20} className="mx-auto text-[#C4634F] animate-spin mb-2" />
                    <p className="text-sm text-[#7A6A64]">Loading customers…</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Users size={32} className="mx-auto mb-3 text-[#E8DDD6]" />
                    <p className="text-sm text-[#7A6A64]">No customers found.</p>
                  </td>
                </tr>
              ) : customers.map(c => (
                <tr key={c.id}
                  className="hover:bg-[#FDF8F4] cursor-pointer transition-colors"
                  onClick={() => setSelected(c.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={c.avatar_url} name={c.full_name} email={c.email} size={34} />
                      <span className="font-medium text-sm text-[#2D1F1A] whitespace-nowrap">
                        {c.full_name || <span className="text-[#7A6A64] italic text-xs">No name</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#7A6A64] max-w-[180px]">
                    <p className="truncate">{c.email || '—'}</p>
                    {c.phone && <p className="text-xs">{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#F5EDE5] text-[#7A6A64] capitalize">
                      <Shield size={9} />
                      {PROVIDER_LABEL[c.provider ?? ''] ?? c.provider ?? 'Email'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7A6A64] whitespace-nowrap">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7A6A64] whitespace-nowrap">
                    {formatDate(c.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#2D1F1A] text-center">
                    {c.totalOrders}
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-[#2D1F1A] whitespace-nowrap">
                    {formatRupees(c.totalSpent)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {c.is_active ? <UserCheck size={9} /> : <UserX size={9} />}
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelected(c.id)}
                        className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors text-[#7A6A64] hover:text-[#2D1F1A]"
                        title="View profile">
                        <ChevronRight size={14} />
                      </button>
                      <button
                        onClick={() => handleToggleActive(c.id, !c.is_active)}
                        className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors"
                        title={c.is_active ? 'Deactivate' : 'Activate'}>
                        {c.is_active
                          ? <UserX size={14} className="text-amber-500" />
                          : <UserCheck size={14} className="text-emerald-500" />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${c.full_name || c.email}? This cannot be undone.`))
                            handleDelete(c.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400 hover:text-red-600"
                        title="Delete customer">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F5EDE5]">
            <p className="text-xs text-[#7A6A64]">Page {page} of {totalPages} · {total} customers</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="h-8 px-3 text-xs rounded-lg border border-[#E8DDD6] disabled:opacity-40 hover:bg-[#F5EDE5] transition-colors">
                Previous
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="h-8 px-3 text-xs rounded-lg border border-[#E8DDD6] disabled:opacity-40 hover:bg-[#F5EDE5] transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <DetailPanel
          customerId={selected}
          onClose={() => setSelected(null)}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
