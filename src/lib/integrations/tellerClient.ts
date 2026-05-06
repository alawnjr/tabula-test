// Minimal Teller HTTP client. Teller has no official Node SDK; calls go to
// https://api.teller.io/* using HTTP Basic auth with the access_token as the
// username and an empty password. Production + development environments also
// require client-side mTLS — set TELLER_CERT_PATH / TELLER_KEY_PATH (file
// paths, PEM-encoded) to enable. Sandbox does not need mTLS.

import https from "node:https";
import { readFileSync } from "node:fs";

const BASE_URL = "https://api.teller.io";
const API_VERSION = "2020-10-12";

let cachedAgent: https.Agent | null | undefined;

function getAgent(): https.Agent | undefined {
  if (cachedAgent !== undefined) return cachedAgent ?? undefined;
  const certPath = process.env.TELLER_CERT_PATH;
  const keyPath = process.env.TELLER_KEY_PATH;
  if (!certPath || !keyPath) {
    cachedAgent = null;
    return undefined;
  }
  const cert = readFileSync(certPath);
  const key = readFileSync(keyPath);
  cachedAgent = new https.Agent({ cert, key, keepAlive: true });
  return cachedAgent;
}

function basicAuthHeader(accessToken: string): string {
  const encoded = Buffer.from(`${accessToken}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function tellerGet<T>(
  accessToken: string,
  path: string
): Promise<T> {
  const url = new URL(path.startsWith("/") ? path : `/${path}`, BASE_URL);
  const agent = getAgent();
  return new Promise<T>((resolve, reject) => {
    const req = https.request(
      {
        method: "GET",
        host: url.hostname,
        path: url.pathname + url.search,
        port: 443,
        agent,
        headers: {
          Authorization: basicAuthHeader(accessToken),
          Accept: "application/json",
          "Teller-Version": API_VERSION,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          const status = res.statusCode ?? 0;
          if (status < 200 || status >= 300) {
            reject(new Error(`Teller ${status} ${path}: ${body.slice(0, 300)}`));
            return;
          }
          try {
            resolve(JSON.parse(body) as T);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

export type TellerAccount = {
  enrollment_id: string;
  id: string;
  name: string;
  type: "depository" | "credit";
  subtype: string;
  currency: string;
  last_four: string;
  status: "open" | "closed";
  institution: { id: string; name: string };
  links?: Record<string, string>;
};

export type TellerBalance = {
  account_id: string;
  ledger: string | null;
  available: string | null;
};

export type TellerTransaction = {
  id: string;
  account_id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: string; // negative = outflow, positive = inflow
  type?: string;
  status: "posted" | "pending";
  running_balance?: string | null;
  details?: {
    category?: string;
    counterparty?: { name?: string; type?: string };
  };
};
