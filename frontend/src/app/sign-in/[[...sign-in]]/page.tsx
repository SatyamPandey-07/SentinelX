'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/login?mode=signin');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#060911] flex items-center justify-center text-xs font-mono text-slate-400">
      REDIRECTING TO SECURE LOGIN...
    </div>
  );
}
