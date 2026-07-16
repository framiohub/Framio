import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Product } from '@/types';
import { CustomizeClient } from './CustomizeClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
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
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  return {
    title: product ? `Customize ${product.name} — Framio` : 'Customize Frame — Framio',
  };
}

export default async function CustomizeProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) notFound();
  return <CustomizeClient product={product} />;
}
