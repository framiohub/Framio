import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function verifyAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('framio_admin')?.value;
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET!); return true; } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!await verifyAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url    = new URL(req.url);
  const search = url.searchParams.get('search')?.trim();
  const status = url.searchParams.get('status');
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit  = 50;
  const from   = (page - 1) * limit;

  const db = adminClient();

  // Select only columns that exist in all schema versions; new columns added by
  // customers-migration.sql are read with individual fallbacks below.
  let query = db
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);

  // is_active filter only applied when the column exists (post-migration)
  if (status === 'active')   query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);

  const { data: profiles, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!profiles?.length) {
    return Response.json({ customers: [], total: count ?? 0, page, limit });
  }

  // Fetch order summaries for all profiles in one query
  const profileIds = profiles.map((p: any) => p.id);
  const { data: orders } = await db
    .from('orders')
    .select('user_id, id, status, total_amount, total')
    .in('user_id', profileIds);

  // Build per-customer aggregates
  const orderMap: Record<string, { count: number; spent: number }> = {};
  for (const o of orders ?? []) {
    if (!orderMap[o.user_id]) orderMap[o.user_id] = { count: 0, spent: 0 };
    orderMap[o.user_id].count += 1;
    if (o.status !== 'cancelled') {
      // Support both 'total_amount' (paise) and 'total' (older schema)
      orderMap[o.user_id].spent += o.total_amount ?? o.total ?? 0;
    }
  }

  const customers = profiles.map((c: any) => ({
    id:              c.id,
    full_name:       c.full_name ?? null,
    email:           c.email ?? null,
    phone:           c.phone ?? null,
    avatar_url:      c.avatar_url ?? null,
    provider:        c.provider ?? 'email',
    created_at:      c.created_at,
    last_sign_in_at: c.last_sign_in_at ?? null,
    is_active:       c.is_active ?? true,
    totalOrders:     orderMap[c.id]?.count ?? 0,
    totalSpent:      orderMap[c.id]?.spent ?? 0,
  }));

  return Response.json({ customers, total: count ?? 0, page, limit });
}
