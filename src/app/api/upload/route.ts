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

  const bytes = new Uint8Array(await file.arrayBuffer());
  const docId = uid();
  putDoc({
    id: docId,
    filename: file.name,
    mime: file.type,
    size: file.size,
    bytes,
    uploadedAt: new Date().toISOString(),
  });

  return Response.json({
    docId,
    filename: file.name,
    mime: file.type,
    size: file.size,
  });
}
