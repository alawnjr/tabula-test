import { NextRequest } from "next/server";
import { putDoc } from "@/lib/integrations/store";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg"]);

function uid() {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    const keys = [...form.keys()];
    return Response.json({ error: "Missing file", keys, type: typeof file }, { status: 400 });
  }
  const blob = file as Blob;
  const filename = file instanceof File ? file.name : "upload";
  if (!ALLOWED.has(blob.type)) {
    return Response.json(
      { error: `Unsupported type: ${blob.type || "unknown"}` },
      { status: 415 }
    );
  }
  if (blob.size > MAX_BYTES) {
    return Response.json(
      { error: `File too large (${blob.size} bytes; max ${MAX_BYTES})` },
      { status: 413 }
    );
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const docId = uid();
  putDoc({
    id: docId,
    filename,
    mime: blob.type,
    size: blob.size,
    bytes,
    uploadedAt: new Date().toISOString(),
  });

  return Response.json({
    docId,
    filename,
    mime: blob.type,
    size: blob.size,
  });
}
