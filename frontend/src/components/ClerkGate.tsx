'use client';

import React from 'react';
import { SignedIn as ClerkSignedIn, SignedOut as ClerkSignedOut, UserButton as ClerkUserButton } from '@clerk/nextjs';
import { useClerkConfigured } from '@/components/ClerkProviderWrapper';

// Drop-in replacements for Clerk's <SignedIn>/<SignedOut>/<UserButton> that
// degrade gracefully when NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY isn't set (CI
// builds, or before Clerk is configured locally). The real Clerk components
// throw "can only be used within a <ClerkProvider>" if rendered without one
// -- which is exactly what happens in that case, since ClerkProviderWrapper
// intentionally skips mounting a <ClerkProvider> rather than crash the app
// over a missing key. The app's own session system (src/lib/auth.ts) is the
// actual source of truth for whether someone is logged in either way; these
// only gate the optional Clerk-specific UI (the OAuth user button, etc).

export function SafeSignedIn({ children }: { children: React.ReactNode }) {
  const configured = useClerkConfigured();
  if (!configured) return null;
  return <ClerkSignedIn>{children}</ClerkSignedIn>;
}

export function SafeSignedOut({ children }: { children: React.ReactNode }) {
  const configured = useClerkConfigured();
  if (!configured) return <>{children}</>;
  return <ClerkSignedOut>{children}</ClerkSignedOut>;
}

export function SafeUserButton(props: React.ComponentProps<typeof ClerkUserButton>) {
  const configured = useClerkConfigured();
  if (!configured) return null;
  return <ClerkUserButton {...props} />;
}
