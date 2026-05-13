"use client";

import { PracticeAreaDashboard } from "@/components/case/PracticeAreaDashboard";

export default function RealEstateDashboard() {
  return (
    <PracticeAreaDashboard
      chapters={["realEstate"]}
      createOptions={[
        { label: "New RE matter", chapter: "realEstate" },
      ]}
      heroTitle={
        <>
          Transactions,
          <br />
          <em>closed cleanly.</em>
        </>
      }
      heroDesc="A form-by-form workspace for real estate transactions. Coordinate parties, track contingencies, manage title and financing, and guide every matter to closing."
      badgeLabel="Real Estate"
      backHref="/"
    />
  );
}
