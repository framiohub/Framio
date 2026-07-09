import { createClient } from '@supabase/supabase-js';
import { Product } from '@/types';
import ProductsContent from './ProductsContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env vars not configured');
  return createClient(url, key);
}

function mapRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    basePrice: Number(row.base_price ?? 0),
    type: row.type ?? 'single',
    sizes: [],
    materials: [],
    images: row.images ?? [],
    badge: row.badge || undefined,
    rating: Number(row.rating ?? 0),
    reviewCount: Number(row.review_count ?? 0),
    occasion: row.occasion ?? [],
    photoSlots: Number(row.photo_slots ?? 1),
    featured: row.featured ?? false,
  };
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await db()
      .from('products')
      .select('id, name, description, base_price, type, photo_slots, images, badge, rating, review_count, occasion, featured')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(mapRow);
  } catch {
    return [];
  }
}

export default async function ProductsPage() {
  const products = await fetchProducts();
  return <ProductsContent products={products} />;
}
