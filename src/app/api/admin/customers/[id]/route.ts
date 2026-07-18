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

  const [profileResult, ordersResult] = await Promise.all([
    db.from('profiles')
      .select('id, full_name, email, phone, avatar_url, provider, created_at, last_sign_in_at, is_active, addresses')
      .eq('id', id)
      .single(),
    db.from('orders')
      .select('id, status, total_amount, created_at, shipping_address')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (profileResult.error) return Response.json({ error: 'Customer not found' }, { status: 404 });

  const orders = ordersResult.data ?? [];
  const totalOrders = orders.length;
  const totalSpent  = orders
    .filter((o: any) => o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + (o.total_amount ?? 0), 0);

  return Response.json({
    ...profileResult.data,
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

  const { error } = await adminClient()
    .from('profiles')
    .update(allowed)
    .eq('id', id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await verifyAdmin()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  // Delete the auth user — profile cascades via FK on delete cascade
  const { error } = await adminClient().auth.admin.deleteUser(id);
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
