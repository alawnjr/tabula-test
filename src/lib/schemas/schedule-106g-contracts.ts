import { addressFields } from "./common";
import type { FormSchema } from "./types";

export const schedule106G: FormSchema = {
  id: "106G",
  title: "Schedule G — Contracts & Leases",
  longTitle: "Schedule G — Executory Contracts and Unexpired Leases",
  appliesTo: ["chapter7", "chapter13"],
  sections: [
    {
      id: "contracts",
      title: "Executory contracts and unexpired leases",
      description:
        "List any contracts or leases that have not been fully performed (e.g., apartment lease, car lease, cell phone contract, time-share).",
      items: [
        {
          kind: "repeating-group",
          id: "contracts",
          label: "Contracts and leases",
          itemLabel: "Contract / lease",
          fields: [
            { id: "otherParty", type: "text", label: "Name of other party" },
            ...addressFields("otherParty"),
            {
              id: "contractType",
              type: "select",
              label: "Type",
              options: [
                { value: "residentialLease", label: "Residential lease" },
                { value: "commercialLease", label: "Commercial lease" },
                { value: "vehicleLease", label: "Vehicle lease" },
                { value: "phone", label: "Phone / utility / internet" },
                { value: "timeshare", label: "Time-share" },
                { value: "service", label: "Service contract" },
                { value: "other", label: "Other" },
              ],
            },
            { id: "description", type: "textarea", label: "Brief description of contract or lease" },
            { id: "stateOfContract", type: "textarea", label: "State of the contract (e.g., behind by 2 months)" },
          ],
        },
      ],
    },
  ],
};
