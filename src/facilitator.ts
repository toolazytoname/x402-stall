/** Public x402 facilitator client (verify/settle). Server never holds buyer keys. */

export type PaymentRequirements = {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  extra?: Record<string, unknown>;
};

export type StallMode = "sim" | "facilitator";

export type StallConfig = {
  mode: StallMode;
  facilitatorUrl: string;
  payTo: string;
  network: string;
  asset: string;
  amount: string;
};

export const DEFAULT_FACILITATOR = "https://x402.org/facilitator";
/** Base Sepolia USDC */
export const DEFAULT_ASSET = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
export const DEFAULT_NETWORK = "eip155:84532";

export function configFromEnv(): StallConfig {
  const facilitatorUrl = process.env.FACILITATOR_URL ?? DEFAULT_FACILITATOR;
  const payTo = process.env.PAY_TO ?? "";
  const mode: StallMode =
    process.env.X402_MODE === "facilitator" || payTo.length > 0 ? "facilitator" : "sim";
  return {
    mode,
    facilitatorUrl: facilitatorUrl.replace(/\/$/, ""),
    payTo,
    network: process.env.X402_NETWORK ?? DEFAULT_NETWORK,
    asset: process.env.X402_ASSET ?? DEFAULT_ASSET,
    amount: process.env.X402_AMOUNT ?? "1000",
  };
}

export function requirements(cfg: StallConfig): PaymentRequirements {
  return {
    scheme: "exact",
    network: cfg.network,
    maxAmountRequired: cfg.amount,
    payTo: cfg.payTo,
    asset: cfg.asset,
  };
}

export async function supported(baseUrl: string): Promise<unknown> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/supported`);
  if (!res.ok) {
    throw new Error(`facilitator /supported ${res.status}`);
  }
  return res.json();
}

export async function verify(
  baseUrl: string,
  paymentPayload: unknown,
  paymentRequirements: PaymentRequirements,
): Promise<{ isValid: boolean; invalidReason?: string }> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });
  const body = (await res.json()) as { isValid?: boolean; invalidReason?: string };
  if (!res.ok) {
    return { isValid: false, invalidReason: `http ${res.status}` };
  }
  if (body.isValid === true) {
    return { isValid: true };
  }
  return { isValid: false, invalidReason: body.invalidReason ?? `http ${res.status}` };
}

export async function settle(
  baseUrl: string,
  paymentPayload: unknown,
  paymentRequirements: PaymentRequirements,
): Promise<unknown> {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/settle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentPayload, paymentRequirements }),
  });
  if (!res.ok) {
    throw new Error(`facilitator /settle ${res.status}`);
  }
  return res.json();
}

export function challenge402(cfg: StallConfig): Record<string, unknown> {
  return {
    x402Version: 2,
    error: "Payment required",
    accepts: [requirements(cfg)],
  };
}
