// Redacts PII from strings before they leave the server.
// Goal: keep enough signal for mapping (last-4s) without exposing full numbers.

const SSN_RE = /\b(?!000|666|9\d{2})\d{3}-?(?!00)\d{2}-?(?!0000)\d{4}\b/g;
const ROUTING_RE = /\b\d{9}\b/g;
const ACCOUNT_RE = /\b\d{8,17}\b/g;
const CARD_RE = /\b(?:\d[ -]?){13,19}\b/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

function keepLast4(match: string): string {
  const digits = match.replace(/\D/g, "");
  if (digits.length < 4) return "[REDACTED]";
  return `***${digits.slice(-4)}`;
}

export function redactString(input: string): string {
  if (!input) return input;
  return input
    .replace(SSN_RE, "[SSN-REDACTED]")
    .replace(CARD_RE, keepLast4)
    .replace(ACCOUNT_RE, keepLast4)
    .replace(ROUTING_RE, "[ROUTING-REDACTED]")
    .replace(EMAIL_RE, "[EMAIL-REDACTED]");
}

export function redactDeep<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") return redactString(value) as unknown as T;
  if (Array.isArray(value)) {
    return value.map((v) => redactDeep(v)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactDeep(v);
    }
    return out as T;
  }
  return value;
}
