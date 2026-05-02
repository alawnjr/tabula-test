import { form101 } from "./form-101-petition";
import { form107 } from "./form-107-sofa";
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
};

export const FORM_ORDER: Record<ChapterId, string[]> = {
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
  ],
};

export function getSchema(formId: string): FormSchema | undefined {
  return SCHEMAS[formId];
}

export function chapterLabel(chapter: ChapterId): string {
  return chapter === "chapter7" ? "Chapter 7" : "Chapter 13";
}

export * from "./types";
