import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  cases: defineTable({
    userId: v.string(),
    chapter: v.union(
      v.literal("chapter7"),
      v.literal("chapter13"),
      v.literal("meansTest"),
      v.literal("personalInjury"),
      v.literal("estateAdmin")
    ),
    debtorName: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
    data: v.any(),
    debtorEmail: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_debtor_email", ["debtorEmail"]),

  beneficiaryAccess: defineTable({
    caseId: v.id("cases"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("beneficiary"), v.literal("executor-co")),
    invitedAt: v.string(),
    status: v.union(
      v.literal("invited"),
      v.literal("active"),
      v.literal("revoked")
    ),
  })
    .index("by_email", ["email"])
    .index("by_case", ["caseId"]),
});
