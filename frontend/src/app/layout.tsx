import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'SentinelX | Distributed Emergency Operations Platform',
  description: 'Mission-critical distributed incident response and tactical campus dispatch platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
