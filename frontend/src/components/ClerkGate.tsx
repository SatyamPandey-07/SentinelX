'use client';

import React, { useEffect, useState } from 'react';
import {
  SignedIn as ClerkSignedIn,
  SignedOut as ClerkSignedOut,
  UserButton as ClerkUserButton,
  useClerk,
  useSignIn,
  useSignUp,
} from '@clerk/nextjs';
import { useClerkConfigured } from '@/components/ClerkProviderWrapper';

type ClerkResource = ReturnType<typeof useClerk>;
type SignInResource = ReturnType<typeof useSignIn>['signIn'];
type SignUpResource = ReturnType<typeof useSignUp>['signUp'];

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

// Hooks like useClerk(), useSignIn(), useSignUp() throw "must be used within a <ClerkProvider>"
// when rendered without one. This bridge only mounts and calls the hooks when
// useClerkConfigured() confirms a <ClerkProvider> exists.
function AuthBridge({
  onClerkReady,
  onSignInReady,
  onSignUpReady,
}: {
  onClerkReady?: (clerk: ClerkResource) => void;
  onSignInReady?: (signIn: SignInResource) => void;
  onSignUpReady?: (signUp: SignUpResource) => void;
}) {
  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  useEffect(() => {
    if (onClerkReady) onClerkReady(clerk);
  }, [clerk, onClerkReady]);

  useEffect(() => {
    if (onSignInReady) onSignInReady(signIn);
  }, [signIn, onSignInReady]);

  useEffect(() => {
    if (onSignUpReady) onSignUpReady(signUp);
  }, [signUp, onSignUpReady]);

  return null;
}

export function useSafeAuth(): {
  clerk: ClerkResource | undefined;
  signIn: SignInResource;
  signUp: SignUpResource;
  bridge: React.ReactNode;
} {
  const configured = useClerkConfigured();
  const [clerk, setClerk] = useState<ClerkResource | undefined>(undefined);
  const [signIn, setSignIn] = useState<SignInResource>(undefined);
  const [signUp, setSignUp] = useState<SignUpResource>(undefined);

  return {
    clerk,
    signIn,
    signUp,
    bridge: configured ? (
      <AuthBridge
        onClerkReady={setClerk}
        onSignInReady={setSignIn}
        onSignUpReady={setSignUp}
      />
    ) : null,
  };
}

export function useSafeSignIn(): { signIn: SignInResource; bridge: React.ReactNode } {
  const { signIn, bridge } = useSafeAuth();
  return { signIn, bridge };
}

export function useSafeClerk(): { clerk: ClerkResource | undefined; bridge: React.ReactNode } {
  const { clerk, bridge } = useSafeAuth();
  return { clerk, bridge };
}
