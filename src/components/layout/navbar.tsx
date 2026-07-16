'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, User, Menu, X, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { createClient } from '@/lib/supabase/client';

const ADMIN_EMAIL = 'admin@framio.shop';

const NAV_LINKS = [
  { label: 'Home',          href: '/' },
  { label: 'Shop',          href: '/products' },
  { label: 'Custom Frames', href: '/customize' },
  { label: 'About',         href: '/about' },
  { label: 'Contact',       href: '/contact' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted]       = useState(false);
  const [isAdmin, setIsAdmin]       = useState(false);
  const totalItems = useCartStore(s => s.totalItems());

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email === ADMIN_EMAIL) setIsAdmin(true);
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E8DDD6] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image src="/logo.png" alt="Framio" width={36} height={36} className="rounded-lg border border-[#E8DDD6]" priority />
            <div>
              <span className="font-bold text-[#2D1F1A] text-lg tracking-tight">Framio</span>
              <span className="block text-[10px] text-[#7A6A64] leading-none -mt-0.5">Made with Love</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href}
                className="text-sm font-medium text-[#7A6A64] hover:text-[#C4634F] transition-colors">
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {mounted && isAdmin && (
              <Link href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#2D1F1A] text-white text-xs font-semibold rounded-xl hover:bg-[#C4634F] transition-all"
                aria-label="Admin Dashboard">
                <LayoutDashboard size={13} /> Admin
              </Link>
            )}

            <Link href="/account"
              className="p-2 text-[#7A6A64] hover:text-[#C4634F] hover:bg-[#F5EDE5] rounded-xl transition-all"
              aria-label="Account">
              <User size={20} />
            </Link>

            <Link href="/cart"
              className="relative p-2 text-[#7A6A64] hover:text-[#C4634F] hover:bg-[#F5EDE5] rounded-xl transition-all"
              aria-label="Cart">
              <ShoppingCart size={20} />
              {mounted && totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#C4634F] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            <button
              className="md:hidden p-2 text-[#7A6A64] hover:text-[#C4634F] hover:bg-[#F5EDE5] rounded-xl transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 border-t border-[#E8DDD6] pt-4">
            {NAV_LINKS.map(({ label, href }) => (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-[#7A6A64] hover:text-[#C4634F] hover:bg-[#F5EDE5] rounded-xl transition-all">
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-white bg-[#2D1F1A] rounded-xl">
                <LayoutDashboard size={15} /> Admin Dashboard
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
