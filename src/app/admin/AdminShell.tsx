'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import AdminNav from './AdminNav';

interface Props {
  children: React.ReactNode;
  name: string;
  email: string;
  initials: string;
}

export default function AdminShell({ children, name, email, initials }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5EDE5]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Mobile top bar (hidden on md+) ───────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14
                          bg-[#2D1F1A] flex items-center px-4 gap-3">
        <button
          onClick={() => setOpen(true)}
          className="p-1.5 text-white/60 hover:text-white transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Image
            src="/logo.png"
            alt="Framio"
            width={26}
            height={26}
            className="rounded-md border border-white/20 flex-shrink-0"
          />
          <span className="text-white font-bold text-sm truncate">Framio Admin</span>
        </div>

        <div className="w-8 h-8 rounded-full bg-[#C4634F] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-[11px] font-bold">{initials}</span>
        </div>
      </header>

      {/* ── Backdrop (mobile only) ────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={[
          'w-[220px] bg-[#2D1F1A] flex flex-col fixed h-screen z-[9999]',
          'transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
        ].join(' ')}
      >
        {/* Mobile close */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-3 p-1 text-white/40 hover:text-white transition-colors"
          aria-label="Close navigation"
        >
          <X size={16} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-[14px] border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Framio"
            width={30}
            height={30}
            className="rounded-lg border border-white/20 flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-white font-bold text-[13px] leading-tight">Framio</p>
            <p className="text-white/35 text-[10px] leading-tight">Admin Panel</p>
          </div>
        </div>

        {/* Nav — passes close callback so drawer shuts on navigation */}
        <AdminNav onNavigate={() => setOpen(false)} />

        {/* User footer */}
        <div className="flex-shrink-0 border-t border-white/10 px-2 py-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-[#C4634F] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-[12px] font-semibold truncate leading-tight">{name}</p>
              <p className="text-white/40 text-[10px] truncate leading-tight mt-0.5">{email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      {/* pt-14 on mobile offsets the fixed top bar; md:pt-0 + md:ml-[220px] for desktop */}
      <main className="md:ml-[220px] min-h-screen pt-14 md:pt-0 overflow-auto">
        {children}
      </main>

      {/* Suppress third-party chat widgets inside admin */}
      <style>{`
        body > div[class*="tawk"],
        body > div[id*="tawk"],
        body > iframe[src*="tawk"],
        body > div[class*="crisp"],
        body > div[id*="crisp-client"],
        body > div[id*="tidio"],
        body > div[id*="intercom"],
        body > div[id*="hubspot"],
        body > div[class*="widget-bubble"],
        body > div[class*="chat-widget"],
        body > div[id*="chat-widget"],
        body > div[style*="z-index: 999"],
        body > div[style*="z-index:999"] { display: none !important; }
      `}</style>
    </div>
  );
}
