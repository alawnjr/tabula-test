import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cases: defineTable({
    userId: v.string(),
    chapter: v.union(
      v.literal("chapter7"),
      v.literal("chapter13"),
      v.literal("meansTest"),
      v.literal("personalInjury")
    ),
    debtorName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    data: v.any(),
    debtorEmail: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_debtor_email", ["debtorEmail"]),
});
