import { NextRequest } from "next/server";
import { extractFromPdf, type ExtractionPracticeArea } from "@/lib/integrations/extractor";
import { buildPatches } from "@/lib/integrations/mapping";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: `Unsupported type: ${file.type || "unknown"}` },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File too large (${file.size} bytes; max ${MAX_BYTES})` },
      { status: 413 }
    );
  }

  const practiceAreaRaw = form?.get("practiceArea");
  const practiceArea: ExtractionPracticeArea =
    practiceAreaRaw === "estateAdmin" ? "estateAdmin" : "bankruptcy";

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const extracted = await extractFromPdf(bytes, file.name, practiceArea);
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
