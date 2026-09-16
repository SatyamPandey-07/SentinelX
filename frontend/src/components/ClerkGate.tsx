'use client';

import React, { useEffect, useState } from 'react';
import { SignedIn as ClerkSignedIn, SignedOut as ClerkSignedOut, UserButton as ClerkUserButton, useSignIn } from '@clerk/nextjs';
import { useClerkConfigured } from '@/components/ClerkProviderWrapper';

type SignInResource = ReturnType<typeof useSignIn>['signIn'];

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

// useSignIn() throws the exact same "must be used within a <ClerkProvider>"
// error as useUser() when called without one -- calling it directly in a
// page component (e.g. the login page's social-auth handler) is the same
// bug class that broke the CI build for sso-callback. A hook can't
// conditionally call another hook, so instead this renders a tiny bridge
// component that only ever mounts (and thus only ever calls the real
// useSignIn()) when useClerkConfigured() confirms a <ClerkProvider>
// actually exists; render the returned `bridge` element anywhere in your
// tree and read `signIn` once it's ready.
function SignInBridge({ onReady }: { onReady: (signIn: SignInResource) => void }) {
  const { signIn } = useSignIn();
  useEffect(() => {
    onReady(signIn);
  }, [signIn, onReady]);
  return null;
}

export function useSafeSignIn(): { signIn: SignInResource; bridge: React.ReactNode } {
  const configured = useClerkConfigured();
  const [signIn, setSignIn] = useState<SignInResource>(undefined);

  return {
    signIn,
    bridge: configured ? <SignInBridge onReady={setSignIn} /> : null,
  };
}
