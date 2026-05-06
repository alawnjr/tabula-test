export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "false") return false;
  if (process.env.DEMO_MODE === "true") return true;
  // Auto-fallback: demo if a relevant key is missing.
  return !process.env.ANTHROPIC_API_KEY || !isTellerConfigured();
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isTellerConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_TELLER_APPLICATION_ID;
}
