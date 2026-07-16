import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import AdminShell from './AdminShell';

export const runtime = 'nodejs';

async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('framio_admin')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as { name: string; email: string; role: string };
  } catch { return null; }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminUser();
  if (!admin) redirect('/auth/login');

  const initials = admin.name
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <AdminShell name={admin.name} email={admin.email} initials={initials}>
      {children}
    </AdminShell>
  );
}
