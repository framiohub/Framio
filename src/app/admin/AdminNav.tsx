'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingBag,
  Tag, Archive, Star, Users, TrendingUp, RotateCcw, Settings, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { section: 'Overview', links: [
    { href: '/admin',           label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  ]},
  { section: 'Store', links: [
    { href: '/admin/orders',    label: 'Orders',    icon: Package },
    { href: '/admin/returns',   label: 'Returns',   icon: RotateCcw },
    { href: '/admin/products',  label: 'Products',  icon: ShoppingBag },
    { href: '/admin/inventory', label: 'Inventory', icon: Archive },
    { href: '/admin/coupons',   label: 'Coupons',   icon: Tag },
  ]},
  { section: 'Community', links: [
    { href: '/admin/reviews',   label: 'Reviews',   icon: Star },
    { href: '/admin/customers', label: 'Customers', icon: Users },
  ]},
  { section: 'Settings', links: [
    { href: '/admin/settings',  label: 'Settings',  icon: Settings },
  ]},
];

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-2">
      {NAV.map(({ section, links }) => (
        <div key={section} className="mb-2">

          {/* Section heading */}
          <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30 select-none">
            {section}
          </p>

          {/* Nav links */}
          {links.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-[#C4634F] text-white shadow-sm'
                    : 'text-white/55 hover:text-white hover:bg-white/8',
                )}
              >
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.75}
                  className="flex-shrink-0"
                />
                <span className="flex-1 leading-none">{label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/55 flex-shrink-0" />
                )}
              </Link>
            );
          })}

          {/* Logout button — renders after the Settings section */}
          {section === 'Settings' && (
            <button
              onClick={() => { onNavigate?.(); handleLogout(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 text-red-400 hover:text-red-300 hover:bg-red-500/12"
            >
              <LogOut size={16} strokeWidth={1.75} className="flex-shrink-0" />
              <span className="flex-1 leading-none text-left">Sign Out</span>
            </button>
          )}
        </div>
      ))}
    </nav>
  );
}
