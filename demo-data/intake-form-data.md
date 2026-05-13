# `ea-intake` — values to enter

Copy these into the fields on `/case/<id>/ea-intake`. The DOD and domicile state
are the most important — the calendar and reconciliation engines key off them.

## Decedent

| Field | Value |
|---|---|
| Decedent name — first | `Elinor` |
| Decedent name — middle | `Margaret` |
| Decedent name — last | `Hayes` |
| Decedent name — suffix | *(blank)* |
| Date of birth | `1942-03-18` |
| Date of death | `2026-02-04` |
| SSN — last four | `8814` |
| Domicile state at death | `NY` |
| Street | `412 Riverside Drive` |
| Apt / suite | `Apt 7C` |
| City | `New York` |
| State | `NY` |
| ZIP | `10025` |

## Will & instrument

| Field | Value |
|---|---|
| Does a will exist? | `Yes` |
| Date of the will | `2018-11-12` |
| Original will located where? | `Hayes residence safe — duplicate in attorney's vault` |
| Executor nominated in will? | `Yes` |
| Nominated executor — name | `Catherine R. Hayes-Park` |
| Pour-over or separate revocable trust? | `No` |

## Family

| Field | Value |
|---|---|
| Surviving spouse? | `No` |
| Any minor or disabled beneficiaries? | `No` |
| Approximate number of beneficiaries | `2` |

## Estate profile

| Field | Value |
|---|---|
| Estimated gross estate | `$1M – $5M` |
| Real property in any state other than domicile? | `No` |
| Any closely-held business interests? | `No` |
| Life insurance on the decedent? | `Yes` |
| Retirement accounts with named beneficiaries? | `Yes` |
| Significant lifetime gifts (Forms 709 filed)? | `No` |

## Filing status

| Field | Value |
|---|---|
| Letters status | `Letters issued` |
| Date letters issued | `2026-03-15` |

---

# `ea-beneficiaries` — values to enter

Add two rows to the **Primary beneficiaries** repeating group:

### Row 1
| Field | Value |
|---|---|
| Full name | `Catherine R. Hayes-Park` |
| Relationship | `Child` |
| Date of birth | `1969-07-02` |
| Minor | (unchecked) |
| Share % | `50` |
| Email | `catherine.hayes.park@example.com` |
| Phone | `(347) 555-0177` |
| Street | `27 Linden Court` |
| City | `Brooklyn` |
| State | `NY` |
| ZIP | `11215` |
| Waiver / consent status | `Not sent` |
| Per stirpes | `checked` |

### Row 2
| Field | Value |
|---|---|
| Full name | `Daniel J. Hayes` |
| Relationship | `Child` |
| Date of birth | `1972-02-14` |
| Share % | `50` |
| Email | `daniel.hayes@example.com` |
| Phone | `(207) 555-0142` |
| Street | `188 Pearl Street, Apt 3` |
| City | `Portland` |
| State | `ME` |
| ZIP | `04101` |
| Waiver / consent status | `Not sent` |
| Per stirpes | `checked` |

---

# `ea-tax` — values to seed elections

| Field | Value |
|---|---|
| CPA / firm name | `Rivera Wexler LLP` |
| CPA email | `mwexler@riverawexler.example.com` |
| CPA phone | `(212) 555-9301` |
| Estate EIN | *(leave blank — exercise the deadline)* |
| Fiscal-year vs. calendar-year | `Fiscal year` |
| Selected fiscal-year end | `2027-01-31` |
| §645 election | `No` |
| QTIP election on 706 | `No` |
| Federal Form 706 required? | `No` *(under $13.61M threshold)* |
| Federal Form 1041 required? | `Yes` *(estate will earn dividends during admin)* |
| State estate-tax return required? | `No` *(under $6.94M NY threshold)* |
| Final 1040 coordinated with CPA? | `Yes` |

---

# Expected reconciliation findings

After all six demo docs are uploaded and applied, plus the form values above,
`/case/<id>/reconciliation` should show roughly:

- ⚠️ **Warning** — Retirement account #1 beneficiary "Daniel J. Hayes (son) —
  100%" — flagged because the IRA designation gives Daniel 100%, but the will
  splits the residuary 50/50. (The heuristic is name-overlap, so this only
  fires if the designation string doesn't substring-match a residuary name.
  The "100%" suffix breaks the match — that's the intended demo signal.)
- ⚠️ **Warning** — Life insurance policy #1 beneficiary "Catherine R.
  Hayes-Park" mirror conflict.
- ℹ️ **Info** — `§645 election decision deadline` will appear once you toggle
  §645 → Yes. Leave it No to keep the list cleaner for the demo.

# Expected calendar entries

Given DOD 2026-02-04, domicile NY, letters issued 2026-03-15:

- 2026-02-18: Order certified death certificates (info)
- 2026-03-06: Obtain EIN (info)
- 2026-10-15: Creditor claim window closes (7 mo from letters, hard)
- 2027-03-15: First accounting due (NY, hard)
- 2027-04-15: Decedent's final 1040 (hard)
