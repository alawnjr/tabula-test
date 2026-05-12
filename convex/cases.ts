import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("cases")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const whoAmI = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return { email: identity?.email ?? null, subject: identity?.subject ?? null };
  },
});

export const listAsDebtor = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    return await ctx.db
      .query("cases")
      .withIndex("by_debtor_email", (q) => q.eq("debtorEmail", identity.email!))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const c = await ctx.db.get(id);
    if (!c) return null;
    const isOwner = c.userId === identity.subject;
    const isDebtor = c.debtorEmail != null && c.debtorEmail === identity.email;
    if (!isOwner && !isDebtor) return null;
    return c;
  },
});

export const create = mutation({
  args: {
    chapter: v.union(
      v.literal("chapter7"),
      v.literal("chapter13"),
      v.literal("meansTest")
    ),
    debtorName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    return await ctx.db.insert("cases", { userId: identity.subject, ...args });
  },
});

export const update = mutation({
  args: {
    id: v.id("cases"),
    debtorName: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...patch }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject)
      throw new Error("Not found");
    await ctx.db.patch(id, patch);
  },
});

export const shareWithDebtor = mutation({
  args: {
    id: v.id("cases"),
    email: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { id, email }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject)
      throw new Error("Not found");
    await ctx.db.patch(id, { debtorEmail: email ?? undefined });
  },
});

export const updateAsDebtor = mutation({
  args: {
    id: v.id("cases"),
    form101Data: v.any(),
    updatedAt: v.string(),
  },
  handler: async (ctx, { id, form101Data, updatedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Not found");
    const isDebtor = existing.debtorEmail != null && existing.debtorEmail === identity.email;
    const isOwner = existing.userId === identity.subject;
    if (!isDebtor && !isOwner) throw new Error("Not authorized");
    const currentData = (existing.data ?? {}) as Record<string, unknown>;
    const currentForms = (currentData.forms ?? {}) as Record<string, unknown>;
    await ctx.db.patch(id, {
      updatedAt,
      data: {
        ...currentData,
        forms: { ...currentForms, "101": form101Data },
      },
    });
  },
});

export const submitDebtorUpload = mutation({
  args: {
    id: v.id("cases"),
    extractedDoc: v.any(),
    patches: v.any(),
    uploadedAt: v.string(),
    storageId: v.optional(v.string()),
  },
  handler: async (ctx, { id, extractedDoc, patches, uploadedAt, storageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Not found");
    const isOwner = existing.userId === identity.subject;
    const isDebtor = existing.debtorEmail != null && existing.debtorEmail === identity.email;
    if (!isOwner && !isDebtor) throw new Error("Not authorized");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    const prev = Array.isArray(data.debtorUploads) ? data.debtorUploads : [];
    await ctx.db.patch(id, {
      updatedAt: uploadedAt,
      data: { ...data, debtorUploads: [...prev, { extractedDoc, patches, uploadedAt, storageId }] },
    });
  },
});

export const updateUploadPatches = mutation({
  args: { id: v.id("cases"), uploadedAt: v.string(), patches: v.any() },
  handler: async (ctx, { id, uploadedAt, patches }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Not found");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    const uploads = Array.isArray(data.debtorUploads) ? [...data.debtorUploads] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = uploads.findIndex((u: any) => u.uploadedAt === uploadedAt);
    if (idx === -1) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uploads[idx] = { ...(uploads[idx] as any), patches };
    await ctx.db.patch(id, { data: { ...data, debtorUploads: uploads } });
  },
});

// Marks an upload as reviewed: clears patches and sets reviewed=true.
// The entry stays in debtorUploads so the file remains accessible.
export const markUploadReviewed = mutation({
  args: { id: v.id("cases"), uploadedAt: v.string() },
  handler: async (ctx, { id, uploadedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Not found");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    const uploads = Array.isArray(data.debtorUploads) ? [...data.debtorUploads] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = uploads.findIndex((u: any) => u.uploadedAt === uploadedAt);
    if (idx === -1) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uploads[idx] = { ...(uploads[idx] as any), patches: [], reviewed: true };
    await ctx.db.patch(id, { data: { ...data, debtorUploads: uploads } });
  },
});

export const getDebtorUploads = query({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const c = await ctx.db.get(id);
    if (!c || c.userId !== identity.subject) return [];
    const data = (c.data ?? {}) as Record<string, unknown>;
    return Array.isArray(data.debtorUploads) ? data.debtorUploads : [];
  },
});

export const clearDebtorUploads = mutation({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Not found");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    await ctx.db.patch(id, { data: { ...data, debtorUploads: [] } });
  },
});

export const remove = mutation({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject)
      throw new Error("Not found");
    await ctx.db.delete(id);
  },
});

export const getUploadFileUrl = query({
  args: { id: v.id("cases"), uploadedAt: v.string() },
  handler: async (ctx, { id, uploadedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const c = await ctx.db.get(id);
    if (!c || c.userId !== identity.subject) return null;
    const data = (c.data ?? {}) as Record<string, unknown>;
    const uploads = Array.isArray(data.debtorUploads) ? data.debtorUploads : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upload = uploads.find((u: any) => u.uploadedAt === uploadedAt);
    if (!upload?.storageId) return null;
    return await ctx.storage.getUrl(upload.storageId as Id<"_storage">);
  },
});

export const renameUpload = mutation({
  args: { id: v.id("cases"), uploadedAt: v.string(), filename: v.string() },
  handler: async (ctx, { id, uploadedAt, filename }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Not found");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    const uploads = Array.isArray(data.debtorUploads) ? [...data.debtorUploads] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idx = uploads.findIndex((u: any) => u.uploadedAt === uploadedAt);
    if (idx === -1) throw new Error("Upload not found");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uploads[idx] = { ...(uploads[idx] as any), filename };
    await ctx.db.patch(id, { data: { ...data, debtorUploads: uploads } });
  },
});

export const deleteUpload = mutation({
  args: { id: v.id("cases"), uploadedAt: v.string() },
  handler: async (ctx, { id, uploadedAt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(id);
    if (!existing || existing.userId !== identity.subject) throw new Error("Not found");
    const data = (existing.data ?? {}) as Record<string, unknown>;
    const uploads = Array.isArray(data.debtorUploads) ? [...data.debtorUploads] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const target = uploads.find((u: any) => u.uploadedAt === uploadedAt) as any;
    if (target?.storageId) {
      try {
        await ctx.storage.delete(target.storageId as Id<"_storage">);
      } catch {
        // file may already be gone
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filtered = uploads.filter((u: any) => u.uploadedAt !== uploadedAt);
    await ctx.db.patch(id, { data: { ...data, debtorUploads: filtered } });
  },
});
