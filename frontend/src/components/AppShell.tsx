'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';

  if (isLandingPage) {
    return (
      <SmoothScrollProvider>
        <div className="w-full min-h-screen bg-[#060911] text-slate-100 flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
          {children}
        </div>
      </SmoothScrollProvider>
    );
  }

  return (
    <div className="bg-background text-slate-100 min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
