import assert from "node:assert/strict";
import { test } from "node:test";
import { listen } from "../src/server.ts";
import { forbiddenFields } from "../src/secrets.ts";
import { DEFAULT_FACILITATOR, supported } from "../src/facilitator.ts";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("doctor refuses planted secret", () => {
  const cfg = JSON.parse(readFileSync(join(root, "fixtures/config.secret.json"), "utf8"));
  const hits = forbiddenFields(cfg);
  assert.ok(hits.length > 0);
});

test("public facilitator /supported", async (t) => {
  try {
    const kinds = await supported(DEFAULT_FACILITATOR);
    assert.ok(kinds);
  } catch {
    t.skip("facilitator unreachable");
  }
});

test("health, 402, pay, json, reject bad pay", async () => {
  process.env.X402_SIM_SECRET = "test-sim";
  process.env.X402_MODE = "sim";
  process.env.PAY_TO = "";
  const { server, port } = await listen("127.0.0.1", 0, {
    mode: "sim",
    facilitatorUrl: DEFAULT_FACILITATOR,
    payTo: "",
    network: "eip155:84532",
    asset: "0x0",
    amount: "1000",
  });
  const base = `http://127.0.0.1:${port}`;
  try {
    const health = await fetch(`${base}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json() as { ok: boolean }).ok, true);

    const challenge = await fetch(`${base}/demo/ping`);
    assert.equal(challenge.status, 402);
    const body = (await challenge.json()) as {
      accepts: { extra: { nonce: string }; maxAmountRequired: string }[];
    };
    const nonce = body.accepts[0]?.extra.nonce;
    assert.ok(nonce);
    assert.equal(body.accepts[0]?.maxAmountRequired, "1000");

    const paidRes = await fetch(`${base}/sim/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce }),
    });
    assert.equal(paidRes.status, 200);
    const paid = (await paidRes.json()) as { proof: string };

    const ok = await fetch(`${base}/demo/ping`, {
      headers: { "X-PAYMENT": JSON.stringify({ nonce, proof: paid.proof }) },
    });
    assert.equal(ok.status, 200);
    const okBody = (await ok.json()) as { ok: boolean; paid_amount: string };
    assert.equal(okBody.ok, true);
    assert.equal(okBody.paid_amount, "1000");

    const ch2 = await fetch(`${base}/demo/ping`);
    const b2 = (await ch2.json()) as { accepts: { extra: { nonce: string } }[] };
    const nonce2 = b2.accepts[0]?.extra.nonce;
    const bad = await fetch(`${base}/demo/ping`, {
      headers: { "X-PAYMENT": JSON.stringify({ nonce: nonce2, proof: "deadbeef" }) },
    });
    assert.equal(bad.status, 402);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
