import assert from "node:assert/strict";
import { test } from "node:test";
import { proofFor, verifyPayment } from "../src/pay.ts";

test("verify good and bad proofs", () => {
  const proof = proofFor("s", "abc", 1000);
  assert.equal(verifyPayment("s", "abc", 1000, proof), true);
  assert.equal(verifyPayment("s", "abc", 1000, "00".repeat(32)), false);
  assert.equal(verifyPayment("s", "abc", 999, proof), false);
});
