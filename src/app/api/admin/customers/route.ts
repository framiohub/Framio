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
  const status = url.searchParams.get('status'); // 'active' | 'inactive' | ''
  const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
  const limit  = 50;
  const from   = (page - 1) * limit;

  let query = adminClient()
    .from('profiles')
    .select(`
      id, full_name, email, phone, avatar_url, provider,
      created_at, last_sign_in_at, is_active,
      orders(id, total_amount, status)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  if (status === 'active')   query = query.eq('is_active', true);
  if (status === 'inactive') query = query.eq('is_active', false);

  const { data, error, count } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const customers = (data ?? []).map((c: any) => {
    const orders = (c.orders ?? []) as { status: string; total_amount: number }[];
    const totalOrders = orders.length;
    const totalSpent  = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);
    return { ...c, orders: undefined, totalOrders, totalSpent };
  });

  return Response.json({ customers, total: count ?? 0, page, limit });
}
