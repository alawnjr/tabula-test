// In-memory document store for the demo. Replaced with real storage later.
// Keys are docIds; values include the raw bytes + metadata.

declare global {
  // eslint-disable-next-line no-var
  var __DOC_STORE__: Map<string, StoredDoc> | undefined;
}

export type StoredDoc = {
  id: string;
  filename: string;
  mime: string;
  size: number;
  bytes: Uint8Array;
  uploadedAt: string;
};

function getStore(): Map<string, StoredDoc> {
  if (!globalThis.__DOC_STORE__) {
    globalThis.__DOC_STORE__ = new Map();
  }
  return globalThis.__DOC_STORE__;
}

export function putDoc(doc: StoredDoc): void {
  getStore().set(doc.id, doc);
}

export function getDoc(id: string): StoredDoc | undefined {
  return getStore().get(id);
}

export function deleteDoc(id: string): void {
  getStore().delete(id);
}
