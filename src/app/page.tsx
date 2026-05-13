import Link from "next/link";

const AREAS = [
  {
    href: "/bankruptcy",
    label: "Bankruptcy",
    badge: "Chapter 7 & 13",
    title: "Case files, handled.",
    description:
      "A schedule-by-schedule workspace for Chapter 7 and Chapter 13 filings. Run the means test, pull bank data, and assemble a complete petition.",
    accent: true,
  },
  {
    href: "/personal-injury",
    label: "Personal Injury",
    badge: "PI",
    title: "Claims, built from the start.",
    description:
      "Capture incident details, track medical treatment, calculate damages, and manage the full demand and negotiation process.",
    accent: false,
  },
  {
    href: "/estate-admin",
    label: "Estate Administration",
    badge: "EA",
    title: "Estates, administered end to end.",
    description:
      "Intake the decedent and will, build the inventory, track jurisdictional deadlines, and generate the petition, accounting, and tax filings.",
    accent: false,
  },
];

export default function LandingPage() {
  return (
    <>
      <header
        className="sticky top-0 z-30 border-b border-[var(--rule-soft)] bg-[var(--paper)]"
        style={{ height: "var(--case-header-h)" }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="logo">
            Tabula<span className="logo-dot" />
          </Link>
          <span className="pill">
            <span className="dot pulse" />
            Three practice areas
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10">
        <section className="space-y-6">
          <span className="pill">
            <span className="dot pulse" />
            Legal workspace
          </span>
          <h1 className="display max-w-[18ch] text-[clamp(42px,6vw,88px)] text-[var(--ink)]">
            Your practice,
            <br />
            <em>all in one place.</em>
          </h1>
          <p className="max-w-[52ch] text-[15px] font-light leading-relaxed text-[var(--ink-2)]">
            Tabula covers bankruptcy, personal injury, and estate administration. Choose your practice area to get started.
          </p>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-3">
          {AREAS.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group flex flex-col gap-4 rounded-[3px] border border-[var(--rule-soft)] bg-[var(--paper)] p-6 transition-colors hover:border-[var(--ink)] hover:bg-[var(--paper-2)]"
            >
              <div className="flex items-center justify-between">
                <span className="tag">{area.label}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--mute)] group-hover:text-[var(--ink)]">
                  Open →
                </span>
              </div>
              <div className="space-y-2">
                <h2
                  className="text-[22px] leading-[1.1] tracking-[-0.02em] text-[var(--ink)]"
                  style={{ fontFamily: "var(--serif)" }}
                >
                  <em>{area.title}</em>
                </h2>
                <p className="text-[13px] font-light leading-relaxed text-[var(--ink-2)]">
                  {area.description}
                </p>
              </div>
              <div className="mt-auto pt-2">
                <span className="pill text-[10px]">
                  <span className="dot pulse" />
                  {area.badge}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
