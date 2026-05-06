// In-memory access_token store keyed by caseId. Demo only — replace with DB.

declare global {
  // eslint-disable-next-line no-var
  var __TELLER_TOKENS__: Map<string, string> | undefined;
}

function store(): Map<string, string> {
  if (!globalThis.__TELLER_TOKENS__) globalThis.__TELLER_TOKENS__ = new Map();
  return globalThis.__TELLER_TOKENS__;
}

export function setAccessToken(caseId: string, token: string): void {
  store().set(caseId, token);
}

export function getAccessToken(caseId: string): string | undefined {
  return store().get(caseId);
}
