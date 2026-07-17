'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Check, Minus, Plus, Zap } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  product: Product;
}

export function AddToCartSection({ product }: Props) {
  const addItem = useCartStore(s => s.addItem);
  const router  = useRouter();

  const defaultSize     = product.sizes[0] ?? null;
  // Prefer Black as default; fall back to first material
  const defaultMaterial =
    product.materials.find(m => m.value === 'black') ?? product.materials[0] ?? null;

  const [selectedSize,     setSelectedSize]     = useState(defaultSize?.value     ?? '');
  const [selectedMaterial, setSelectedMaterial] = useState(defaultMaterial?.value ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added,    setAdded]    = useState(false);

  const sizeObj     = product.sizes.find(s => s.value === selectedSize);
  const materialObj = product.materials.find(m => m.value === selectedMaterial);

  const basePrice   = sizeObj?.price ?? product.basePrice;
  const unitPrice   = basePrice + (materialObj?.priceAdder ?? 0);

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, {
        selectedSize:         selectedSize,
        selectedSizeLabel:    sizeObj?.label     ?? '',
        selectedMaterial:     selectedMaterial,
        selectedMaterialLabel: materialObj?.label ?? '',
        materialColor:        materialObj?.color  ?? '#5C3D2E',
        unitPrice,
      });
    }
    setAdded(true);
    toast.success(`${product.name} added to cart!`);
    setTimeout(() => setAdded(false), 2500);
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, {
        selectedSize:         selectedSize,
        selectedSizeLabel:    sizeObj?.label     ?? '',
        selectedMaterial:     selectedMaterial,
        selectedMaterialLabel: materialObj?.label ?? '',
        materialColor:        materialObj?.color  ?? '#5C3D2E',
        unitPrice,
      });
    }
    router.push('/checkout');
  };

  return (
    <div className="space-y-5">
      {/* Dynamic price — updates when size or colour changes */}
      <div className="mb-1">
        <p className="text-xs text-[#7A6A64] mb-1">
          {materialObj ? `${sizeObj?.label ?? 'Base'} · ${materialObj.label}` : (sizeObj?.label ?? 'Price')}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[#C4634F]">{formatPrice(unitPrice)}</span>
          {materialObj && materialObj.priceAdder > 0 && (
            <span className="text-sm text-[#7A6A64]">incl. {materialObj.label} finish</span>
          )}
        </div>
      </div>

      {/* Size selection — shown only when multiple sizes exist */}
      {product.sizes.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Size</p>
            {sizeObj && (
              <p className="text-xs text-[#C4634F] font-medium">{formatPrice(sizeObj.price)}</p>
            )}
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

      {/* Material / finish selection */}
      {product.materials.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[#7A6A64] uppercase tracking-wider">Finish</p>
            {materialObj && (
              <p className="text-xs text-[#7A6A64]">{materialObj.label}{materialObj.priceAdder > 0 && ` (+${formatPrice(materialObj.priceAdder)})`}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {product.materials.map(mat => (
              <button
                key={mat.value}
                title={mat.label}
                onClick={() => setSelectedMaterial(mat.value)}
                className={cn(
                  'w-8 h-8 rounded-full border-2 transition-all',
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

      {/* Quantity + Add to Cart */}
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
          {added ? (
            <><Check size={16} /> Added to Cart!</>
          ) : (
            <><ShoppingCart size={16} /> Add to Cart · {formatPrice(unitPrice * quantity)}</>
          )}
        </button>
      </div>

      {/* Buy Now */}
      <button
        onClick={handleBuyNow}
        className="w-full flex items-center justify-center gap-2 py-3 font-bold rounded-xl border-2 border-[#2D1F1A] text-[#2D1F1A] hover:bg-[#2D1F1A] hover:text-white transition-all text-sm"
      >
        <Zap size={16} />
        Buy Now · {formatPrice(unitPrice * quantity)}
      </button>
    </div>
  );
}
