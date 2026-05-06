import { NextRequest } from "next/server";
import { getAccessToken } from "@/lib/integrations/tellerTokens";
import { pullTellerData } from "@/lib/integrations/tellerPull";
import { buildPatches } from "@/lib/integrations/mapping";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    caseId?: string;
    months?: number;
  };
  const caseId = body.caseId ?? "demo";
  const token = getAccessToken(caseId) ?? "demo-access-token";
  const months = typeof body.months === "number" ? body.months : undefined;

  try {
    const extracted = await pullTellerData(token, months);
    const patches = buildPatches(extracted);
    return Response.json({ extracted, patches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Teller pull failed: ${msg}` }, { status: 500 });
  }
}
