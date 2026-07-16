'use client';

export const dynamic = 'force-dynamic';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ImageIcon } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const router = useRouter();

  const sub      = subtotal();
  const shipping = sub >= 999 ? 0 : 99;
  const total    = sub + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={64} className="mx-auto mb-6 text-[#E8DDD6]" />
        <h1 className="text-2xl font-bold text-[#2D1F1A] mb-3">Your cart is empty</h1>
        <p className="text-[#7A6A64] mb-8">Browse our frames and add something special</p>
        <Button asChild size="lg">
          <Link href="/products">Shop All Frames</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-[#2D1F1A] mb-8">
        Your Cart <span className="text-[#7A6A64] font-normal text-xl">({items.length} {items.length === 1 ? 'item' : 'items'})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => {
            const image = item.product.images?.[0] ?? null;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-[#E8DDD6] p-4 sm:p-5">
                <div className="flex gap-4">
                  {/* Product image / custom photo */}
                  <div
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border-4 flex items-center justify-center bg-[#F5EDE5] relative"
                    style={{ borderColor: item.materialColor || '#5C3D2E' }}
                  >
                    {item.customization?.photoUrl ? (
                      <img
                        src={item.customization.photoUrl}
                        alt="Custom"
                        className="w-full h-full object-cover"
                      />
                    ) : image ? (
                      <Image src={image} alt={item.product.name} fill className="object-cover" sizes="96px" />
                    ) : (
                      <ImageIcon size={20} className="text-[#7A6A64]/40" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#2D1F1A] text-sm sm:text-base leading-tight mb-1">
                      {item.product.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-[#7A6A64] mb-1">
                      {item.selectedSizeLabel && <span>{item.selectedSizeLabel}</span>}
                      {item.selectedSizeLabel && item.selectedMaterialLabel && <span>·</span>}
                      {item.selectedMaterialLabel && <span>{item.selectedMaterialLabel}</span>}
                    </div>
                    {item.customization && (item.customization.name || item.customization.date || item.customization.message) && (
                      <p className="text-xs text-[#7A6A64] italic mb-1 truncate">
                        {[item.customization.name, item.customization.date, item.customization.message].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {item.customization && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C4634F] bg-[#FFF4F2] border border-[#C4634F]/20 px-2 py-0.5 rounded-full mb-2">
                        ✨ Customized
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 border border-[#E8DDD6] rounded-xl">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#7A6A64] hover:text-[#2D1F1A] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#C4634F]">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-[#7A6A64] hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-[#E8DDD6] p-5 sticky top-20">
            <h2 className="font-bold text-[#2D1F1A] text-lg mb-5">Order Summary</h2>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-[#7A6A64]">Subtotal</span>
                <span className="font-medium text-[#2D1F1A]">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7A6A64]">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-emerald-600' : 'text-[#2D1F1A]'}`}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-[#7A6A64] bg-[#F5EDE5] rounded-xl p-2.5">
                  Add {formatPrice(999 - sub)} more for free delivery
                </p>
              )}
              <div className="border-t border-[#E8DDD6] pt-3 flex justify-between">
                <span className="font-bold text-[#2D1F1A]">Total</span>
                <span className="font-bold text-[#C4634F] text-lg">{formatPrice(total)}</span>
              </div>
            </div>

            <Button onClick={() => router.push('/checkout')} className="w-full mb-3" size="lg">
              Proceed to Checkout <ArrowRight size={16} />
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/products">Continue Shopping</Link>
            </Button>

            <div className="mt-5 pt-4 border-t border-[#E8DDD6] space-y-2">
              {['🔒 100% Secure Checkout', '🚚 Delivered in 3–5 days'].map(t => (
                <p key={t} className="text-xs text-[#7A6A64]">{t}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
