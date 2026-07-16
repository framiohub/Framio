'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, X, ShoppingCart, Zap, ImageIcon,
  Type, Check, ArrowLeft, Minus, Plus,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props { product: Product; }

const FRAME_GRADIENT: Record<string, string> = {
  'wood-walnut':  'linear-gradient(160deg,#5C3D2E 0%,#3E2723 40%,#6D4C3D 60%,#3E2723 100%)',
  'wood-oak':     'linear-gradient(160deg,#A0785A 0%,#7A5A3F 40%,#B08860 60%,#7A5A3F 100%)',
  'wood-white':   'linear-gradient(160deg,#F0EAE0 0%,#D8D0C4 40%,#F0EAE0 60%,#D8D0C4 100%)',
  'metal-black':  'linear-gradient(160deg,#2A2A2A 0%,#1A1A1A 40%,#3A3A3A 60%,#1A1A1A 100%)',
  'metal-gold':   'linear-gradient(160deg,#8B6914 0%,#C9A84C 40%,#B8960A 60%,#C9A84C 100%)',
  'metal-silver': 'linear-gradient(160deg,#A0A0A0 0%,#D0D0D0 40%,#B8B8B8 60%,#D0D0D0 100%)',
  'acrylic':      'linear-gradient(160deg,rgba(180,200,255,0.7) 0%,rgba(220,235,255,0.9) 40%,rgba(180,200,255,0.7) 100%)',
};

