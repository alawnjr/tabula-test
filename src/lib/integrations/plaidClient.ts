import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

let cached: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (cached) return cached;
  const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;
  const config = new Configuration({
    basePath: PlaidEnvironments[env] ?? PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID ?? "",
        "PLAID-SECRET": process.env.PLAID_SECRET ?? "",
      },
    },
  });
  cached = new PlaidApi(config);
  return cached;
}

export function getProducts(): Products[] {
  const raw = process.env.PLAID_PRODUCTS ?? "auth,liabilities,assets";
  const map: Record<string, Products> = {
    auth: Products.Auth,
    liabilities: Products.Liabilities,
    assets: Products.Assets,
    transactions: Products.Transactions,
    identity: Products.Identity,
    investments: Products.Investments,
  };
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .map((s) => map[s])
    .filter((p): p is Products => !!p);
}

export function getCountryCodes(): CountryCode[] {
  const raw = process.env.PLAID_COUNTRY_CODES ?? "US";
  const map: Record<string, CountryCode> = {
    US: CountryCode.Us,
    CA: CountryCode.Ca,
    GB: CountryCode.Gb,
  };
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .map((s) => map[s])
    .filter((c): c is CountryCode => !!c);
}
