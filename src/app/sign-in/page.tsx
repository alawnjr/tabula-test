"use client";

import { useSignIn } from "@clerk/nextjs/legacy";
import type { OAuthStrategy } from "@clerk/shared/types";
import Link from "next/link";
import { useState } from "react";

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn();
  const [pending, setPending] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInWith(strategy: OAuthStrategy) {
    if (!isLoaded) return;
    setError(null);
    setPending(strategy);
    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      setPending(null);
      setError(
        err instanceof Error ? err.message : "Could not start sign-in. Try again.",
      );
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-[380px]">
        <div className="mb-10 text-center">
          <Link href="/" className="logo inline-block">
            Tabula<span className="logo-dot" />
          </Link>
        </div>

        <div className="rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-8">
          <div className="space-y-2">
            <span className="pill">
              <span className="dot pulse" />
              Sign in
            </span>
            <h1
              className="text-[28px] leading-[1.1] tracking-[-0.02em] text-[var(--ink)]"
              style={{ fontFamily: "var(--serif)" }}
            >
              <em>Welcome back.</em>
            </h1>
            <p className="text-[13px] font-light leading-relaxed text-[var(--ink-2)]">
              Continue with your provider to open your practice workspace.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <ProviderButton
              label="Continue with Google"
              loading={pending === "oauth_google"}
              disabled={!isLoaded || pending !== null}
              onClick={() => signInWith("oauth_google")}
              icon={<GoogleIcon />}
            />
            <ProviderButton
              label="Continue with Facebook"
              loading={pending === "oauth_facebook"}
              disabled={!isLoaded || pending !== null}
              onClick={() => signInWith("oauth_facebook")}
              icon={<FacebookIcon />}
            />
          </div>

          {error ? (
            <p className="mt-5 text-[12px] text-[var(--destructive)]">{error}</p>
          ) : null}

          <p className="mt-8 text-center text-[11px] font-light text-[var(--mute)]">
            By continuing you agree to the terms of use and privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}

function ProviderButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group flex w-full items-center justify-center gap-3 rounded-[3px] border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-[13px] text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--paper-2)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-4 w-4 items-center justify-center">
        {loading ? <Spinner /> : icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="block h-3.5 w-3.5 animate-spin rounded-full border border-[var(--rule)] border-t-[var(--ink)]"
    />
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" aria-hidden className="h-4 w-4">
      <path
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.92v2.32A9 9 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.97 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.96H.92A9 9 0 0 0 0 9c0 1.45.35 2.83.92 4.04l3.05-2.32Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .92 4.96l3.05 2.32C4.68 5.16 6.66 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4">
      <path
        d="M24 12a12 12 0 1 0-13.88 11.85v-8.38H7.08V12h3.04V9.36c0-3 1.79-4.67 4.53-4.67 1.31 0 2.68.23 2.68.23v2.95H15.83c-1.49 0-1.96.93-1.96 1.88V12h3.33l-.53 3.47h-2.8v8.38A12 12 0 0 0 24 12Z"
        fill="#1877F2"
      />
    </svg>
  );
}
