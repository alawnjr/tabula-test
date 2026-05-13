import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// Attorney-side: invite a beneficiary to view the estate
export const invite = mutation({
  args: {
    caseId: v.id("cases"),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("beneficiary"), v.literal("executor-co"))
    ),
  },
  handler: async (ctx, { caseId, email, name, role }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const existing = await ctx.db.get(caseId);
    if (!existing || existing.userId !== identity.subject) {
      throw new Error("Not found");
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized) throw new Error("Email required");

    // De-dupe: if an existing invite for this email/case, just reactivate.
    const dupes = await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();
    const dupe = dupes.find((d) => d.email === normalized);
    if (dupe) {
      await ctx.db.patch(dupe._id, {
        status: "invited",
        name: name ?? dupe.name,
        role: role ?? dupe.role,
      });
      return dupe._id;
    }

    return await ctx.db.insert("beneficiaryAccess", {
      caseId,
      email: normalized,
      name,
      role: role ?? "beneficiary",
      invitedAt: new Date().toISOString(),
      status: "invited",
    });
  },
});

export const revoke = mutation({
  args: { accessId: v.id("beneficiaryAccess") },
  handler: async (ctx, { accessId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const access = await ctx.db.get(accessId);
    if (!access) throw new Error("Not found");
    const c = await ctx.db.get(access.caseId);
    if (!c || c.userId !== identity.subject) throw new Error("Not found");
    await ctx.db.patch(accessId, { status: "revoked" });
  },
});

export const listForCase = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, { caseId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const c = await ctx.db.get(caseId);
    if (!c || c.userId !== identity.subject) return [];
    return await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_case", (q) => q.eq("caseId", caseId))
      .collect();
  },
});

// Beneficiary-side: list estates I have access to
export const listMyEstates = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return [];
    const email = identity.email.toLowerCase();
    const access = await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const active = access.filter((a) => a.status !== "revoked");
    const results = await Promise.all(
      active.map(async (a) => {
        const c = await ctx.db.get(a.caseId);
        if (!c) return null;
        return {
          accessId: a._id,
          caseId: a.caseId,
          role: a.role,
          status: a.status,
          decedentName: c.debtorName,
          chapter: c.chapter,
        };
      })
    );
    return results.filter((r): r is NonNullable<typeof r> => r != null);
  },
});

// Beneficiary-side: view a single estate (scoped: only safe fields)
export const getEstateAsBeneficiary = query({
  args: { caseId: v.id("cases") },
  handler: async (ctx, { caseId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) return null;
    const email = identity.email.toLowerCase();
    const access = await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const mine = access.find((a) => a.caseId === caseId && a.status !== "revoked");
    if (!mine) return null;
    const c = await ctx.db.get(caseId);
    if (!c) return null;
    const data = (c.data ?? {}) as Record<string, unknown>;
    const forms = (data.forms ?? {}) as Record<string, Record<string, unknown>>;

    // Scope: only fields safe for a beneficiary to see. SSNs, decedent's full
    // SSN, internal notes, attorney-only fields are stripped.
    const intake = forms["ea-intake"] ?? {};
    const beneficiaries = forms["ea-beneficiaries"] ?? {};

    return {
      caseId,
      decedentName: c.debtorName,
      role: mine.role,
      decedentDod: intake.decedentDod ?? null,
      domicileState: intake.domicileState ?? null,
      letterStatus: intake.letterStatus ?? null,
      lettersIssuedDate: intake.lettersIssuedDate ?? null,
      beneficiaries: Array.isArray(beneficiaries.beneficiaries)
        ? (beneficiaries.beneficiaries as unknown[]).map((b) => {
            if (!b || typeof b !== "object") return {};
            const r = b as Record<string, unknown>;
            return {
              name: r.name,
              relationship: r.relationship,
              sharePercent: r.sharePercent,
              waiverStatus: r.waiverStatus,
            };
          })
        : [],
    };
  },
});

// Beneficiary-side: mark waiver as signed (sets status + signedAt on the
// matching row in ea-beneficiaries.beneficiaries by name match).
export const submitWaiver = mutation({
  args: {
    caseId: v.id("cases"),
    beneficiaryName: v.string(),
    signature: v.string(),
  },
  handler: async (ctx, { caseId, beneficiaryName, signature }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    const email = identity.email.toLowerCase();
    const access = await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const mine = access.find((a) => a.caseId === caseId && a.status !== "revoked");
    if (!mine) throw new Error("Not authorized");
    const c = await ctx.db.get(caseId);
    if (!c) throw new Error("Not found");
    const data = (c.data ?? {}) as Record<string, unknown>;
    const forms = (data.forms ?? {}) as Record<string, Record<string, unknown>>;
    const beneForm = (forms["ea-beneficiaries"] ?? {}) as Record<string, unknown>;
    const list = Array.isArray(beneForm.beneficiaries)
      ? ([...beneForm.beneficiaries] as Record<string, unknown>[])
      : [];

    const idx = list.findIndex(
      (b) =>
        typeof b?.name === "string" &&
        b.name.trim().toLowerCase() === beneficiaryName.trim().toLowerCase()
    );
    if (idx === -1) throw new Error("Beneficiary not on roster");
    list[idx] = {
      ...list[idx],
      waiverStatus: "signed",
      waiverDate: new Date().toISOString().slice(0, 10),
      waiverSignature: signature,
    };
    const newForms = {
      ...forms,
      "ea-beneficiaries": { ...beneForm, beneficiaries: list },
    };
    await ctx.db.patch(caseId, {
      data: { ...data, forms: newForms },
      updatedAt: new Date().toISOString(),
    });
  },
});

// Mark a case as flagged for attorney escalation (used by AI chat for
// substantive beneficiary questions).
export const flagEscalation = mutation({
  args: {
    caseId: v.id("cases"),
    question: v.string(),
  },
  handler: async (ctx, { caseId, question }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) throw new Error("Not authenticated");
    const email = identity.email.toLowerCase();
    const access = await ctx.db
      .query("beneficiaryAccess")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    const mine = access.find((a) => a.caseId === caseId && a.status !== "revoked");
    if (!mine) throw new Error("Not authorized");
    const c = await ctx.db.get(caseId);
    if (!c) throw new Error("Not found");
    const data = (c.data ?? {}) as Record<string, unknown>;
    const prev = Array.isArray(data.beneficiaryEscalations)
      ? (data.beneficiaryEscalations as unknown[])
      : [];
    await ctx.db.patch(caseId, {
      data: {
        ...data,
        beneficiaryEscalations: [
          ...prev,
          {
            from: email,
            question,
            at: new Date().toISOString(),
          },
        ],
      },
    });
  },
});

// Convenience: cast back to Id<"cases"> at call sites
export type BeneficiaryCaseId = Id<"cases">;
