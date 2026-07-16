import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, Shield, Star, ChevronRight, Layers, PackageCheck, Sparkles } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { Product } from '@/types';
import { ProductImageGallery } from './ProductImageGallery';
import { AddToCartSection } from './AddToCartSection';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FRAME_ICONS: Record<string, string> = {
  single: '🖼️',
  'collage-3': '🗂️',
  'collage-5': '🎨',
  couple: '💑',
  led: '✨',
  desk: '🪴',
};

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

async function fetchProduct(id: string): Promise<Product | null> {
  const client = db();

  const { data: row, error } = await client
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .eq('is_active', true)
    .single();

  if (error || !row) return null;

  const { data: variants } = await client
    .from('product_variants')
    .select('*')
    .eq('product_id', id)
    .eq('is_active', true)
    .order('sort_order');

  const v = variants ?? [];

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    basePrice: Number(row.base_price ?? 0),
    type: row.type ?? 'single',
    sizes: v
      .filter((x: any) => x.variant_type === 'size')
      .map((x: any) => ({ label: x.label, value: x.value, price: Number(x.price ?? 0) })),
    materials: v
      .filter((x: any) => x.variant_type === 'material')
      .map((x: any) => ({
        label: x.label, value: x.value,
        priceAdder: Number(x.price_adder ?? 0), color: x.color ?? '#888888',
      })),
    images: row.images ?? [],
    badge: row.badge || undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    occasion: row.occasion ?? [],
    photoSlots: Number(row.photo_slots ?? 1),
    featured: row.featured ?? false,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();

  const lowestPrice  = product.sizes.length > 0 ? Math.min(...product.sizes.map(s => s.price)) : product.basePrice;
  const highestPrice = product.sizes.length > 0 ? Math.max(...product.sizes.map(s => s.price)) : product.basePrice;

  const fallbackVisual = (
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div className="w-48 h-60 rounded-xl shadow-2xl bg-[#C4A882] border-8 border-[#B8966E] flex items-center justify-center">
        <div className="w-36 h-44 bg-[#EDE0D0]/60 rounded-lg flex items-center justify-center text-5xl">
          {FRAME_ICONS[product.type] ?? '🖼️'}
        </div>
      </div>
      {product.photoSlots > 1 && (
        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-bold text-[#C4634F] shadow">
          {product.photoSlots} photo layout
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8">
        <Link href="/products" className="flex items-center gap-1 text-sm text-[#7A6A64] hover:text-[#C4634F] transition-colors">
          <ArrowLeft size={14} /> All Frames
        </Link>
        <ChevronRight size={13} className="text-[#E8DDD6]" />
        <span className="text-sm text-[#2D1F1A] font-medium">{product.name}</span>
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Left: Gallery */}
        <ProductImageGallery
          images={product.images}
          productName={product.name}
          fallback={fallbackVisual}
          badge={product.badge ? <Badge>{product.badge}</Badge> : undefined}
        />

        {/* Right: Info + Add to Cart */}
        <div className="flex flex-col justify-start">
          {product.badge && <Badge className="mb-3 self-start">{product.badge}</Badge>}
          <h1 className="text-3xl md:text-4xl font-bold text-[#2D1F1A] mb-3">{product.name}</h1>

          {product.rating > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <StarRating rating={product.rating} showCount count={product.reviewCount} size="md" />
            </div>
          )}

          <p className="text-[#7A6A64] leading-relaxed mb-5">{product.description}</p>

          {/* Starting price (shown above the selector) */}
          <div className="mb-6">
            <p className="text-xs text-[#7A6A64] mb-1">Starting from</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#C4634F]">{formatPrice(lowestPrice)}</span>
              {highestPrice > lowestPrice && (
                <span className="text-[#7A6A64] text-sm">– {formatPrice(highestPrice)}</span>
              )}
            </div>
          </div>

          {/* Size + Material + Add to Cart — all client-side */}
          <AddToCartSection product={product} />

          {/* Customize Frame CTA */}
          <Link
            href={`/customize/${product.id}`}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl border-2 border-dashed border-[#C4634F]/40 text-[#C4634F] hover:border-[#C4634F] hover:bg-[#FFF4F2] transition-all"
          >
            <Sparkles size={15} />
            Customize This Frame — Upload Photo & Add Text
          </Link>

          {/* Trust signals */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              { icon: <Truck size={14} />, text: 'Delivered in 3–5 days' },
              { icon: <Shield size={14} />, text: '100% secure payment' },
              { icon: <Star size={14} />, text: 'Premium quality print' },
              { icon: <PackageCheck size={14} />, text: 'Damage-free delivery guaranteed' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-[#7A6A64]">
                <span className="text-[#C4634F]">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frame details + delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={16} className="text-[#C4634F]" />
            <h3 className="font-bold text-[#2D1F1A]">Frame Details</h3>
          </div>
          <dl className="space-y-3">
            {[
              ['Type',          product.type.replace(/-/g, ' ')],
              ['Photos needed', product.photoSlots === 1 ? '1 photo' : `${product.photoSlots} photos`],
              ...(product.sizes.length > 0     ? [['Available sizes', product.sizes.map(s => s.label).join(', ')]] : []),
              ...(product.materials.length > 0  ? [['Finishes',       product.materials.map(m => m.label).join(', ')]] : []),
              ['Made in', 'India 🇮🇳'],
            ].map(([dt, dd]) => (
              <div key={String(dt)} className="flex justify-between text-sm">
                <dt className="text-[#7A6A64]">{dt}</dt>
                <dd className="font-medium text-[#2D1F1A] capitalize text-right max-w-[60%]">{dd}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8DDD6] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={16} className="text-[#C4634F]" />
            <h3 className="font-bold text-[#2D1F1A]">Delivery &amp; Returns</h3>
          </div>
          <ul className="space-y-3 text-sm text-[#7A6A64]">
            <li className="flex gap-3">
              <Truck size={16} className="text-[#C4634F] flex-shrink-0 mt-0.5" />
              Standard delivery in <strong className="text-[#2D1F1A]">3–5 working days</strong> across India
            </li>
            <li className="flex gap-3">
              <Shield size={16} className="text-[#C4634F] flex-shrink-0 mt-0.5" />
              <strong className="text-[#2D1F1A]">Free delivery</strong> on orders above ₹999
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
