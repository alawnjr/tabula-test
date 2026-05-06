import { NextRequest } from "next/server";
import { setAccessToken } from "@/lib/integrations/tellerTokens";

export const runtime = "nodejs";

// Teller Connect returns the access_token directly to the client (no server
// public_token exchange like Plaid). The client POSTs it here so the server
// can call the Teller API on the user's behalf.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    accessToken?: string;
    caseId?: string;
  };
  const caseId = body.caseId ?? "demo";

  if (!body.accessToken) {
    return Response.json({ error: "Missing accessToken" }, { status: 400 });
  }

  setAccessToken(caseId, body.accessToken);
  return Response.json({
    ok: true,
    mock: body.accessToken === "demo-access-token",
  });
}
