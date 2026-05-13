"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="flex items-center gap-3 text-[12px] text-[var(--mute)]">
        <span
          aria-hidden
          className="block h-3.5 w-3.5 animate-spin rounded-full border border-[var(--rule)] border-t-[var(--ink)]"
        />
        Completing sign-in…
      </div>
      <AuthenticateWithRedirectCallback
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/"
      />
    </main>
  );
}
