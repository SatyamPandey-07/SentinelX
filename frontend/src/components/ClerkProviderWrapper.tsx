'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  // If user has provided a valid Clerk publishable key (starts with pk_test_ or pk_live_)
  if (PUBLISHABLE_KEY && (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_'))) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        {children}
      </ClerkProvider>
    );
  }

  // Graceful fallback when Clerk keys are not configured yet
  return <>{children}</>;
}
