import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

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

export const get = query({
  args: { id: v.id("cases") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const c = await ctx.db.get(id);
    if (!c || c.userId !== identity.subject) return null;
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
