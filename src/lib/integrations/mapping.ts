// Maps ExtractedDoc → FormPatch[] keyed by formId/path against the bankruptcy
// schemas in src/lib/schemas/. Field IDs here MUST match the schemas exactly.

import type {
  ExtractedDoc,
  ExtractedItem,
  FormPatch,
} from "./types";

let patchCounter = 0;
function newPatchId() {
  patchCounter += 1;
  return `patch-${Date.now().toString(36)}-${patchCounter}`;
}

function mapItem(
  item: ExtractedItem,
  source: ExtractedDoc["source"],
  sourceLabel: string
): FormPatch[] {
  switch (item.kind) {
    case "depositAccount":
      return [
        {
          id: newPatchId(),
          formId: "106AB",
          op: {
            kind: "appendGroup",
            groupId: "depositAccounts",
            fields: {
              type: item.accountType ?? "checking",
              institution: item.institution ?? "",
              lastFour: item.lastFour ?? "",
              balance: item.balance ?? 0,
            },
          },
          label: `Add deposit account: ${item.institution ?? "?"} ${
            item.lastFour ? `***${item.lastFour}` : ""
          } — $${item.balance ?? 0}`,
          source,
          sourceLabel,
        },
      ];

    case "securedDebt":
      return [
        {
          id: newPatchId(),
          formId: "106D",
          op: {
            kind: "appendGroup",
            groupId: "securedCreditors",
            fields: {
              creditorName: item.creditorName ?? "",
              accountLast4: item.lastFour ?? "",
              dateIncurred: item.dateIncurred ?? "",
              lienType: item.lienType,
              collateralDescription: item.collateralDescription ?? "",
              claimAmount: item.claimAmount ?? 0,
              collateralValue: item.collateralValue ?? 0,
              unsecuredPortion: Math.max(
                (item.claimAmount ?? 0) - (item.collateralValue ?? 0),
                0
              ),
            },
          },
          label: `Add secured creditor: ${item.creditorName ?? "?"} (${
            item.lienType
          }) — $${item.claimAmount ?? 0}`,
          source,
          sourceLabel,
        },
      ];

    case "unsecuredDebt":
      return [
        {
          id: newPatchId(),
          formId: "106EF",
          op: {
            kind: "appendGroup",
            groupId: "nonpriorityCreditors",
            fields: {
              creditorName: item.creditorName ?? "",
              accountLast4: item.lastFour ?? "",
              dateIncurred: item.dateIncurred ?? "",
              claimType: item.claimType,
              basis: item.basis ?? "",
              claimAmount: item.claimAmount ?? 0,
            },
          },
          label: `Add unsecured creditor: ${item.creditorName ?? "?"} (${
            item.claimType
          }) — $${item.claimAmount ?? 0}`,
          source,
          sourceLabel,
        },
      ];

    case "realEstate":
      return [
        {
          id: newPatchId(),
          formId: "106AB",
          op: {
            kind: "appendGroup",
            groupId: "realEstate",
            fields: {
              description: item.description ?? "",
              locationLine1: item.addressLine1 ?? "",
              locationCity: item.addressCity ?? "",
              locationState: item.addressState ?? "",
              locationZip: item.addressZip ?? "",
              currentValue: item.currentValue ?? 0,
              lienAmount: item.lienAmount ?? 0,
            },
          },
          label: `Add real estate: ${item.description ?? "property"} — $${
            item.currentValue ?? 0
          }`,
          source,
          sourceLabel,
        },
      ];

    case "vehicle":
      return [
        {
          id: newPatchId(),
          formId: "106AB",
          op: {
            kind: "appendGroup",
            groupId: "vehicles",
            fields: {
              vehicleType: item.vehicleType ?? "car",
              make: item.make ?? "",
              model: item.model ?? "",
              year: item.year ?? "",
              mileage: item.mileage ?? "",
              currentValue: item.currentValue ?? 0,
            },
          },
          label: `Add vehicle: ${[item.year, item.make, item.model]
            .filter(Boolean)
            .join(" ")} — $${item.currentValue ?? 0}`,
          source,
          sourceLabel,
        },
      ];

    case "retirement":
      return [
        {
          id: newPatchId(),
          formId: "106AB",
          op: {
            kind: "appendGroup",
            groupId: "retirement",
            fields: {
              type: item.accountType ?? "",
              institution: item.institution ?? "",
              value: item.value ?? 0,
            },
          },
          label: `Add retirement account: ${item.institution ?? ""} ${
            item.accountType ?? ""
          } — $${item.value ?? 0}`,
          source,
          sourceLabel,
        },
      ];

    case "monthlyScalar":
      return [
        {
          id: newPatchId(),
          formId: item.formId,
          op: { kind: "setField", path: [item.fieldId], value: item.amount },
          label: `Set ${item.formId} ${item.fieldId}: $${item.amount.toFixed(
            2
          )} — ${item.description}`,
          source,
          sourceLabel,
        },
      ];

    case "monthlyOtherIncome":
      return [
        {
          id: newPatchId(),
          formId: "106I",
          op: {
            kind: "appendGroup",
            groupId: "otherIncome",
            fields: {
              type: item.type,
              description: item.description,
              debtor1Amount: item.debtor1Amount,
              debtor2Amount: 0,
            },
          },
          label: `Add other income (${item.type}): $${item.debtor1Amount.toFixed(
            2
          )}/mo — ${item.description}`,
          source,
          sourceLabel,
        },
      ];

    case "payStub": {
      const prefix = item.debtor === 2 ? "d2" : "d1";
      const empPrefix = item.debtor === 2 ? "debtor2" : "debtor1";
      const setField = (id: string, value: unknown, label: string): FormPatch => ({
        id: newPatchId(),
        formId: id.startsWith("d") ? "106I" : "106I",
        op: { kind: "setField", path: [id], value },
        label,
        source,
        sourceLabel,
      });
      const out: FormPatch[] = [];
      if (item.employer) {
        out.push({
          id: newPatchId(),
          formId: "106I",
          op: {
            kind: "setField",
            path: [`${empPrefix}Employer`],
            value: item.employer,
          },
          label: `Set Debtor ${item.debtor} employer: ${item.employer}`,
          source,
          sourceLabel,
        });
      }
      if (item.occupation) {
        out.push({
          id: newPatchId(),
          formId: "106I",
          op: {
            kind: "setField",
            path: [`${empPrefix}Occupation`],
            value: item.occupation,
          },
          label: `Set Debtor ${item.debtor} occupation: ${item.occupation}`,
          source,
          sourceLabel,
        });
      }
      const numFields: Array<[keyof typeof item, string, string]> = [
        ["grossWages", `${prefix}GrossWages`, "gross wages"],
        ["overtimePay", `${prefix}OvertimePay`, "overtime"],
        ["payrollTax", `${prefix}PayrollTax`, "payroll tax"],
        ["mandatoryRetirement", `${prefix}MandatoryRetirement`, "mandatory retirement"],
        ["voluntaryRetirement", `${prefix}VoluntaryRetirement`, "voluntary retirement"],
        ["insurance", `${prefix}Insurance`, "insurance deduction"],
        ["unionDues", `${prefix}UnionDues`, "union dues"],
        ["otherDeductions", `${prefix}OtherDeductions`, "other deductions"],
      ];
      for (const [key, fieldId, label] of numFields) {
        const value = item[key];
        if (typeof value === "number") {
          out.push(
            setField(fieldId, value, `Set Debtor ${item.debtor} ${label}: $${value}`)
          );
        }
      }
      return out;
    }
  }
}

export function buildPatches(doc: ExtractedDoc): FormPatch[] {
  const patches: FormPatch[] = [];
  for (const item of doc.items) {
    patches.push(...mapItem(item, doc.source, doc.sourceLabel));
  }
  return patches;
}
