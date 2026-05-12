import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cases: defineTable({
    userId: v.string(),
    chapter: v.union(
      v.literal("chapter7"),
      v.literal("chapter13"),
      v.literal("meansTest")
    ),
    debtorName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    data: v.any(),
  }).index("by_user", ["userId"]),
});
