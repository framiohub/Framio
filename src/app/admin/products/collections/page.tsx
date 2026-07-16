'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit, Trash2, Check, X, Loader2, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const inputCls = 'w-full px-3 py-2 rounded-xl border border-[#E8DDD6] text-sm text-[#2D1F1A] bg-white focus:outline-none focus:ring-2 focus:ring-[#C4634F]/30 focus:border-[#C4634F] transition-all';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/products/collections');
    if (res.ok) setCollections(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null); setName(''); setSlug(''); setDescription(''); setShowForm(true);
  };

  const openEdit = (col: Collection) => {
    setEditing(col); setName(col.name); setSlug(col.slug);
    setDescription(col.description ?? ''); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !slug.trim()) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/admin/products/collections/${editing.id}` : '/api/admin/products/collections';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description: description || null }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      toast.success(editing ? 'Collection updated' : 'Collection created');
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/products/collections/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Collection deleted'); setCollections(prev => prev.filter(c => c.id !== id)); }
    else toast.error('Failed to delete');
    setDeleteConfirm(null);
  };

  const toggleActive = async (col: Collection) => {
    const res = await fetch(`/api/admin/products/collections/${col.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !col.is_active }),
    });
    if (res.ok) setCollections(prev => prev.map(c => c.id === col.id ? { ...c, is_active: !col.is_active } : c));
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/products" className="p-1.5 hover:bg-[#E8DDD6] rounded-lg transition-colors">
            <ArrowLeft size={16} className="text-[#7A6A64]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2D1F1A]">Product Collections</h1>
            <p className="text-sm text-[#7A6A64]">{collections.length} collections</p>
          </div>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#C4634F] text-white text-sm font-bold rounded-xl hover:bg-[#B5574A] transition-colors">
          <Plus size={15} /> New Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5 mb-5">
          <h2 className="font-semibold text-[#2D1F1A] mb-4">{editing ? 'Edit Collection' : 'New Collection'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1 block">Name *</label>
              <input className={inputCls} value={name}
                onChange={e => { setName(e.target.value); if (!editing) setSlug(slugify(e.target.value)); }}
                placeholder="e.g. Anniversary Collection" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1 block">Slug *</label>
              <input className={inputCls} value={slug}
                onChange={e => setSlug(slugify(e.target.value))}
                placeholder="anniversary-collection" />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1 block">Description</label>
            <textarea className={cn(inputCls, 'resize-none')} rows={2} value={description}
              onChange={e => setDescription(e.target.value)} placeholder="Optional description…" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#C4634F] text-white text-sm font-bold rounded-xl hover:bg-[#B5574A] transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              {editing ? 'Save Changes' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-[#E8DDD6] text-[#7A6A64] text-sm rounded-xl hover:bg-[#F5EDE5] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] py-16 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#C4634F]" />
        </div>
      ) : collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] py-16 text-center">
          <Layers size={32} className="mx-auto mb-3 text-[#E8DDD6]" />
          <p className="text-sm text-[#7A6A64] mb-3">No collections yet</p>
          <button onClick={openCreate} className="text-sm text-[#C4634F] hover:underline font-medium">
            Create your first collection
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F5EDE5] bg-[#FDF8F4]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden sm:table-cell">Slug</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Active</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5EDE5]">
              {collections.map(col => (
                <tr key={col.id} className="hover:bg-[#FDF8F4] transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#2D1F1A] text-sm">{col.name}</p>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="font-mono text-xs text-[#7A6A64]">{col.slug}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#7A6A64] line-clamp-1">{col.description ?? '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleActive(col)}
                      className={cn('w-8 h-4 rounded-full transition-colors relative flex-shrink-0',
                        col.is_active ? 'bg-emerald-500' : 'bg-[#E8DDD6]')}>
                      <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform',
                        col.is_active ? 'translate-x-4' : 'translate-x-0.5')} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {deleteConfirm === col.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(col.id)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"><Check size={11} /></button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="p-1 bg-[#F5EDE5] rounded hover:bg-[#E8DDD6] text-[#7A6A64]"><X size={11} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(col)}
                          className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors text-[#7A6A64]">
                          <Edit size={13} />
                        </button>
                        <button onClick={() => setDeleteConfirm(col.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
