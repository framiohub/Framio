'use client';

import { LogOut } from 'lucide-react';

export default function LogoutButton() {
  return (
    <button
      onClick={async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        window.location.href = '/auth/login';
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300
                 text-[11px] font-medium transition-all flex-shrink-0"
    >
      <LogOut size={12} />
      Sign out
    </button>
  );
}
