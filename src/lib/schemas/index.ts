import { form101 } from "./form-101-petition";
import { form107 } from "./form-107-sofa";
import { form113 } from "./form-113-ch13plan";
import { form122A1 } from "./form-122a1-cmi";
import { form122A2 } from "./form-122a2-means";
import { form122Result } from "./form-122result-eligibility";
import { schedule106AB } from "./schedule-106ab-property";
import { schedule106C } from "./schedule-106c-exemptions";
import { schedule106D } from "./schedule-106d-secured";
import { schedule106EF } from "./schedule-106ef-unsecured";
import { schedule106G } from "./schedule-106g-contracts";
import { schedule106H } from "./schedule-106h-codebtors";
import { schedule106I } from "./schedule-106i-income";
import { schedule106J } from "./schedule-106j-expenses";
import { schedule106Sum } from "./schedule-106sum-summary";
import type { ChapterId, FormSchema } from "./types";

export const SCHEMAS: Record<string, FormSchema> = {
  "101": form101,
  "106AB": schedule106AB,
  "106C": schedule106C,
  "106D": schedule106D,
  "106EF": schedule106EF,
  "106G": schedule106G,
  "106H": schedule106H,
  "106I": schedule106I,
  "106J": schedule106J,
  "106Sum": schedule106Sum,
  "107": form107,
  "113": form113,
  "122A-1": form122A1,
  "122A-2": form122A2,
  "122Result": form122Result,
};

export const FORM_ORDER: Record<ChapterId, string[]> = {
  meansTest: ["122A-1", "122A-2", "122Result"],
  chapter7: [
    "101",
    "106AB",
    "106C",
    "106D",
    "106EF",
    "106G",
    "106H",
    "106I",
    "106J",
    "106Sum",
    "107",
  ],
  chapter13: [
    "101",
    "106AB",
    "106C",
    "106D",
    "106EF",
    "106G",
    "106H",
    "106I",
    "106J",
    "106Sum",
    "107",
    "113",
  ],
};

export function getSchema(formId: string): FormSchema | undefined {
  return SCHEMAS[formId];
}

export function chapterLabel(chapter: ChapterId): string {
  if (chapter === "chapter7") return "Chapter 7";
  if (chapter === "chapter13") return "Chapter 13";
  return "Means test";
}

export * from "./types";
