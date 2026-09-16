'use client';

import React, { createContext, useContext } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const CLERK_CONFIGURED = Boolean(
  PUBLISHABLE_KEY && (PUBLISHABLE_KEY.startsWith('pk_test_') || PUBLISHABLE_KEY.startsWith('pk_live_'))
);

const ClerkConfiguredContext = createContext(false);

// Components that render Clerk's own UI (SignedIn/SignedOut/UserButton)
// must check this before rendering the real Clerk components -- those
// throw "can only be used within a <ClerkProvider>" if mounted while
// ClerkProviderWrapper has taken the no-key fallback path below. See
// ClerkGate.tsx for the drop-in-safe versions that check it for you.
export function useClerkConfigured() {
  return useContext(ClerkConfiguredContext);
}

export function ClerkProviderWrapper({ children }: { children: React.ReactNode }) {
  if (CLERK_CONFIGURED) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ClerkConfiguredContext.Provider value={true}>
          {children}
        </ClerkConfiguredContext.Provider>
      </ClerkProvider>
    );
  }

  // Graceful fallback when Clerk keys are not configured yet (e.g. CI
  // builds, or before a developer has set up their own Clerk project).
  return (
    <ClerkConfiguredContext.Provider value={false}>
      {children}
    </ClerkConfiguredContext.Provider>
  );
}
