'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Globe, Eye, Plus, Trash2,
  Image as ImageIcon, Loader2, X, Check, AlertCircle, Upload, Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PRODUCT_TYPES = [
  { value: 'single',    label: 'Single Photo' },
  { value: 'collage-3', label: '3-Photo Collage' },
  { value: 'collage-5', label: '5-Photo Collage' },
  { value: 'couple',    label: 'Couple Frame' },
  { value: 'led',       label: 'LED Frame' },
  { value: 'desk',      label: 'Desk Frame' },
];

const OCCASIONS = [
  'anniversary', 'birthday', 'family', 'wedding',
  'housewarming', 'corporate', 'valentines', 'general',
];

const BADGES = ['', 'Best Seller', 'Popular', 'Trending', 'New', 'Sale'];

export interface SizeVariant {
  id?: string;
  label: string;
  value: string;
  price: number;
  stockQuantity: number;
}

export interface MaterialVariant {
  id?: string;
  label: string;
  value: string;
  priceAdder: number;
  color: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  type: string;
  photoSlots: number;
  occasions: string[];
  basePrice: number;
  stockQuantity: number;
  sizes: SizeVariant[];
  materials: MaterialVariant[];
  images: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'published' | 'archived';
  badge: string;
  featured: boolean;
  isActive: boolean;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  productId?: string;
}

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const TABS = ['General', 'Pricing & Stock', 'Variants', 'Images', 'SEO'] as const;
type Tab = typeof TABS[number];

const defaultForm: ProductFormData = {
  name: '', slug: '', description: '', type: 'single', photoSlots: 1,
  occasions: [],
  basePrice: 0, stockQuantity: 0,
  sizes: [{ label: '8″ × 12″ (A4)', value: '8x12', price: 0, stockQuantity: 0 }],
  materials: [
    { label: 'Black', value: 'black', priceAdder: 0, color: '#1C1C1C' },
    { label: 'Brown', value: 'brown', priceAdder: 0, color: '#7A4A2E' },
  ],
  images: [],
  seoTitle: '', seoDescription: '',
  status: 'draft', badge: '', featured: false, isActive: true,
};

