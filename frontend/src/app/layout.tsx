import './globals.css';
import type { Metadata } from 'next';
import { Sora, JetBrains_Mono } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { ClerkProviderWrapper } from '@/components/ClerkProviderWrapper';

const sora = Sora({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sora',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SentinelX | Distributed Emergency Operations & 3D Defense Platform',
  description: 'Mission-critical distributed incident response and tactical campus dispatch platform with 3D defense grid',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${sora.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-background text-slate-100 min-h-screen">
        <ClerkProviderWrapper>
          <AppShell>{children}</AppShell>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}
