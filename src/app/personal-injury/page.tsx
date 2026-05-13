"use client";

import { PracticeAreaDashboard } from "@/components/case/PracticeAreaDashboard";

export default function PersonalInjuryDashboard() {
  return (
    <PracticeAreaDashboard
      chapters={["personalInjury"]}
      createOptions={[
        { label: "New PI case", chapter: "personalInjury" },
      ]}
      heroTitle={
        <>
          Claims, built
          <br />
          <em>from the start.</em>
        </>
      }
      heroDesc="A section-by-section workspace for personal injury matters. Capture incident details, track medical treatment, calculate damages, and manage the demand process."
      badgeLabel="Personal Injury"
      backHref="/"
    />
  );
}
