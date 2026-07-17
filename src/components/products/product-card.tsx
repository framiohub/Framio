'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ImageIcon } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const lowestPrice = product.sizes.length > 0
    ? Math.min(...product.sizes.map(s => s.price))
    : product.basePrice;

  const primaryImage = product.images?.[0] ?? null;

  return (
    <Link href={`/products/${product.id}`} className={cn('group block', className)}>
      <div className="frame-card bg-white rounded-2xl overflow-hidden border border-[#E8DDD6] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer">

        {/* Image area */}
        <div className="relative aspect-square bg-[#F5EDE5] overflow-hidden">
          {primaryImage ? (
            /* Padded inner area so full image is visible without cropping */
            <div className="absolute inset-3">
              <div className="relative w-full h-full">
                <Image
                  src={primaryImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority={priority}
                  className="object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <FramePlaceholder product={product} />
            </div>
          )}

          {product.badge && (
            <div className="absolute top-3 left-3 z-10">
              <Badge variant={product.badge === 'New' ? 'gold' : 'default'}>
                {product.badge}
              </Badge>
            </div>
          )}

          <button
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 p-1.5 sm:p-2 bg-white/90 rounded-full shadow-sm hover:bg-white hover:text-red-500 transition-all"
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
            aria-label="Wishlist"
          >
            <Heart size={12} className="text-[#7A6A64] sm:hidden" />
            <Heart size={14} className="text-[#7A6A64] hidden sm:block" />
          </button>

          {/* Hover overlay for no-image cards */}
          {!primaryImage && (
            <div className="absolute inset-0 bg-[#C4634F]/0 group-hover:bg-[#C4634F]/5 transition-colors duration-300" />
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-[#2D1F1A] text-xs sm:text-sm leading-tight mb-1 group-hover:text-[#C4634F] transition-colors line-clamp-2">
            {product.name}
          </h3>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <StarRating rating={product.rating} showCount count={product.reviewCount} />
            </div>
          )}
          <div className="flex items-center justify-between mt-2 gap-1">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-[#7A6A64]">From</span>
              <div className="font-bold text-[#C4634F] text-sm sm:text-base leading-tight">{formatPrice(lowestPrice)}</div>
            </div>
            <span className="text-[10px] sm:text-xs text-[#7A6A64] bg-[#F5EDE5] px-1.5 py-0.5 rounded-md flex-shrink-0">
              {product.photoSlots === 1 ? '1 photo' : `${product.photoSlots} photos`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FramePlaceholder({ product }: { product: Product }) {
  const borderColor = product.materials[0]?.color || '#5C3D2E';
  const isCollage   = product.type.startsWith('collage');
  const slots       = product.photoSlots;

  return (
    <div
      className="relative w-3/5 h-3/5 flex items-center justify-center"
      style={{
        border: `10px solid ${borderColor}`,
        borderRadius: '4px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 0 0 2px rgba(255,255,255,0.3)',
      }}
    >
      {isCollage ? (
        <div className={cn(
          'grid gap-1 w-full h-full p-1',
          slots === 3 ? 'grid-cols-3' : slots === 5 ? 'grid-cols-3 grid-rows-2' : 'grid-cols-3 grid-rows-3'
        )}>
          {Array.from({ length: Math.min(slots, 9) }).map((_, i) => (
            <div key={i} className={cn(
              'bg-[#E8DDD6]/60 rounded-sm flex items-center justify-center',
              slots === 5 && i === 0 ? 'col-span-2 row-span-2' : ''
            )}>
              <ImageIcon size={10} className="text-[#7A6A64]/40" />
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full bg-[#E8DDD6]/60 flex items-center justify-center">
          <ImageIcon size={24} className="text-[#7A6A64]/40" />
        </div>
      )}
      {product.type === 'led' && (
        <div
          className="absolute inset-0 rounded-sm"
          style={{ boxShadow: '0 0 20px rgba(255,220,150,0.4), 0 0 40px rgba(255,220,150,0.2)' }}
        />
      )}
    </div>
  );
}
