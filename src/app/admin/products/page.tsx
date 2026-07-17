'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Filter, Package, Star, Eye, Edit, Trash2,
  Copy, MoreVertical, ChevronDown, X, Check, Loader2,
  LayoutGrid, LayoutList, ShoppingBag, Tag, Globe,
  Archive, AlertCircle, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  status: 'draft' | 'published' | 'archived';
  badge: string | null;
  type: string;
  photo_slots: number;
  rating: number;
  review_count: number;
  featured: boolean;
  is_active: boolean;
  images: string[];
  stock_quantity: number;
  created_at: string;
  product_categories: { id: string; name: string } | null;
  product_collections: { id: string; name: string } | null;
}

interface Category { id: string; name: string }
interface Collection { id: string; name: string }

const STATUS_TABS = [
  { value: '',          label: 'All',       icon: Package },
  { value: 'published', label: 'Published', icon: Globe },
  { value: 'draft',     label: 'Draft',     icon: Edit },
  { value: 'archived',  label: 'Archived',  icon: Archive },
];

const statusStyle: Record<string, string> = {
  published: 'bg-emerald-100 text-emerald-700',
  draft:     'bg-yellow-100 text-yellow-700',
  archived:  'bg-gray-100 text-gray-500',
};

function ActionMenu({ product, onDelete, onDuplicate, onToggleStatus }:
  { product: Product; onDelete: () => void; onDuplicate: () => void; onToggleStatus: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const MENU_HEIGHT = 240;
      const showAbove = window.innerHeight - rect.bottom < MENU_HEIGHT + 8;
      setMenuPos({
        top:   showAbove ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(v => !v);
  };

  return (
    <div>
      <button ref={btnRef} onClick={handleOpen} className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors">
        <MoreVertical size={14} className="text-[#7A6A64]" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className="fixed z-40 w-44 bg-white rounded-xl shadow-lg border border-[#E8DDD6] py-1"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            <Link href={`/admin/products/${product.id}/edit`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#2D1F1A] hover:bg-[#F5EDE5] transition-colors">
              <Edit size={13} /> Edit
            </Link>
            <button onClick={() => { onDuplicate(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2D1F1A] hover:bg-[#F5EDE5] transition-colors">
              <Copy size={13} /> Duplicate
            </button>
            <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#2D1F1A] hover:bg-[#F5EDE5] transition-colors">
              <Eye size={13} /> Preview
            </a>
            <hr className="border-[#F5EDE5] my-1" />
            {product.status !== 'published' && (
              <button onClick={() => { onToggleStatus('published'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors">
                <Globe size={13} /> Publish
              </button>
            )}
            {product.status !== 'draft' && (
              <button onClick={() => { onToggleStatus('draft'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors">
                <Edit size={13} /> Move to Draft
              </button>
            )}
            {product.status !== 'archived' && (
              <button onClick={() => { onToggleStatus('archived'); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <Archive size={13} /> Archive
              </button>
            )}
            <hr className="border-[#F5EDE5] my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [collectionFilter, setCollectionFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter)     params.set('status', statusFilter);
    if (categoryFilter)   params.set('category', categoryFilter);
    if (collectionFilter) params.set('collection', collectionFilter);
    if (search)           params.set('search', search);
    const res = await fetch(`/api/admin/products?${params}`);
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, [statusFilter, categoryFilter, collectionFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/products/categories').then(r => r.json()),
      fetch('/api/admin/products/collections').then(r => r.json()),
    ]).then(([cats, cols]) => {
      setCategories(cats);
      setCollections(cols);
    });
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map(p => p.id)));
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      toast.error('Failed to delete');
    }
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (id: string) => {
    const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
    if (res.ok) {
      const { id: newId } = await res.json();
      toast.success('Product duplicated! Opening editor…');
      router.push(`/admin/products/${newId}/edit`);
    } else {
      toast.error('Failed to duplicate');
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Product ${status}`);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, status: status as any } : p));
    } else {
      toast.error('Failed to update status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    const res = await fetch('/api/admin/products/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: Array.from(selectedIds) }),
    });
    if (res.ok) {
      const { count } = await res.json();
      toast.success(`${count} product${count !== 1 ? 's' : ''} ${action}d`);
      setSelectedIds(new Set());
      fetchProducts();
    } else {
      toast.error('Bulk action failed');
    }
    setBulkLoading(false);
  };

  // Stats
  const stats = {
    total:     products.length,
    published: products.filter(p => p.status === 'published').length,
    draft:     products.filter(p => p.status === 'draft').length,
    featured:  products.filter(p => p.featured).length,
    lowStock:  products.filter(p => p.stock_quantity < 10).length,
  };

  const hasFilters = categoryFilter || collectionFilter;

  return (
    <div className="p-4 md:p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#2D1F1A]">Products</h1>
          <p className="text-sm text-[#7A6A64]">Manage your product catalog</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/admin/products/collections"
            className="px-3 py-2 text-xs font-medium border border-[#E8DDD6] bg-white text-[#7A6A64] rounded-xl hover:bg-[#F5EDE5] transition-colors">
            Collections
          </Link>
          <Link href="/admin/products/categories"
            className="px-3 py-2 text-xs font-medium border border-[#E8DDD6] bg-white text-[#7A6A64] rounded-xl hover:bg-[#F5EDE5] transition-colors">
            Categories
          </Link>
          <Link href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C4634F] text-white text-sm font-bold rounded-xl hover:bg-[#B5574A] transition-colors">
            <Plus size={15} /> New Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',     value: stats.total,     color: 'text-[#2D1F1A]',   icon: ShoppingBag },
          { label: 'Published', value: stats.published, color: 'text-emerald-600',  icon: Globe },
          { label: 'Draft',     value: stats.draft,     color: 'text-yellow-600',   icon: Edit },
          { label: 'Featured',  value: stats.featured,  color: 'text-[#C9A84C]',    icon: Star },
          { label: 'Low Stock', value: stats.lowStock,  color: 'text-red-500',      icon: AlertCircle },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-[#E8DDD6] p-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon size={13} className={stat.color} />
              <span className="text-xs text-[#7A6A64]">{stat.label}</span>
            </div>
            <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-[#E8DDD6] p-4 mb-4">
        <div className="flex gap-3 mb-3">
          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7A6A64]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E8DDD6] text-sm text-[#2D1F1A] placeholder:text-[#7A6A64] focus:outline-none focus:ring-2 focus:ring-[#C4634F]/30 focus:border-[#C4634F] transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
              showFilters || hasFilters
                ? 'bg-[#C4634F] text-white border-[#C4634F]'
                : 'border-[#E8DDD6] text-[#7A6A64] hover:bg-[#F5EDE5]')}>
            <Filter size={13} /> Filters {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
          <div className="flex border border-[#E8DDD6] rounded-xl overflow-hidden">
            <button onClick={() => setView('table')}
              className={cn('px-3 py-2 transition-colors', view === 'table' ? 'bg-[#F5EDE5] text-[#C4634F]' : 'text-[#7A6A64] hover:bg-[#F5EDE5]')}>
              <LayoutList size={14} />
            </button>
            <button onClick={() => setView('grid')}
              className={cn('px-3 py-2 transition-colors', view === 'grid' ? 'bg-[#F5EDE5] text-[#C4634F]' : 'text-[#7A6A64] hover:bg-[#F5EDE5]')}>
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1">
          {STATUS_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === t.value
                  ? 'bg-[#2D1F1A] text-white'
                  : 'text-[#7A6A64] hover:bg-[#F5EDE5]')}>
              <t.icon size={11} /> {t.label}
            </button>
          ))}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#F5EDE5]">
            <div>
              <label className="text-xs text-[#7A6A64] mb-1 block">Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DDD6] text-sm text-[#2D1F1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4634F]/30 focus:border-[#C4634F]">
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7A6A64] mb-1 block">Collection</label>
              <select value={collectionFilter} onChange={e => setCollectionFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E8DDD6] text-sm text-[#2D1F1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4634F]/30 focus:border-[#C4634F]">
                <option value="">All Collections</option>
                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {hasFilters && (
              <button onClick={() => { setCategoryFilter(''); setCollectionFilter(''); }}
                className="col-span-2 text-xs text-[#7A6A64] hover:text-[#C4634F] transition-colors text-left flex items-center gap-1">
                <X size={11} /> Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#2D1F1A] text-white rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="text-white/50 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
            {bulkLoading && <Loader2 size={14} className="animate-spin text-white/60 flex-shrink-0" />}
            <button onClick={() => handleBulkAction('publish')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Publish
            </button>
            <button onClick={() => handleBulkAction('unpublish')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Unpublish
            </button>
            <button onClick={() => handleBulkAction('archive')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Archive
            </button>
            <button onClick={() => handleBulkAction('feature')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-[#C9A84C] hover:bg-[#B8960A] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Feature
            </button>
            <button onClick={() => handleBulkAction('delete')} disabled={bulkLoading}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] py-20 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={28} className="animate-spin mx-auto mb-3 text-[#C4634F]" />
            <p className="text-sm text-[#7A6A64]">Loading products…</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] py-20 text-center">
          <ShoppingBag size={40} className="mx-auto mb-3 text-[#E8DDD6]" />
          <h3 className="font-semibold text-[#2D1F1A] mb-2">No products found</h3>
          <p className="text-sm text-[#7A6A64] mb-4">
            {search || hasFilters ? 'Try adjusting your search or filters' : 'Create your first product to get started'}
          </p>
          {!search && !hasFilters && (
            <Link href="/admin/products/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C4634F] text-white text-sm font-bold rounded-xl hover:bg-[#B5574A] transition-colors">
              <Plus size={15} /> Create Product
            </Link>
          )}
        </div>
      ) : view === 'table' ? (
        /* Table view */
        <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5EDE5] bg-[#FDF8F4]">
                <th className="p-4 w-10">
                  <input type="checkbox" checked={selectedIds.size === products.length && products.length > 0}
                    onChange={toggleAll} className="rounded border-[#E8DDD6] accent-[#C4634F]" />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Product</th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden lg:table-cell">Price</th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden lg:table-cell">Stock</th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden xl:table-cell">Category</th>
                <th className="p-4 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden xl:table-cell">Featured</th>
                <th className="p-4 w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDE5]">
              {products.map(product => (
                <tr key={product.id} className={cn('hover:bg-[#FDF8F4] transition-colors', selectedIds.has(product.id) && 'bg-[#FDF8F4]')}>
                  <td className="p-4">
                    <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)}
                      className="rounded border-[#E8DDD6] accent-[#C4634F]" />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-12 rounded-lg bg-[#F5EDE5] flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.images?.[0]
                          ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                          : <Package size={16} className="text-[#E8DDD6]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#2D1F1A] text-sm truncate">{product.name}</p>
                        <p className="text-xs text-[#7A6A64] font-mono truncate">{product.slug}</p>
                        {product.badge && (
                          <span className="inline-block text-[10px] bg-[#C4634F]/10 text-[#C4634F] px-1.5 py-0.5 rounded-full font-medium mt-0.5">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusStyle[product.status])}>
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <p className="font-semibold text-[#2D1F1A] text-sm">{formatPrice(product.base_price)}</p>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <span className={cn('text-xs font-medium', product.stock_quantity < 10 ? 'text-red-500' : 'text-[#7A6A64]')}>
                      {product.stock_quantity} units
                    </span>
                  </td>
                  <td className="p-4 hidden xl:table-cell">
                    <span className="text-xs text-[#7A6A64]">
                      {(product.product_categories as any)?.name ?? '—'}
                    </span>
                  </td>
                  <td className="p-4 hidden xl:table-cell">
                    {product.featured
                      ? <span className="flex items-center gap-1 text-xs text-[#C9A84C] font-medium"><Star size={11} fill="currentColor" /> Yes</span>
                      : <span className="text-xs text-[#E8DDD6]">—</span>}
                  </td>
                  <td className="p-4">
                    {deleteConfirm === product.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(product.id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                          <Check size={11} />
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="p-1 bg-[#F5EDE5] text-[#7A6A64] rounded hover:bg-[#E8DDD6] transition-colors">
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <ActionMenu
                        product={product}
                        onDelete={() => setDeleteConfirm(product.id)}
                        onDuplicate={() => handleDuplicate(product.id)}
                        onToggleStatus={(s) => handleStatusChange(product.id, s)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#F5EDE5] flex items-center justify-between">
            <p className="text-xs text-[#7A6A64]">{products.length} product{products.length !== 1 ? 's' : ''}</p>
            {selectedIds.size > 0 && (
              <p className="text-xs text-[#C4634F] font-medium">{selectedIds.size} selected</p>
            )}
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => (
            <div key={product.id} className={cn(
              'bg-white rounded-2xl border-2 overflow-hidden hover:shadow-md transition-all',
              selectedIds.has(product.id) ? 'border-[#C4634F]' : 'border-[#E8DDD6]'
            )}>
              <div className="h-40 bg-[#F5EDE5] flex items-center justify-center relative cursor-pointer"
                onClick={() => toggleSelect(product.id)}>
                {product.images?.[0]
                  ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  : <Package size={28} className="text-[#E8DDD6]" />}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <input type="checkbox" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)}
                    onClick={e => e.stopPropagation()} className="rounded border-[#E8DDD6] accent-[#C4634F]" />
                  {product.badge && (
                    <span className="text-[10px] bg-[#C4634F] text-white px-1.5 py-0.5 rounded-full font-medium">
                      {product.badge}
                    </span>
                  )}
                </div>
                <span className={cn('absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium', statusStyle[product.status])}>
                  {product.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#2D1F1A] text-sm mb-1 truncate">{product.name}</h3>
                <div className="flex items-center gap-1 mb-2">
                  <Star size={11} className="fill-[#C9A84C] text-[#C9A84C]" />
                  <span className="text-xs text-[#7A6A64]">{product.rating?.toFixed(1)} ({product.review_count})</span>
                  {product.featured && <span className="ml-auto text-[10px] text-[#C9A84C] font-medium">Featured</span>}
                </div>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[#C4634F]">{formatPrice(product.base_price)}</p>
                  <span className={cn('text-xs', product.stock_quantity < 10 ? 'text-red-500 font-medium' : 'text-[#7A6A64]')}>
                    {product.stock_quantity} in stock
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F5EDE5]">
                  <Link href={`/admin/products/${product.id}/edit`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium border border-[#E8DDD6] rounded-lg hover:bg-[#F5EDE5] transition-colors text-[#7A6A64]">
                    <Edit size={11} /> Edit
                  </Link>
                  <button onClick={() => handleDuplicate(product.id)}
                    className="p-1.5 border border-[#E8DDD6] rounded-lg hover:bg-[#F5EDE5] transition-colors text-[#7A6A64]">
                    <Copy size={11} />
                  </button>
                  <button onClick={() => setDeleteConfirm(product.id)}
                    className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-red-400">
                    <Trash2 size={11} />
                  </button>
                </div>
                {deleteConfirm === product.id && (
                  <div className="mt-2 p-2 bg-red-50 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-red-700">Delete this product?</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(product.id)} className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 bg-white text-[#7A6A64] text-xs rounded border border-[#E8DDD6]">No</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
