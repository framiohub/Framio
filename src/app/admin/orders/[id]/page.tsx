'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, ImageIcon, Truck, FileText,
  RotateCcw, X, CheckCircle, ExternalLink, Download,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

const ORDER_STATUSES = ['pending', 'confirmed', 'printing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'];

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  printing: 'bg-cyan-100 text-cyan-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
  returned: 'bg-orange-100 text-orange-700',
};

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  size?: string;
  material?: string;
  custom_text?: { text: string; font: string; color: string } | null;
  preview_url?: string | null;
  custom_photo_url?: string | null;
}

interface ReturnRequest {
  id: string;
  reason: string;
  status: string;
  created_at: string;
}

interface AdminOrder {
  id: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  shipping_fee?: number;
  discount_amount?: number;
  payment_status: string;
  razorpay_payment_id?: string | null;
  coupon_code?: string | null;
  guest_email?: string | null;
  courier_name?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  refund_reason?: string | null;
  created_at: string;
  shipping_address: {
    name: string; phone: string;
    line1: string; line2?: string;
    city: string; state: string; pincode: string;
  };
  order_items: OrderItem[];
  return_requests?: ReturnRequest[];
  profiles?: { full_name?: string; email?: string } | null;
}

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [courier, setCourier] = useState({ name: '', tracking: '', url: '' });
  const [showCourier, setShowCourier] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [printPreview, setPrintPreview] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (res.ok) {
      const data = await res.json();
      setOrder(data);
      setNewStatus(data.status || 'pending');
      setCourier({ name: data.courier_name || '', tracking: data.tracking_number || '', url: data.tracking_url || '' });
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patch = async (updates: Record<string, unknown>, successMsg: string) => {
    setSaving(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Failed to update'); return; }
    toast.success(successMsg);
    load();
  };

  const updateStatus = () => patch({ status: newStatus }, 'Status updated');

  const saveCourier = () => {
    patch({
      courier_name: courier.name,
      tracking_number: courier.tracking,
      tracking_url: courier.url,
      status: 'shipped',
    }, 'Courier details saved & marked Shipped');
    setShowCourier(false);
  };

  const processRefund = () => {
    if (!refundReason.trim()) { toast.error('Enter a refund reason'); return; }
    patch({ refund_reason: refundReason, status: 'cancelled', payment_status: 'refunded' }, 'Refund processed');
    setShowRefund(false);
  };

  const printInvoice = () => {
    if (!order) return;
    const addr = order.shipping_address;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice #${order.id.slice(-8).toUpperCase()}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
  h1 { color: #C4634F; margin-bottom: 4px; }
  .meta { color: #888; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { background: #F5EDE5; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #f0e9e4; font-size: 13px; }
  .total { font-weight: bold; font-size: 16px; color: #C4634F; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .box h3 { font-size: 12px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .box p { margin: 2px 0; font-size: 13px; }
</style></head><body>
<h1>Framio — Invoice</h1>
<p class="meta">Order #${order.id.slice(-8).toUpperCase()} &nbsp;|&nbsp; ${new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
<div class="grid">
  <div class="box"><h3>Billing / Shipping</h3>
    <p><strong>${addr?.name}</strong></p>
    <p>${addr?.line1}${addr?.line2 ? ', ' + addr.line2 : ''}</p>
    <p>${addr?.city}, ${addr?.state} - ${addr?.pincode}</p>
    <p>📞 ${addr?.phone}</p>
  </div>
  <div class="box"><h3>Payment</h3>
    <p>Status: <strong>${order.payment_status}</strong></p>
    ${order.razorpay_payment_id ? `<p>Ref: ${order.razorpay_payment_id}</p>` : ''}
    ${order.coupon_code ? `<p>Coupon: ${order.coupon_code}</p>` : ''}
  </div>
</div>
<table>
  <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr></thead>
  <tbody>
    ${order.order_items.map(i => `<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>₹${(i.unit_price / 100).toFixed(2)}</td><td>₹${((i.unit_price * i.quantity) / 100).toFixed(2)}</td></tr>`).join('')}
  </tbody>
</table>
<table>
  <tr><td>Subtotal</td><td>₹${((order.subtotal || order.total_amount) / 100).toFixed(2)}</td></tr>
  <tr><td>Shipping</td><td>${(order.shipping_fee || 0) === 0 ? 'FREE' : '₹' + ((order.shipping_fee || 0) / 100).toFixed(2)}</td></tr>
  ${(order.discount_amount || 0) > 0 ? `<tr><td>Discount</td><td>-₹${((order.discount_amount || 0) / 100).toFixed(2)}</td></tr>` : ''}
  <tr class="total"><td>Total</td><td>₹${(order.total_amount / 100).toFixed(2)}</td></tr>
</table>
<p style="color:#888;font-size:11px;margin-top:32px;">Framio — framio.shop | hello@framio.shop</p>
</body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-[#C4634F]" />
    </div>
  );
  if (!order) return <div className="p-6 text-[#7A6A64]">Order not found</div>;

  const addr = order.shipping_address;

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <Link href="/admin/orders" className="flex items-center gap-2 text-sm text-[#7A6A64] hover:text-[#2D1F1A] mb-5">
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[#2D1F1A]">Order #{order.id.slice(-8).toUpperCase()}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {order.status}
            </span>
          </div>
          <p className="text-sm text-[#7A6A64] mt-1">{new Date(order.created_at).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="flex-1 sm:flex-none h-9 px-3 rounded-xl border border-[#E8DDD6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4634F] capitalize bg-white">
              {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <button onClick={updateStatus} disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#C4634F] hover:bg-[#a8513f] text-white rounded-xl text-sm font-medium disabled:opacity-60 flex-shrink-0">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Update
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCourier(true)}
              className="flex items-center gap-1.5 h-9 px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium">
              <Truck size={12} /> Courier
            </button>
            <button onClick={printInvoice}
              className="flex items-center gap-1.5 h-9 px-4 bg-[#F5EDE5] text-[#7A6A64] hover:bg-[#E8DDD6] rounded-xl text-sm font-medium">
              <FileText size={12} /> Invoice
            </button>
            {order.payment_status === 'paid' && order.status !== 'cancelled' && (
              <button onClick={() => setShowRefund(true)}
                className="flex items-center gap-1.5 h-9 px-4 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium">
                <RotateCcw size={12} /> Refund
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Courier tracking bar */}
      {order.courier_name && (
        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
          <Truck size={16} className="text-blue-600" />
          <div className="flex-1">
            <span className="font-semibold text-blue-800 text-sm">{order.courier_name}</span>
            {order.tracking_number && <span className="text-blue-700 text-sm ml-2 font-mono">#{order.tracking_number}</span>}
          </div>
          {order.tracking_url && (
            <a href={order.tracking_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              Track <ExternalLink size={10} />
            </a>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Items */}
        <div className="md:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8DDD6] font-bold text-[#2D1F1A]">Order Items</div>
            <div className="divide-y divide-[#F5EDE5]">
              {order.order_items.map(item => (
                <div key={item.id} className="p-5 flex gap-4">
                  <div
                    className="w-16 h-16 rounded-xl bg-[#F5EDE5] overflow-hidden flex-shrink-0 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#C4634F] transition-all"
                    onClick={() => item.preview_url && setPrintPreview(item.preview_url)}
                  >
                    {item.preview_url || item.custom_photo_url ? (
                      <img src={String(item.preview_url || item.custom_photo_url)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-[#7A6A64]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#2D1F1A] text-sm">{item.product_name}</p>
                    <p className="text-xs text-[#7A6A64]">{[item.size, item.material].filter(Boolean).join(' · ')} · Qty {item.quantity}</p>
                    {item.custom_text?.text && (
                      <p className="text-xs text-[#7A6A64] italic mt-1">&ldquo;{item.custom_text.text}&rdquo;</p>
                    )}
                    <div className="flex gap-3 mt-1.5">
                      {item.preview_url && (
                        <button onClick={() => setPrintPreview(item.preview_url!)}
                          className="text-xs text-[#C4634F] hover:underline flex items-center gap-1">
                          Preview Design
                        </button>
                      )}
                      {item.custom_photo_url && (
                        <a href={item.custom_photo_url} download target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <Download size={10} /> Print File
                        </a>
                      )}
                    </div>
                  </div>
                  <p className="font-bold text-[#C4634F] text-sm flex-shrink-0">{formatPrice(item.unit_price * item.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="px-5 py-4 border-t border-[#E8DDD6] space-y-2">
              <div className="flex justify-between text-sm text-[#7A6A64]">
                <span>Subtotal</span><span>{formatPrice(order.subtotal || order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#7A6A64]">
                <span>Shipping</span>
                <span className={(order.shipping_fee || 0) === 0 ? 'text-emerald-600' : ''}>
                  {(order.shipping_fee || 0) === 0 ? 'FREE' : formatPrice(order.shipping_fee || 0)}
                </span>
              </div>
              {(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span>-{formatPrice(order.discount_amount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-[#2D1F1A] border-t border-[#E8DDD6] pt-2">
                <span>Total</span><span className="text-[#C4634F]">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Return Requests */}
          {(order.return_requests || []).length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8DDD6] font-bold text-[#2D1F1A] flex items-center gap-2">
                <RotateCcw size={15} /> Return Requests
              </div>
              <div className="divide-y divide-[#F5EDE5]">
                {order.return_requests!.map(r => (
                  <div key={r.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-[#2D1F1A]">{r.reason}</p>
                      <p className="text-xs text-[#7A6A64] mt-1">{new Date(r.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${
                      r.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                      r.status === 'refunded' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-bold text-[#2D1F1A] mb-3 text-sm">Customer</h3>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-[#C4634F]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#C4634F] font-bold text-sm">{(addr?.name || '?')[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-[#2D1F1A] text-sm">{addr?.name || order.profiles?.full_name}</p>
                {order.guest_email && <p className="text-xs text-[#7A6A64]">{order.guest_email}</p>}
              </div>
            </div>
            <p className="text-sm text-[#7A6A64]">📞 {addr?.phone}</p>
            <div className="mt-3 pt-3 border-t border-[#F5EDE5] text-sm text-[#7A6A64]">
              <p>{addr?.line1}</p>
              {addr?.line2 && <p>{addr.line2}</p>}
              <p>{addr?.city}, {addr?.state} - {addr?.pincode}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-bold text-[#2D1F1A] mb-3 text-sm">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#7A6A64]">Status</span>
                <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-emerald-600' : order.payment_status === 'refunded' ? 'text-blue-600' : 'text-amber-600'}`}>
                  {order.payment_status}
                </span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between">
                  <span className="text-[#7A6A64]">Razorpay ID</span>
                  <span className="font-mono text-xs text-[#2D1F1A]">{order.razorpay_payment_id.slice(-12)}</span>
                </div>
              )}
              {order.refund_reason && (
                <div className="pt-2 border-t border-[#F5EDE5]">
                  <p className="text-xs text-[#7A6A64] font-medium">Refund Reason</p>
                  <p className="text-xs text-[#2D1F1A] mt-0.5">{order.refund_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courier Modal */}
      {showCourier && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#2D1F1A]">Assign Courier</h2>
              <button onClick={() => setShowCourier(false)}><X size={18} className="text-[#7A6A64]" /></button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Courier Name', key: 'name', placeholder: 'Delhivery, BlueDart, Xpressbees…' },
                { label: 'Tracking Number', key: 'tracking', placeholder: 'AWB / Tracking ID' },
                { label: 'Tracking URL', key: 'url', placeholder: 'https://track.delhivery.com/…' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-[#2D1F1A] mb-1">{f.label}</label>
                  <input
                    value={courier[f.key as keyof typeof courier]}
                    onChange={e => setCourier(c => ({ ...c, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full h-10 px-3 rounded-xl border border-[#E8DDD6] text-sm focus:outline-none focus:ring-2 focus:ring-[#C4634F]"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={saveCourier}
                className="flex-1 bg-[#C4634F] hover:bg-[#a8513f] text-white py-2.5 rounded-xl text-sm font-medium">
                Save & Mark Shipped
              </button>
              <button onClick={() => setShowCourier(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8DDD6] text-sm text-[#7A6A64]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefund && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#2D1F1A]">Process Refund</h2>
              <button onClick={() => setShowRefund(false)}><X size={18} className="text-[#7A6A64]" /></button>
            </div>
            <p className="text-sm text-[#7A6A64] mb-4">
              This will mark the order as Cancelled and payment as Refunded. Process the actual refund via Razorpay dashboard.
            </p>
            <div>
              <label className="block text-sm font-medium text-[#2D1F1A] mb-1.5">Refund Reason *</label>
              <textarea value={refundReason} onChange={e => setRefundReason(e.target.value)} rows={3}
                placeholder="Customer requested refund, product damaged…"
                className="w-full px-3 py-2 rounded-xl border border-[#E8DDD6] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C4634F]" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={processRefund}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium">
                Confirm Refund
              </button>
              <button onClick={() => setShowRefund(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E8DDD6] text-sm text-[#7A6A64]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printPreview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPrintPreview(null)}>
          <div className="relative max-w-2xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPrintPreview(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <X size={16} />
            </button>
            <img src={printPreview} alt="Design Preview" className="rounded-2xl max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
