"use client";

import { PracticeAreaDashboard } from "@/components/case/PracticeAreaDashboard";

export default function EstateAdminDashboard() {
  return (
    <PracticeAreaDashboard
      chapters={["estateAdmin"]}
      createOptions={[
        { label: "New estate", chapter: "estateAdmin" },
      ]}
      heroTitle={
        <>
          Estates,
          <br />
          <em>administered end to end.</em>
        </>
      }
      heroDesc="A workspace for estate administration. Intake the decedent and will, build the inventory, track deadlines from date of death, reconcile beneficiary designations, and generate the petition, accounting, and tax filings."
      badgeLabel="Estate Admin"
      backHref="/"
    />
  );
}
