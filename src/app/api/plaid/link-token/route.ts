import { NextRequest } from "next/server";
import { isPlaidConfigured } from "@/lib/integrations/demoMode";
import {
  getCountryCodes,
  getPlaidClient,
  getProducts,
} from "@/lib/integrations/plaidClient";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    userId?: string;
    caseId?: string;
  };
  const userId = body.userId ?? body.caseId ?? "demo-user";

  if (!isPlaidConfigured()) {
    return Response.json({
      mock: true,
      link_token: "demo-link-token",
      expiration: new Date(Date.now() + 30 * 60_000).toISOString(),
    });
  }

  const client = getPlaidClient();
  const resp = await client.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: "Case Builder",
    products: getProducts(),
    country_codes: getCountryCodes(),
    language: "en",
  });
  return Response.json({
    link_token: resp.data.link_token,
    expiration: resp.data.expiration,
  });
}
