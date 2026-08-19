import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SIM_SECRET_ENV = "X402_SIM_SECRET";
export const DEFAULT_AMOUNT = 1000;

export type Challenge = {
  nonce: string;
  amount: number;
  payTo: string;
  ts: number;
};

export function simSecret(): string {
  return process.env[SIM_SECRET_ENV] ?? "dev-only-sim-secret-not-a-wallet";
}

export function makeChallenge(amount: number = DEFAULT_AMOUNT, payTo = "sim:stall"): Challenge {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("amount must be a positive integer");
  }
  return {
    nonce: randomBytes(16).toString("hex"),
    amount,
    payTo,
    ts: Math.floor(Date.now() / 1000),
  };
}

export function proofFor(secret: string, nonce: string, amount: number): string {
  return createHmac("sha256", secret).update(`${nonce}:${amount}`).digest("hex");
}

export function verifyPayment(secret: string, nonce: string, amount: number, proof: string): boolean {
  const expected = proofFor(secret, nonce, amount);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(proof, "hex");
  if (a.length !== b.length) {
    return false;
  }
  // Constant-time compare: a naive `===` leaks via timing if an attacker forges proofs.
  return timingSafeEqual(a, b);
}

export function challengeBody(ch: Challenge): Record<string, unknown> {
  return {
    x402Version: 1,
    error: "Payment required",
    accepts: [
      {
        scheme: "exact",
        network: "sim",
        maxAmountRequired: String(ch.amount),
        payTo: ch.payTo,
        asset: "USDC",
        extra: { nonce: ch.nonce, ts: ch.ts },
      },
    ],
  };
}

export function parsePaymentHeader(raw: string): { nonce: string; proof: string } {
  const data = JSON.parse(raw) as { nonce?: unknown; proof?: unknown };
  if (typeof data.nonce !== "string" || typeof data.proof !== "string") {
    throw new Error("payment must be JSON with nonce and proof");
  }
  return { nonce: data.nonce, proof: data.proof };
}
