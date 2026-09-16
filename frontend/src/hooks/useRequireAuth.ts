'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useRequireAuth(enabled: boolean) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem('sentinelx_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    setReady(true);
  }, [enabled, router]);

  return !enabled || ready;
}
