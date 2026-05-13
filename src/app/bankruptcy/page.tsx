"use client";

import { PracticeAreaDashboard } from "@/components/case/PracticeAreaDashboard";
import { ImportExport } from "@/components/case/ImportExport";

export default function BankruptcyDashboard() {
  return (
    <PracticeAreaDashboard
      chapters={["chapter7", "chapter13", "meansTest"]}
      createOptions={[
        { label: "New Chapter 7", chapter: "chapter7" },
        { label: "New Chapter 13", chapter: "chapter13", variant: "outline" },
        { label: "Means test", chapter: "meansTest", variant: "outline" },
      ]}
      heroTitle={
        <>
          Case files,
          <br />
          <em>handled.</em>
        </>
      }
      heroDesc="A schedule-by-schedule workspace for Chapter 7 and Chapter 13 filings. Pull bank data, extract documents, and assemble a complete petition without leaving the brief."
      badgeLabel="Bankruptcy"
      backHref="/"
      extraActions={<ImportExport />}
    />
  );
}
