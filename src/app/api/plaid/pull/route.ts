import { NextRequest } from "next/server";
import { getAccessToken } from "@/lib/integrations/plaidTokens";
import { pullPlaidData } from "@/lib/integrations/plaidPull";
import { buildPatches } from "@/lib/integrations/mapping";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    caseId?: string;
  };
  const caseId = body.caseId ?? "demo";
  const token = getAccessToken(caseId) ?? "demo-access-token";

  try {
    const extracted = await pullPlaidData(token);
    const patches = buildPatches(extracted);
    return Response.json({ extracted, patches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Plaid pull failed: ${msg}` }, { status: 500 });
  }
}
