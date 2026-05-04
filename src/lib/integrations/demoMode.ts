export function isDemoMode(): boolean {
  if (process.env.DEMO_MODE === "false") return false;
  if (process.env.DEMO_MODE === "true") return true;
  // Auto-fallback: demo if a relevant key is missing.
  return !process.env.ANTHROPIC_API_KEY || !process.env.PLAID_CLIENT_ID;
}

export function isAnthropicConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function isPlaidConfigured(): boolean {
  return !!(process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET);
}