export default function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<ProductFormData>({ ...defaultForm, ...initialData });
  const [tab, setTab] = useState<Tab>('General');
  const [saving, setSaving] = useState(false);
  const [imageInput, setImageInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof ProductFormData, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleNameChange = (name: string) => {
    set('name', name);
    if (!productId) set('slug', slugify(name));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())   e.name     = 'Product name is required';
    if (!form.slug.trim())   e.slug     = 'Slug is required';
    if (form.basePrice <= 0) e.basePrice = 'Base price must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (status?: 'draft' | 'published') => {
    if (!validate()) { setTab('General'); toast.error('Please fix the errors before saving'); return; }
    setSaving(true);
    try {
      const payload = { ...form, status: status ?? form.status };
      const url    = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const method = productId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to save');
      toast.success(productId ? 'Product updated!' : 'Product created!');
      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Materials ── */
  const updateMaterial = (i: number, field: keyof MaterialVariant, val: any) =>
    set('materials', form.materials.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const removeMaterial = (i: number) =>
    set('materials', form.materials.filter((_, idx) => idx !== i));

  const addMaterial = () =>
    set('materials', [
      ...form.materials,
      { label: '', value: `colour-${Date.now()}`, priceAdder: 0, color: '#888888' },
    ]);

  /* ── Images ── */
  const addImageUrl = () => {
    const url = imageInput.trim();
    if (!url) return;
    set('images', [...form.images, url]);
    setImageInput('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/products/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      set('images', [...form.images, data.url]);
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (i: number) => set('images', form.images.filter((_, idx) => idx !== i));

  const toggleOccasion = (occ: string) =>
    set('occasions', form.occasions.includes(occ)
      ? form.occasions.filter(o => o !== occ)
      : [...form.occasions, occ]);

  const inputCls = (field?: string) => cn(
    'w-full px-3 py-2 rounded-xl border text-sm text-[#2D1F1A] bg-white focus:outline-none focus:ring-2 transition-all',
    field && errors[field]
      ? 'border-red-400 focus:ring-red-300'
      : 'border-[#E8DDD6] focus:ring-[#C4634F]/30 focus:border-[#C4634F]'
  );

  const statusColor = {
    draft:     'bg-yellow-100 text-yellow-800',
    published: 'bg-emerald-100 text-emerald-800',
    archived:  'bg-gray-100 text-gray-600',
  }[form.status];

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer" onClick={onChange}>
      <div className={cn('w-9 h-5 rounded-full transition-colors relative flex-shrink-0',
        value ? 'bg-emerald-500' : 'bg-[#E8DDD6]')}>
        <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
          value ? 'translate-x-4' : 'translate-x-0.5')} />
      </div>
      <span className="text-sm text-[#2D1F1A]">{label}</span>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#F5EDE5]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-[#E8DDD6] px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push('/admin/products')}
            className="p-1.5 hover:bg-[#F5EDE5] rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft size={16} className="text-[#7A6A64]" />
          </button>
          <div className="min-w-0">
            <h1 className="font-bold text-[#2D1F1A] text-sm truncate">
              {productId ? form.name || 'Edit Product' : 'New Product'}
            </h1>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', statusColor)}>
              {form.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {productId && (
            <a href={`/products/${productId}`} target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#E8DDD6] rounded-xl hover:bg-[#F5EDE5] transition-colors text-[#7A6A64]">
              <Eye size={13} /> Preview
            </a>
          )}
          <button onClick={() => save('draft')} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#E8DDD6] rounded-xl hover:bg-[#F5EDE5] transition-colors text-[#7A6A64] disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Save Draft
          </button>
          <button onClick={() => save('published')} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#C4634F] text-white rounded-xl hover:bg-[#B5574A] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Globe size={13} />}
            Publish
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">

        {/* ── Left: tabs ── */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-[#E8DDD6] overflow-hidden">

            {/* Tab bar */}
            <div className="flex border-b border-[#E8DDD6] overflow-x-auto">
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn(
                    'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
                    tab === t
                      ? 'border-b-2 border-[#C4634F] text-[#C4634F] -mb-px'
                      : 'text-[#7A6A64] hover:text-[#2D1F1A]'
                  )}>
                  {t}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* ── General ── */}
              {tab === 'General' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Product Name *</label>
                    <input className={inputCls('name')} value={form.name}
                      onChange={e => handleNameChange(e.target.value)}
                      placeholder="e.g. Classic Single Photo Frame" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Slug *</label>
                    <div className="flex gap-2">
                      <input className={inputCls('slug')} value={form.slug}
                        onChange={e => set('slug', slugify(e.target.value))}
                        placeholder="classic-single-photo-frame" />
                      <button onClick={() => set('slug', slugify(form.name))}
                        className="px-3 py-2 text-xs bg-[#F5EDE5] text-[#7A6A64] rounded-xl hover:bg-[#E8DDD6] transition-colors whitespace-nowrap">
                        Auto
                      </button>
                    </div>
                    {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Description</label>
                    <textarea className={cn(inputCls(), 'resize-none')} rows={4} value={form.description}
                      onChange={e => set('description', e.target.value)}
                      placeholder="Describe the product…" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Frame Type</label>
                      <select className={inputCls()} value={form.type} onChange={e => set('type', e.target.value)}>
                        {PRODUCT_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Photo Slots</label>
                      <input
                        type="number" min={1} max={10}
                        className={inputCls()}
                        value={form.photoSlots || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => set('photoSlots', parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-2 block">Occasions</label>
                    <div className="flex flex-wrap gap-2">
                      {OCCASIONS.map(occ => (
                        <button key={occ} type="button" onClick={() => toggleOccasion(occ)}
                          className={cn(
                            'px-3 py-1.5 text-xs font-medium rounded-full border transition-all capitalize',
                            form.occasions.includes(occ)
                              ? 'bg-[#C4634F] text-white border-[#C4634F]'
                              : 'border-[#E8DDD6] text-[#7A6A64] hover:border-[#C4634F] hover:text-[#C4634F]'
                          )}>
                          {occ}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Pricing & Stock ── */}
              {tab === 'Pricing & Stock' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Base Price (₹) *</label>
                      <input
                        type="number" min={0} step={1}
                        className={inputCls('basePrice')}
                        value={form.basePrice || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => set('basePrice', parseFloat(e.target.value) || 0)}
                      />
                      {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">Total Stock Qty</label>
                      <input
                        type="number" min={0} step={1}
                        className={inputCls()}
                        value={form.stockQuantity || ''}
                        onFocus={e => e.target.select()}
                        onChange={e => set('stockQuantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5EDE5] rounded-xl">
                    <p className="text-xs text-[#7A6A64] mb-1">Price Preview</p>
                    <p className="text-lg font-bold text-[#C4634F]">
                      ₹{form.basePrice.toFixed(2)}
                      {form.materials.some(m => m.priceAdder > 0) && (
                        <span className="text-sm font-normal text-[#7A6A64] ml-2">
                          — up to ₹{(form.basePrice + Math.max(...form.materials.map(m => m.priceAdder))).toFixed(2)} (with colour)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Variants ── */}
              {tab === 'Variants' && (
                <div className="space-y-6">

                  {/* Fixed Size */}
                  <div>
                    <h3 className="font-semibold text-[#2D1F1A] text-sm mb-3">Frame Size</h3>
                    <div className="flex items-center gap-3 p-4 bg-[#F5EDE5] rounded-xl border border-[#E8DDD6]">
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#E8DDD6] flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-[#C4634F] leading-tight text-center">A4</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#2D1F1A]">8″ × 12″ (A4)</p>
                        <p className="text-xs text-[#7A6A64]">Fixed size — applies to all frames</p>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium bg-white border border-[#C4634F]/40 text-[#C4634F] rounded-full flex-shrink-0">
                        Default
                      </span>
                    </div>
                  </div>

                  {/* Frame Colour */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[#2D1F1A] text-sm">Frame Colour</h3>
                      <button
                        onClick={addMaterial}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[#F5EDE5] text-[#C4634F] rounded-lg hover:bg-[#E8DDD6] transition-colors"
                      >
                        <Plus size={12} /> Add Colour
                      </button>
                    </div>
                    <p className="text-xs text-[#7A6A64] mb-3">Set an extra charge per colour (0 = same as base price)</p>
                    <div className="space-y-2">
                      {form.materials.map((mat, i) => {
                        const isDefault = mat.value === 'black';
                        return (
                          <div key={i} className="flex items-center gap-2 p-3 bg-white border border-[#E8DDD6] rounded-xl">
                            {/* Colour picker */}
                            <label className="relative flex-shrink-0 cursor-pointer">
                              <div
                                className="w-8 h-8 rounded-full border-2 border-white shadow"
                                style={{ backgroundColor: mat.color, boxShadow: '0 0 0 1px #E8DDD6' }}
                              />
                              <input
                                type="color"
                                value={mat.color}
                                onChange={e => updateMaterial(i, 'color', e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              />
                            </label>

                            {/* Name */}
                            <input
                              className={cn(inputCls(), 'flex-1 min-w-0 text-sm')}
                              placeholder="Colour name"
                              value={mat.label}
                              onChange={e => {
                                const label = e.target.value;
                                const value = label.toLowerCase().replace(/\s+/g, '-') || `colour-${i}`;
                                updateMaterial(i, 'label', label);
                                if (!isDefault) updateMaterial(i, 'value', value);
                              }}
                            />

                            {/* Price adder */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-[#7A6A64]">+₹</span>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className={cn(inputCls(), 'w-20 text-right text-sm')}
                                placeholder="0"
                                value={mat.priceAdder || ''}
                                onFocus={e => e.target.select()}
                                onChange={e => updateMaterial(i, 'priceAdder', parseFloat(e.target.value) || 0)}
                              />
                            </div>

                            {/* Default badge or delete button */}
                            {isDefault ? (
                              <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C4634F]/10 text-[#C4634F] border border-[#C4634F]/20">
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => removeMaterial(i)}
                                disabled={form.materials.length === 1}
                                title="Remove colour"
                                className="flex-shrink-0 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Images ── */}
              {tab === 'Images' && (
                <div className="space-y-5">
                  {/* Two upload methods */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Device upload */}
                    <div>
                      <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Upload size={11} /> Upload from Device
                      </p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className={cn(
                          'w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-all',
                          uploadingImage
                            ? 'border-[#C4634F] bg-[#FDF8F4] cursor-wait'
                            : 'border-[#E8DDD6] hover:border-[#C4634F] hover:bg-[#FDF8F4] cursor-pointer'
                        )}
                      >
                        {uploadingImage
                          ? <Loader2 size={22} className="text-[#C4634F] animate-spin" />
                          : <Upload size={22} className="text-[#E8DDD6]" />}
                        <span className="text-xs text-[#7A6A64]">
                          {uploadingImage ? 'Uploading…' : 'Click to browse'}
                        </span>
                        <span className="text-[10px] text-[#7A6A64]/60">JPEG, PNG, WebP · Max 5 MB</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {/* URL input */}
                    <div>
                      <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <LinkIcon size={11} /> Add from URL
                      </p>
                      <div className="space-y-2">
                        <input
                          className={inputCls()}
                          value={imageInput}
                          onChange={e => setImageInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addImageUrl()}
                          placeholder="https://example.com/image.jpg"
                        />
                        <button
                          onClick={addImageUrl}
                          disabled={!imageInput.trim()}
                          className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#C4634F] text-white text-xs font-semibold rounded-xl hover:bg-[#B5574A] transition-colors disabled:opacity-40"
                        >
                          <Plus size={13} /> Add URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Image grid */}
                  {form.images.length === 0 ? (
                    <div className="border-2 border-dashed border-[#E8DDD6] rounded-2xl p-10 text-center">
                      <ImageIcon size={28} className="mx-auto mb-2 text-[#E8DDD6]" />
                      <p className="text-sm text-[#7A6A64]">No images yet. Upload a file or paste a URL above.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {form.images.map((url, i) => (
                        <div key={i} className="relative group rounded-xl overflow-hidden border border-[#E8DDD6] aspect-square bg-[#F5EDE5]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="" className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          {i === 0 && (
                            <span className="absolute top-2 left-2 bg-[#C4634F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Primary
                            </span>
                          )}
                          <button
                            onClick={() => removeImage(i)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <X size={11} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white truncate">{url}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-[#7A6A64]">First image is used as the primary product image.</p>
                </div>
              )}

              {/* ── SEO ── */}
              {tab === 'SEO' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">SEO Title</label>
                    <input className={inputCls()} value={form.seoTitle}
                      onChange={e => set('seoTitle', e.target.value)}
                      placeholder={form.name || 'Product name for search engines'} />
                    <p className="text-xs text-[#7A6A64] mt-1">{form.seoTitle.length}/60 characters</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">SEO Description</label>
                    <textarea className={cn(inputCls(), 'resize-none')} rows={3} value={form.seoDescription}
                      onChange={e => set('seoDescription', e.target.value)}
                      placeholder="Brief description for search engine results…" />
                    <p className="text-xs text-[#7A6A64] mt-1">{form.seoDescription.length}/160 characters</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-1.5 block">URL Slug</label>
                    <div className="flex items-center gap-2 p-3 bg-[#F5EDE5] rounded-xl">
                      <span className="text-xs text-[#7A6A64]">framio.shop/products/</span>
                      <span className="text-xs font-mono text-[#C4634F]">{form.slug || 'your-product-slug'}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider mb-2">Search Preview</p>
                    <div className="border border-[#E8DDD6] rounded-xl p-4 bg-white">
                      <p className="text-base text-blue-700 font-medium truncate">
                        {form.seoTitle || form.name || 'Product Name'}
                      </p>
                      <p className="text-xs text-green-700 mb-1">framio.shop/products/{form.slug || 'slug'}</p>
                      <p className="text-xs text-[#7A6A64] line-clamp-2">
                        {form.seoDescription || form.description || 'Product description will appear here in search results.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Validation error summary */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Please fix these issues:</p>
                {Object.values(errors).map((e, i) => (
                  <p key={i} className="text-xs text-red-600">• {e}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Publish */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-semibold text-[#2D1F1A] text-sm mb-4">Publish Settings</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-[#7A6A64] mb-1 block">Status</label>
                <select className={inputCls()} value={form.status} onChange={e => set('status', e.target.value as any)}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <Toggle value={form.isActive} onChange={() => set('isActive', !form.isActive)} label="Active (visible in store)" />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => save('published')} disabled={saving}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#C4634F] text-white text-sm font-bold rounded-xl hover:bg-[#B5574A] transition-colors disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
                Publish
              </button>
              <button onClick={() => save('draft')} disabled={saving}
                className="flex items-center justify-center gap-2 w-full py-2.5 border border-[#E8DDD6] text-[#7A6A64] text-sm font-medium rounded-xl hover:bg-[#F5EDE5] transition-colors disabled:opacity-50">
                <Save size={14} /> Save as Draft
              </button>
            </div>
          </div>

          {/* Labels */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-semibold text-[#2D1F1A] text-sm mb-4">Product Labels</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#7A6A64] mb-1 block">Badge</label>
                <select className={inputCls()} value={form.badge} onChange={e => set('badge', e.target.value)}>
                  {BADGES.map(b => <option key={b} value={b}>{b || '— None —'}</option>)}
                </select>
              </div>
              <Toggle
                value={form.featured}
                onChange={() => set('featured', !form.featured)}
                label="Featured on homepage"
              />
            </div>
          </div>

          {/* Quick Info (edit only) */}
          {productId && (
            <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
              <h3 className="font-semibold text-[#2D1F1A] text-sm mb-3">Quick Info</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Product ID', <span className="font-mono text-xs">{productId.slice(0, 8)}…</span>],
                  ['Size',       '8″ × 12″ (A4)'],
                  ['Colours',    form.materials.map(m => m.label).filter(Boolean).join(', ') || '—'],
                  ['Images',     form.images.length],
                ].map(([dt, dd]) => (
                  <div key={String(dt)} className="flex justify-between items-center">
                    <dt className="text-[#7A6A64]">{dt}</dt>
                    <dd className="text-[#2D1F1A] font-medium">{dd as any}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
