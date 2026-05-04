import { NextRequest } from "next/server";
import { isPlaidConfigured } from "@/lib/integrations/demoMode";
import { getPlaidClient } from "@/lib/integrations/plaidClient";
import { setAccessToken } from "@/lib/integrations/plaidTokens";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    public_token?: string;
    caseId?: string;
  };
  const caseId = body.caseId ?? "demo";

  if (!isPlaidConfigured() || body.public_token === "demo-public-token") {
    setAccessToken(caseId, "demo-access-token");
    return Response.json({ mock: true, ok: true });
  }

  if (!body.public_token) {
    return Response.json({ error: "Missing public_token" }, { status: 400 });
  }

  const client = getPlaidClient();
  const resp = await client.itemPublicTokenExchange({
    public_token: body.public_token,
  });
  setAccessToken(caseId, resp.data.access_token);
  return Response.json({ ok: true, item_id: resp.data.item_id });
}
