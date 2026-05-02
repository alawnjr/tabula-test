import { addressFields, US_STATES, YES_NO } from "./common";
import type { FormSchema } from "./types";

export const form107: FormSchema = {
  id: "107",
  title: "Statement of Financial Affairs",
  longTitle: "Form 107 — Statement of Financial Affairs for Individuals Filing for Bankruptcy",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "marital",
      title: "Part 1 — Marital status and where you lived before",
      items: [
        {
          id: "maritalStatus",
          type: "radio",
          label: "Current marital status",
          options: [
            { value: "married", label: "Married" },
            { value: "notMarried", label: "Not married" },
          ],
        },
        {
          kind: "repeating-group",
          id: "priorAddresses",
          label: "Prior addresses (last 3 years)",
          itemLabel: "Address",
          fields: [
            { id: "name", type: "text", label: "Person who lived there (if not you)" },
            ...addressFields("prior"),
            { id: "from", type: "date", label: "Lived from" },
            { id: "to", type: "date", label: "Lived to" },
          ],
        },
        {
          id: "livedInCommunityState",
          type: "radio",
          label: "Did you live in a community-property state in the last 8 years?",
          options: YES_NO,
        },
        {
          id: "communityState",
          type: "select",
          label: "Which state?",
          options: US_STATES,
          visibleIf: { fieldId: "livedInCommunityState", equals: "yes" },
        },
        {
          id: "spouseDifferentAddress",
          type: "radio",
          label: "Has your spouse lived at a different address during this time?",
          options: YES_NO,
        },
      ],
    },
    {
      id: "income",
      title: "Part 2 — The sources of your income",
      items: [
        {
          kind: "repeating-group",
          id: "employmentIncome",
          label: "Income from employment / operating a business (last 2 years + YTD)",
          itemLabel: "Source",
          fields: [
            {
              id: "year",
              type: "select",
              label: "Year",
              options: [
                { value: "ytd", label: "From January 1 of current year until filing" },
                { value: "lastYear", label: "Last calendar year" },
                { value: "twoYearsAgo", label: "Two years ago" },
              ],
            },
            {
              id: "source",
              type: "select",
              label: "Source",
              options: [
                { value: "wages", label: "Wages, commissions, bonuses, tips" },
                { value: "business", label: "Operating a business" },
              ],
            },
            { id: "grossAmount", type: "currency", label: "Gross amount (before deductions)" },
            { id: "debtor", type: "select", label: "Debtor", options: [
              { value: "debtor1", label: "Debtor 1" },
              { value: "debtor2", label: "Debtor 2" },
            ] },
          ],
        },
        {
          kind: "repeating-group",
          id: "otherIncomeSources",
          label: "Other income (last 2 years + YTD)",
          itemLabel: "Income source",
          fields: [
            { id: "description", type: "text", label: "Source description (e.g., Social Security, alimony, interest, rent)" },
            { id: "year", type: "select", label: "Year", options: [
              { value: "ytd", label: "YTD" },
              { value: "lastYear", label: "Last year" },
              { value: "twoYearsAgo", label: "Two years ago" },
            ] },
            { id: "grossAmount", type: "currency", label: "Gross amount" },
          ],
        },
      ],
    },
    {
      id: "paymentsToCreditors",
      title: "Part 3 — Certain payments you made before bankruptcy",
      items: [
        {
          kind: "repeating-group",
          id: "paymentsLast90",
          label: "Payments to a creditor totaling more than $600 in the last 90 days (consumer debt)",
          itemLabel: "Payment",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor name" },
            ...addressFields("creditor"),
            { id: "totalAmount", type: "currency", label: "Total amount paid" },
            { id: "amountStillOwed", type: "currency", label: "Amount still owed" },
            { id: "dates", type: "text", label: "Dates of payments" },
            {
              id: "paymentReason",
              type: "select",
              label: "Reason for payment",
              options: [
                { value: "mortgage", label: "Mortgage" },
                { value: "car", label: "Car" },
                { value: "creditCard", label: "Credit card" },
                { value: "loan", label: "Loan" },
                { value: "other", label: "Other" },
              ],
            },
          ],
        },
        {
          kind: "repeating-group",
          id: "paymentsToInsiders",
          label: "Payments or transfers to insiders within the last year",
          itemLabel: "Insider payment",
          fields: [
            { id: "insiderName", type: "text", label: "Insider name" },
            ...addressFields("insider"),
            { id: "relationship", type: "text", label: "Relationship" },
            { id: "totalAmount", type: "currency", label: "Total amount" },
            { id: "dates", type: "text", label: "Dates" },
            { id: "reason", type: "text", label: "Reason for payment / transfer" },
          ],
        },
      ],
    },
    {
      id: "legalActions",
      title: "Part 4 — Legal actions, repossessions, and foreclosures",
      items: [
        {
          kind: "repeating-group",
          id: "lawsuits",
          label: "Lawsuits, court actions, and administrative proceedings (last year)",
          itemLabel: "Action",
          fields: [
            { id: "caption", type: "text", label: "Case title (e.g., Smith v. Doe)" },
            { id: "court", type: "text", label: "Court / agency name" },
            { id: "caseNumber", type: "text", label: "Case number" },
            { id: "natureOfCase", type: "text", label: "Nature of the case" },
            {
              id: "status",
              type: "select",
              label: "Status",
              options: [
                { value: "pending", label: "Pending" },
                { value: "onAppeal", label: "On appeal" },
                { value: "concluded", label: "Concluded" },
              ],
            },
          ],
        },
        {
          kind: "repeating-group",
          id: "repossessions",
          label: "Repossessions, foreclosures, garnishments, attachments, seizures, returns (last year)",
          itemLabel: "Item",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor / officer name" },
            { id: "description", type: "textarea", label: "Description of property" },
            { id: "date", type: "date", label: "Date of action" },
            { id: "valueAtTime", type: "currency", label: "Value at time of action" },
          ],
        },
        {
          kind: "repeating-group",
          id: "setoffs",
          label: "Setoffs by a creditor in the last 90 days",
          itemLabel: "Setoff",
          fields: [
            { id: "creditorName", type: "text", label: "Creditor name" },
            { id: "description", type: "text", label: "Description of action" },
            { id: "date", type: "date", label: "Date" },
            { id: "amount", type: "currency", label: "Amount" },
          ],
        },
        {
          kind: "repeating-group",
          id: "assignments",
          label: "Assignments and receiverships (last year)",
          itemLabel: "Assignment",
          fields: [
            { id: "name", type: "text", label: "Name of person to whom property was assigned" },
            { id: "description", type: "text", label: "Description of property" },
            { id: "date", type: "date", label: "Date" },
            { id: "value", type: "currency", label: "Value" },
          ],
        },
      ],
    },
    {
      id: "giftsAndLosses",
      title: "Part 5 — Certain gifts and contributions",
      items: [
        {
          kind: "repeating-group",
          id: "gifts",
          label: "Gifts to anyone totaling more than $600 (last 2 years)",
          itemLabel: "Gift",
          fields: [
            { id: "recipientName", type: "text", label: "Recipient name" },
            ...addressFields("recipient"),
            { id: "relationship", type: "text", label: "Relationship" },
            { id: "description", type: "text", label: "Description of gift" },
            { id: "value", type: "currency", label: "Value" },
            { id: "date", type: "date", label: "Date" },
          ],
        },
        {
          kind: "repeating-group",
          id: "charitableContributions",
          label: "Charitable contributions of $600+ in the last 2 years",
          itemLabel: "Contribution",
          fields: [
            { id: "charityName", type: "text", label: "Charity name" },
            ...addressFields("charity"),
            { id: "value", type: "currency", label: "Total amount" },
            { id: "dates", type: "text", label: "Dates" },
          ],
        },
        {
          kind: "repeating-group",
          id: "losses",
          label: "Losses from theft, fire, or other casualty (last year)",
          itemLabel: "Loss",
          fields: [
            { id: "description", type: "text", label: "Description" },
            { id: "date", type: "date", label: "Date" },
            { id: "amount", type: "currency", label: "Amount of loss" },
            { id: "insuranceCoverage", type: "text", label: "Insurance coverage / claim status" },
          ],
        },
      ],
    },
    {
      id: "professionalPayments",
      title: "Part 6 — Payments related to bankruptcy",
      items: [
        {
          kind: "repeating-group",
          id: "bankruptcyHelpPayments",
          label: "Payments or transfers for consultation about debt (last year)",
          itemLabel: "Payment",
          fields: [
            { id: "payeeName", type: "text", label: "Payee name (attorney, preparer, agency)" },
            ...addressFields("payee"),
            { id: "datesOfPayment", type: "text", label: "Dates" },
            { id: "amountPaid", type: "currency", label: "Total amount paid" },
            { id: "amountStillOwed", type: "currency", label: "Amount still owed" },
            { id: "description", type: "text", label: "Description of services" },
          ],
        },
      ],
    },
    {
      id: "transfersAndAccounts",
      title: "Part 7 — Other transfers and closed accounts",
      items: [
        {
          kind: "repeating-group",
          id: "otherTransfers",
          label: "Other transfers in the last 2 years (10 years for self-settled trusts)",
          itemLabel: "Transfer",
          fields: [
            { id: "transfereeName", type: "text", label: "Transferee name" },
            ...addressFields("transferee"),
            { id: "relationship", type: "text", label: "Relationship" },
            { id: "description", type: "text", label: "Description of property" },
            { id: "date", type: "date", label: "Date" },
            { id: "value", type: "currency", label: "Value" },
          ],
        },
        {
          kind: "repeating-group",
          id: "closedAccounts",
          label: "Financial accounts closed in the last year",
          itemLabel: "Account",
          fields: [
            { id: "institution", type: "text", label: "Institution name" },
            ...addressFields("institution"),
            { id: "lastFour", type: "text", label: "Last 4 of account number" },
            {
              id: "type",
              type: "select",
              label: "Type",
              options: [
                { value: "checking", label: "Checking" },
                { value: "savings", label: "Savings" },
                { value: "moneyMarket", label: "Money market" },
                { value: "brokerage", label: "Brokerage" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "closingBalance", type: "currency", label: "Last balance before closing" },
            { id: "dateClosed", type: "date", label: "Date closed" },
          ],
        },
        {
          kind: "repeating-group",
          id: "safeDepositBoxes",
          label: "Safe deposit boxes (last year)",
          itemLabel: "Box",
          fields: [
            { id: "institution", type: "text", label: "Institution" },
            { id: "boxNumber", type: "text", label: "Box number" },
            { id: "contents", type: "text", label: "Contents" },
            { id: "datesAccessed", type: "text", label: "Dates accessed" },
          ],
        },
        {
          kind: "repeating-group",
          id: "storageUnits",
          label: "Storage units used in the last year",
          itemLabel: "Storage unit",
          fields: [
            { id: "facilityName", type: "text", label: "Storage facility name" },
            ...addressFields("storage"),
            { id: "contents", type: "text", label: "Contents" },
          ],
        },
      ],
    },
    {
      id: "propertyHeldForOthers",
      title: "Part 8 — Property held for someone else",
      items: [
        {
          kind: "repeating-group",
          id: "propertyHeldForOthers",
          label: "Property of someone else that you hold or control",
          itemLabel: "Property",
          fields: [
            { id: "ownerName", type: "text", label: "Owner's name" },
            ...addressFields("owner"),
            { id: "description", type: "text", label: "Description of property" },
            { id: "value", type: "currency", label: "Value" },
            { id: "location", type: "text", label: "Location of property" },
          ],
        },
      ],
    },
    {
      id: "environmental",
      title: "Part 9 — Environmental information",
      items: [
        {
          id: "noticedAsResponsible",
          type: "radio",
          label: "Have you been notified as a responsible party for any environmental site?",
          options: YES_NO,
        },
        {
          id: "noticedHazardousRelease",
          type: "radio",
          label: "Have you notified any governmental unit of a release of hazardous material?",
          options: YES_NO,
        },
        {
          id: "environmentalProceedings",
          type: "textarea",
          label: "Describe any pending or concluded environmental proceedings",
        },
      ],
    },
    {
      id: "businessConnections",
      title: "Part 10 — Business connections in the last 4 years",
      items: [
        {
          kind: "repeating-group",
          id: "businesses",
          label: "Businesses you owned or were associated with",
          itemLabel: "Business",
          fields: [
            { id: "name", type: "text", label: "Business name" },
            ...addressFields("business"),
            { id: "ein", type: "text", label: "EIN" },
            { id: "natureOfBusiness", type: "text", label: "Nature of the business" },
            { id: "from", type: "date", label: "Began" },
            { id: "to", type: "date", label: "Ended (leave blank if current)" },
          ],
        },
        {
          kind: "repeating-group",
          id: "bookkeepers",
          label: "Bookkeepers, accountants, and auditors (last 2 years)",
          itemLabel: "Person / firm",
          fields: [
            { id: "name", type: "text", label: "Name" },
            ...addressFields("books"),
            {
              id: "role",
              type: "select",
              label: "Role",
              options: [
                { value: "bookkeeper", label: "Bookkeeper" },
                { value: "accountant", label: "Accountant" },
                { value: "auditor", label: "Auditor" },
              ],
            },
            { id: "dates", type: "text", label: "Dates of service" },
          ],
        },
      ],
    },
  ],
};
