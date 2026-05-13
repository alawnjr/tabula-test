# Estate-admin demo data

Synthetic documents and form values for end-to-end testing of the estate-admin
practice area. All facts are fabricated.

## The persona

**Decedent:** Elinor M. Hayes — widow, NY domicile, died 2026-02-04.

**Children (and primary beneficiaries):**
- Catherine R. Hayes-Park (daughter) — 50% residuary
- Daniel J. Hayes (son) — 50% residuary

**The intentional conflict:** Elinor's Fidelity IRA names *only* Daniel as
designated beneficiary (100%), and her MetLife policy names *only* Catherine.
The will's residuary clause is 50/50. After both documents land in the
inventory, the reconciliation page should surface two warnings.

## Files

| File | Document type | What the extractor should produce |
|---|---|---|
| `01-death-certificate.txt` | NY death certificate | One `eaDecedent` item |
| `02-last-will.txt` | Will, dated 2018-11-12 | One `eaDecedent`, two `eaBeneficiary` rows, one `eaBequest` |
| `03-fidelity-ira-statement.txt` | IRA statement | One `eaRetirementAccount` (beneficiary: Daniel only) |
| `04-chase-checking-statement.txt` | Bank statement | One `eaFinancialAccount` |
| `05-metlife-life-insurance.txt` | Policy declaration | One `eaLifeInsurance` (beneficiary: Catherine only) |
| `06-property-deed.txt` | NYC condominium deed | One `eaRealProperty` |

## File formats

Both `.txt` and `.pdf` versions of each document are already in this folder.
Upload the `.pdf` files — the upload endpoint accepts `application/pdf`,
`image/png`, `image/jpeg`.

To regenerate the PDFs from the source `.txt` files on macOS:

```sh
cd demo-data
for f in *.txt; do cupsfilter "$f" > "${f%.txt}.pdf"; done
```

## End-to-end test path

1. Create a new estate-admin case at `/estate-admin`.
2. Open the case overview. Fill in `ea-intake` from `intake-form-data.md`
   (especially DOD and domicile state — the calendar needs both).
3. Visit `/case/<id>/upload` (the IntegrationsPanel) and upload all six PDFs.
4. Visit `/case/<id>/review`. Each document should produce one or more
   patches against the right `ea-*` form. Accept them.
5. Visit `/case/<id>/calendar` — should show federal 1040, EIN, letters
   (soft target), and a 706 / state-estate-tax window once you mark them on
   `ea-tax`.
6. Visit `/case/<id>/reconciliation` — should flag:
   - Fidelity IRA designation "Daniel J. Hayes" not on the will's residuary
     roster (it is, but the share is 100% to him alone — the heuristic flags
     the imbalance against the 50/50 split).
   - MetLife designation "Catherine R. Hayes-Park" similarly.
   - Share totals (if you only enter Catherine and Daniel at 50/50, totals
     are 100% — no flag).
7. Visit `/case/<id>/tax` — gross estate, federal threshold check,
   NY ET-706 threshold check (you'll be under both — set `filing706: no`,
   `filingStateEstate: no` once verified).
8. From the case overview, invite a beneficiary email. Sign in with that
   email at `/beneficiary` and verify the scoped view + waiver flow.
