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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const db = adminClient();

  // Fetch profile with * to work whether or not migration SQL has been run
  const [profileResult, ordersResult] = await Promise.all([
    db.from('profiles').select('*').eq('id', id).single(),
    db.from('orders')
      .select('id, status, total_amount, total, created_at, shipping_address')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error) return Response.json({ error: 'Customer not found' }, { status: 404 });

  const p = profileResult.data as Record<string, any>;
  const orders = (ordersResult.data ?? []).map((o: any) => ({
    id:              o.id,
    status:          o.status,
    total_amount:    o.total_amount ?? o.total ?? 0,
    created_at:      o.created_at,
    shipping_address: o.shipping_address,
  }));

  const totalOrders = orders.length;
  const totalSpent  = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_amount ?? 0), 0);

  return Response.json({
    id:              p.id,
    full_name:       p.full_name ?? null,
    email:           p.email ?? null,
    phone:           p.phone ?? null,
    avatar_url:      p.avatar_url ?? null,
    provider:        p.provider ?? 'email',
    created_at:      p.created_at,
    last_sign_in_at: p.last_sign_in_at ?? null,
    is_active:       p.is_active ?? true,
    addresses:       p.addresses ?? [],
    orders,
    totalOrders,
    totalSpent,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const allowed: Record<string, unknown> = {};
  if (typeof body.is_active === 'boolean') allowed.is_active = body.is_active;
  if (typeof body.phone === 'string') allowed.phone = body.phone;

  const { error } = await adminClient().from('profiles').update(allowed).eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
