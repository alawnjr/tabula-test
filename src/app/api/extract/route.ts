import { NextRequest } from "next/server";
import { getDoc } from "@/lib/integrations/store";
import { extractFromPdf } from "@/lib/integrations/extractor";
import { buildPatches } from "@/lib/integrations/mapping";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    docId?: string;
  } | null;
  if (!body?.docId) {
    return Response.json({ error: "Missing docId" }, { status: 400 });
  }
  const doc = getDoc(body.docId);
  if (!doc) {
    return Response.json({ error: "Doc not found" }, { status: 404 });
  }

  try {
    const extracted = await extractFromPdf(doc.bytes, doc.filename);
    const patches = buildPatches(extracted);
    return Response.json({ extracted, patches });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { error: `Extraction failed: ${msg}` },
      { status: 500 }
    );
  }
}
