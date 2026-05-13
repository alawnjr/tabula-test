import { YES_NO } from "./common";
import type { FormSchema } from "./types";

export const reTaxesNy: FormSchema = {
  id: "re-taxes-ny",
  title: "NY Tax Forms & Recording",
  longTitle: "New York Transfer Tax, Mansion Tax, Mortgage Recording Tax & Federal Compliance",
  appliesTo: ["realEstate"],
  sections: [
    {
      id: "stateTax",
      title: "NY State transfer tax (TP-584)",
      description:
        "TP-584 (Combined Real Estate Transfer Tax Return) must be filed with the county clerk within 15 days of deed delivery for transfers outside NYC. NYC properties use TP-584-NYC filed through ACRIS. Basic rate: $2 per $500 of consideration (0.4%).",
      items: [
        {
          id: "tp584Required",
          type: "radio",
          label: "TP-584 filing required?",
          required: true,
          options: YES_NO,
        },
        {
          id: "tp584Filed",
          type: "radio",
          label: "TP-584 filed?",
          options: YES_NO,
          visibleIf: { fieldId: "tp584Required", equals: "yes" },
        },
        {
          id: "tp584FilingDate",
          type: "date",
          label: "TP-584 filing date",
          visibleIf: { fieldId: "tp584Filed", equals: "yes" },
        },
        {
          id: "tp584TaxAmount",
          type: "currency",
          label: "NY State transfer tax amount",
          help: "Basic rate: 0.4% of consideration; additional taxes may apply on NYC residential $1M+",
          visibleIf: { fieldId: "tp584Required", equals: "yes" },
        },
        {
          id: "rp5217Required",
          type: "radio",
          label: "RP-5217 (Real Property Transfer Report) required?",
          help: "Required when recording a deed with the county clerk (or RP-5217-NYC for NYC via ACRIS). Must be signed by both buyer and seller.",
          options: YES_NO,
        },
        {
          id: "rp5217Filed",
          type: "radio",
          label: "RP-5217 completed and filed?",
          options: YES_NO,
          visibleIf: { fieldId: "rp5217Required", equals: "yes" },
        },
      ],
    },
    {
      id: "nycTaxes",
      title: "NYC Real Property Transfer Tax (NYC RPT)",
      description:
        "NYC RPT is due within 30 days of transfer. Filed via ACRIS for Manhattan, Brooklyn, Queens, Bronx. Staten Island uses RP-5217-NYC. Even tax-exempt transfers require filing.",
      items: [
        {
          id: "nycRptRequired",
          type: "radio",
          label: "NYC Real Property Transfer Tax (NYC RPT) required?",
          help: "Required for NYC property transfers where consideration exceeds $25,000",
          options: YES_NO,
        },
        {
          id: "nycRptFiled",
          type: "radio",
          label: "NYC RPT return filed via ACRIS?",
          options: YES_NO,
          visibleIf: { fieldId: "nycRptRequired", equals: "yes" },
        },
        {
          id: "nycRptFilingDate",
          type: "date",
          label: "NYC RPT filing date",
          visibleIf: { fieldId: "nycRptFiled", equals: "yes" },
        },
        {
          id: "nycRptAmount",
          type: "currency",
          label: "NYC RPT amount",
          visibleIf: { fieldId: "nycRptRequired", equals: "yes" },
        },
        {
          id: "acrisfiled",
          type: "radio",
          label: "ACRIS e-recording completed?",
          help: "Covers Manhattan, Brooklyn, Queens, and the Bronx. Staten Island uses Richmond County Clerk.",
          options: YES_NO,
          visibleIf: { fieldId: "nycRptRequired", equals: "yes" },
        },
        {
          id: "acrisDocumentId",
          type: "text",
          label: "ACRIS document ID / recording number",
          visibleIf: { fieldId: "acrisfiled", equals: "yes" },
        },
      ],
    },
    {
      id: "mansionTax",
      title: "NYC / NY Mansion Tax",
      description:
        "Buyer pays mansion tax on residential properties with consideration ≥ $1,000,000. Progressive rates: 1% ($1M–$1.999M) up to 3.9% ($25M+). Seller pays if buyer is exempt.",
      items: [
        {
          id: "mansionTaxApplicable",
          type: "radio",
          label: "Mansion tax applicable (residential, consideration ≥ $1,000,000)?",
          options: YES_NO,
        },
        {
          id: "mansionTaxRate",
          type: "select",
          label: "Mansion tax rate tier",
          options: [
            { value: "1.00", label: "1.00% — $1M to $1,999,999" },
            { value: "1.25", label: "1.25% — $2M to $2,999,999" },
            { value: "1.50", label: "1.50% — $3M to $3,999,999" },
            { value: "1.75", label: "1.75% — $4M to $4,999,999" },
            { value: "2.25", label: "2.25% — $5M to $9,999,999" },
            { value: "3.25", label: "3.25% — $10M to $14,999,999" },
            { value: "3.50", label: "3.50% — $15M to $19,999,999" },
            { value: "3.75", label: "3.75% — $20M to $24,999,999" },
            { value: "3.90", label: "3.90% — $25M+" },
          ],
          visibleIf: { fieldId: "mansionTaxApplicable", equals: "yes" },
        },
        {
          id: "mansionTaxAmount",
          type: "currency",
          label: "Mansion tax amount",
          visibleIf: { fieldId: "mansionTaxApplicable", equals: "yes" },
        },
        {
          id: "mansionTaxPaidBy",
          type: "select",
          label: "Mansion tax paid by",
          options: [
            { value: "buyer", label: "Buyer (default)" },
            { value: "seller", label: "Seller (buyer is exempt)" },
          ],
          visibleIf: { fieldId: "mansionTaxApplicable", equals: "yes" },
        },
      ],
    },
    {
      id: "mortgageRecordingTax",
      title: "Mortgage Recording Tax (MRT)",
      description:
        "NYC rates: 1.8% (residential loans < $500K) or 1.925% (≥ $500K). Lender pays 0.25%; borrower pays the rest. Upstate counties vary (typically 1.0–1.3%). Not applicable to co-ops (shares are personal property, not real property).",
      items: [
        {
          id: "mrtApplicable",
          type: "radio",
          label: "Mortgage Recording Tax applicable?",
          help: "Does not apply to co-op financing (shares are personal property)",
          options: YES_NO,
        },
        {
          id: "mrtLoanAmount",
          type: "currency",
          label: "Mortgage amount subject to MRT",
          visibleIf: { fieldId: "mrtApplicable", equals: "yes" },
        },
        {
          id: "mrtAmount",
          type: "currency",
          label: "Estimated MRT amount (borrower's portion)",
          visibleIf: { fieldId: "mrtApplicable", equals: "yes" },
        },
        {
          id: "cemaApplicable",
          type: "radio",
          label: "CEMA (Consolidation, Extension & Modification Agreement) applicable?",
          help: "NY Tax Law §255 — consolidates existing mortgage(s) with new loan; tax applies only to 'new money.' Saves MRT on unpaid principal balance. Available for 1–3 family homes and individual condos (NOT co-ops).",
          options: YES_NO,
        },
        {
          id: "cemaNewMoney",
          type: "currency",
          label: "CEMA 'new money' amount (gap mortgage)",
          visibleIf: { fieldId: "cemaApplicable", equals: "yes" },
        },
        {
          id: "cemaMrtSavings",
          type: "currency",
          label: "Estimated MRT savings from CEMA",
          visibleIf: { fieldId: "cemaApplicable", equals: "yes" },
        },
      ],
    },
    {
      id: "nonresidentTax",
      title: "Nonresident seller — IT-2663 / IT-2664",
      description:
        "Nonresident individuals/estates/trusts selling NY real property must pay estimated income tax at recording. IT-2663 for real property; IT-2664 for co-op share sales.",
      items: [
        {
          id: "sellerNyResident",
          type: "radio",
          label: "Is the seller a NY resident (or primary residence qualifying for exemption)?",
          options: [
            { value: "yes", label: "Yes — NY resident / primary residence exemption" },
            { value: "no", label: "No — nonresident seller" },
          ],
        },
        {
          id: "it2663Required",
          type: "radio",
          label: "IT-2663 (real property) or IT-2664 (co-op) required?",
          options: YES_NO,
          visibleIf: { fieldId: "sellerNyResident", equals: "no" },
        },
        {
          id: "it2663FormType",
          type: "select",
          label: "Form type",
          options: [
            { value: "it2663", label: "IT-2663 (real property / condo)" },
            { value: "it2664", label: "IT-2664 (co-op share sale)" },
          ],
          visibleIf: { fieldId: "it2663Required", equals: "yes" },
        },
        {
          id: "it2663TaxAmount",
          type: "currency",
          label: "Estimated NY income tax withheld at closing",
          visibleIf: { fieldId: "it2663Required", equals: "yes" },
        },
      ],
    },
    {
      id: "firpta",
      title: "FIRPTA — Foreign seller compliance",
      description:
        "Federal law requires 15% withholding (or 10% for primary residences under $1M) on gross proceeds when seller is a foreign person. Buyer/withholding agent files IRS Forms 8288 and 8288-A within 20 days of transfer.",
      items: [
        {
          id: "firptaApplicable",
          type: "radio",
          label: "Is the seller a foreign person / entity subject to FIRPTA?",
          options: YES_NO,
        },
        {
          id: "firptaWithholdingRequired",
          type: "radio",
          label: "FIRPTA withholding required?",
          help: "Exceptions: buyer acquiring personal residence < $300K (no withholding); $300K–$1M at reduced 10% rate; seller provides non-foreign certification",
          options: YES_NO,
          visibleIf: { fieldId: "firptaApplicable", equals: "yes" },
        },
        {
          id: "firptaWithholdingRate",
          type: "select",
          label: "Withholding rate",
          options: [
            { value: "15", label: "15% (standard)" },
            { value: "10", label: "10% (buyer's intended residence, $300K–$1M)" },
            { value: "0", label: "0% — withholding certificate obtained" },
          ],
          visibleIf: { fieldId: "firptaWithholdingRequired", equals: "yes" },
        },
        {
          id: "firptaWithholdingAmount",
          type: "currency",
          label: "FIRPTA withholding amount",
          visibleIf: { fieldId: "firptaWithholdingRequired", equals: "yes" },
        },
        {
          id: "firptaCertificateObtained",
          type: "radio",
          label: "IRS withholding certificate obtained to reduce/eliminate withholding?",
          options: YES_NO,
          visibleIf: { fieldId: "firptaApplicable", equals: "yes" },
        },
        {
          id: "firpta8288Filed",
          type: "radio",
          label: "IRS Forms 8288 and 8288-A filed within 20 days of transfer?",
          options: YES_NO,
          visibleIf: { fieldId: "firptaWithholdingRequired", equals: "yes" },
        },
      ],
    },
  ],
};