export function CustomizeClient({ product }: Props) {
  const addItem = useCartStore(s => s.addItem);
  const router  = useRouter();

  const defaultSize     = product.sizes[0]     ?? null;
  const defaultMaterial = product.materials[0] ?? null;

  const [selectedSize,     setSelectedSize]     = useState(defaultSize?.value     ?? '');
  const [selectedMaterial, setSelectedMaterial] = useState(defaultMaterial?.value ?? '');
  const [quantity,  setQuantity]  = useState(1);
  const [photoUrl,  setPhotoUrl]  = useState<string | null>(null);
  const [name,      setName]      = useState('');
  const [date,      setDate]      = useState('');
  const [message,   setMessage]   = useState('');
  const [added,     setAdded]     = useState(false);
  const [dragging,  setDragging]  = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const sizeObj     = product.sizes.find(s => s.value === selectedSize);
  const materialObj = product.materials.find(m => m.value === selectedMaterial);
  const unitPrice   = (sizeObj?.price ?? product.basePrice) + (materialObj?.priceAdder ?? 0);
  const frameGrad   = materialObj
    ? (FRAME_GRADIENT[materialObj.value] ?? `linear-gradient(160deg,${materialObj.color},${materialObj.color})`)
    : 'linear-gradient(160deg,#C4A882,#B8966E)';

  const processPhoto = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 900;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoUrl(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processPhoto(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processPhoto(file);
  };

  const buildOptions = () => {
    const customization = {
      photoUrl: photoUrl   ?? undefined,
      name:     name       || undefined,
      date:     date       || undefined,
      message:  message    || undefined,
    };
    const hasCustomization = Object.values(customization).some(Boolean);
    return {
      selectedSize,
      selectedSizeLabel:     sizeObj?.label     ?? '',
      selectedMaterial,
      selectedMaterialLabel: materialObj?.label ?? '',
      materialColor:         materialObj?.color  ?? '#5C3D2E',
      unitPrice,
      ...(hasCustomization && {
        customization,
        _idOverride: `${product.id}__${selectedSize}__${selectedMaterial}__cust_${Date.now()}`,
      }),
    };
  };

  const handleAdd = () => {
    const opts = buildOptions();
    for (let i = 0; i < quantity; i++) addItem(product, opts);
    setAdded(true);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    const opts = buildOptions();
    for (let i = 0; i < quantity; i++) addItem(product, opts);
    router.push('/checkout');
  };

  const hasText = name || date || message;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href={`/products/${product.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#7A6A64] hover:text-[#C4634F] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Product
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#2D1F1A]">Customize Your Frame</h1>
        <p className="text-[#7A6A64] mt-1">{product.name} — make it uniquely yours</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── LEFT: Live Preview ──────────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="sticky top-24">
            <div className="bg-white rounded-3xl border border-[#E8DDD6] shadow-lg p-6 sm:p-10">
              <p className="text-[10px] font-bold text-[#7A6A64] uppercase tracking-[0.18em] mb-6 text-center">
                Live Preview
              </p>

              {/* Frame */}
              <div className="mx-auto" style={{ maxWidth: '260px' }}>
                <div
                  className="p-[20px] rounded-[3px] shadow-2xl relative"
                  style={{ background: frameGrad }}
                >
                  {/* Mounting screw dots */}
                  {(['top-[7px] left-[7px]', 'top-[7px] right-[7px]', 'bottom-[7px] left-[7px]', 'bottom-[7px] right-[7px]'] as const).map(pos => (
                    <div key={pos} className={`absolute ${pos} w-[7px] h-[7px] rounded-full bg-black/25 shadow-inner`} />
                  ))}

                  {/* Mat board */}
                  <div className="bg-[#FAF7F2] p-3">
                    {/* Photo area */}
                    <div
                      className="relative overflow-hidden bg-[#EDE0D0]"
                      style={{ aspectRatio: selectedSize === '8x10' ? '4/5' : '3/4' }}
                    >
                      {photoUrl ? (
                        <img src={photoUrl} alt="Your photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <ImageIcon size={28} className="text-[#C4A882]" />
                          <p className="text-[10px] text-[#C4A882] font-medium text-center px-3 leading-snug">
                            Upload photo to preview
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Personalization text */}
                    {hasText && (
                      <div className="pt-2.5 pb-1 text-center space-y-0.5">
                        {name && (
                          <p
                            className="text-[#2D1F1A] font-semibold text-[13px] tracking-widest"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                          >
                            {name}
                          </p>
                        )}
                        {date && (
                          <p className="text-[#7A6A64] text-[9px] tracking-[0.22em] uppercase">
                            {date}
                          </p>
                        )}
                        {message && (
                          <p className="text-[#7A6A64] text-[9px] italic mt-0.5">
                            &ldquo;{message}&rdquo;
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Size + finish pills */}
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  {sizeObj && (
                    <span className="text-xs text-[#7A6A64] bg-[#F5EDE5] px-3 py-1 rounded-full font-medium">
                      {sizeObj.label}
                    </span>
                  )}
                  {materialObj && (
                    <span className="flex items-center gap-1.5 text-xs text-[#7A6A64] bg-[#F5EDE5] px-3 py-1 rounded-full font-medium">
                      <span className="w-3 h-3 rounded-full border border-white/60 shadow-sm" style={{ background: materialObj.color }} />
                      {materialObj.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Controls ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Photo Upload */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-bold text-[#2D1F1A] mb-3 flex items-center gap-2 text-sm">
              <ImageIcon size={15} className="text-[#C4634F]" /> Upload Your Photo
            </h3>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {photoUrl ? (
              <div className="flex items-center gap-3 bg-[#F5EDE5] rounded-xl p-3">
                <img
                  src={photoUrl}
                  alt="Uploaded"
                  className="w-14 h-14 object-cover rounded-lg border-2 border-white shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#2D1F1A]">Photo uploaded ✓</p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="text-xs text-[#C4634F] hover:underline"
                  >
                    Change photo
                  </button>
                </div>
                <button
                  onClick={() => { setPhotoUrl(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="p-1.5 text-[#7A6A64] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  'w-full border-2 border-dashed rounded-xl py-7 flex flex-col items-center gap-2 transition-all cursor-pointer',
                  dragging
                    ? 'border-[#C4634F] bg-[#FFF4F2]'
                    : 'border-[#E8DDD6] hover:border-[#C4634F] hover:bg-[#FFF9F7]'
                )}
              >
                <div className={cn('p-3 rounded-xl transition-all', dragging ? 'bg-[#C4634F]/10' : 'bg-[#F5EDE5]')}>
                  <Upload size={20} className="text-[#C4634F]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#2D1F1A]">Click or drag photo here</p>
                  <p className="text-xs text-[#7A6A64] mt-0.5">JPG, PNG, WEBP — up to 10 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Personalization */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
            <h3 className="font-bold text-[#2D1F1A] mb-4 flex items-center gap-2 text-sm">
              <Type size={15} className="text-[#C4634F]" /> Personalize
            </h3>
            <div className="space-y-3">
              {([
                { label: 'Name',  value: name,    setter: setName,    placeholder: 'e.g. Priya & Rahul',       max: 40 },
                { label: 'Date',  value: date,    setter: setDate,    placeholder: 'e.g. 14 February 2024',   max: 30 },
              ] as const).map(({ label, value, setter, placeholder, max }) => (
                <div key={label}>
                  <label className="block text-[10px] font-bold text-[#7A6A64] uppercase tracking-widest mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    maxLength={max}
                    className="w-full px-3 py-2.5 text-sm border border-[#E8DDD6] rounded-xl focus:outline-none focus:border-[#C4634F] focus:ring-2 focus:ring-[#C4634F]/10 text-[#2D1F1A] placeholder:text-[#C4A882]"
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-[#7A6A64] uppercase tracking-widest mb-1.5">
                  Message <span className="text-[#C4A882] font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="e.g. Forever in my heart"
                  maxLength={60}
                  className="w-full px-3 py-2.5 text-sm border border-[#E8DDD6] rounded-xl focus:outline-none focus:border-[#C4634F] focus:ring-2 focus:ring-[#C4634F]/10 text-[#2D1F1A] placeholder:text-[#C4A882]"
                />
              </div>
            </div>
          </div>

          {/* Size */}
          {product.sizes.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#2D1F1A] text-sm">Size</h3>
                {sizeObj && <span className="text-xs text-[#C4634F] font-medium">{formatPrice(sizeObj.price)}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(size => (
                  <button
                    key={size.value}
                    onClick={() => setSelectedSize(size.value)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-xl border-2 transition-all',
                      selectedSize === size.value
                        ? 'border-[#C4634F] bg-[#C4634F] text-white shadow-sm'
                        : 'border-[#E8DDD6] text-[#2D1F1A] hover:border-[#C4634F] bg-white'
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Frame Finish */}
          {product.materials.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[#2D1F1A] text-sm">Frame Finish</h3>
                {materialObj && (
                  <span className="text-xs text-[#7A6A64]">
                    {materialObj.label}
                    {materialObj.priceAdder > 0 && ` (+${formatPrice(materialObj.priceAdder)})`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {product.materials.map(mat => (
                  <button
                    key={mat.value}
                    title={mat.label}
                    onClick={() => setSelectedMaterial(mat.value)}
                    className={cn(
                      'w-9 h-9 rounded-full border-2 transition-all',
                      selectedMaterial === mat.value
                        ? 'border-[#C4634F] scale-110 shadow-md ring-2 ring-[#C4634F]/20'
                        : 'border-white hover:scale-105 ring-1 ring-[#E8DDD6]'
                    )}
                    style={{ background: mat.color }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Price + Quantity + CTAs */}
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5 space-y-4">
            <div className="bg-[#F5EDE5] rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#7A6A64]">
                  {sizeObj?.label ?? 'Base'}{materialObj && ` · ${materialObj.label}`}
                </p>
                <p className="text-2xl font-bold text-[#C4634F]">{formatPrice(unitPrice)}</p>
              </div>
              <div className="text-xs text-[#7A6A64] text-right">
                <p>Free delivery</p>
                <p>above ₹999</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex items-center gap-1 border border-[#E8DDD6] rounded-xl bg-white">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-11 flex items-center justify-center text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[#2D1F1A]">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-11 flex items-center justify-center text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 font-bold rounded-xl transition-all shadow-lg text-sm',
                  added
                    ? 'bg-emerald-500 text-white shadow-emerald-200'
                    : 'bg-[#C4634F] text-white hover:bg-[#B5574A] hover:shadow-xl hover:-translate-y-0.5'
                )}
              >
                {added
                  ? <><Check size={16} /> Added to Cart!</>
                  : <><ShoppingCart size={16} /> Add · {formatPrice(unitPrice * quantity)}</>
                }
              </button>
            </div>

            <button
              onClick={handleBuyNow}
              className="w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl border-2 border-[#2D1F1A] text-[#2D1F1A] hover:bg-[#2D1F1A] hover:text-white transition-all text-sm"
            >
              <Zap size={16} />
              Buy Now · {formatPrice(unitPrice * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
