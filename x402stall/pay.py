"""Simulated x402 challenge / fulfill. HMAC proof, integer amounts."""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

SIM_SECRET_ENV = "X402_SIM_SECRET"
DEFAULT_AMOUNT = 1000  # integer atomic USDC units (0.001 USDC if 6 decimals)


@dataclass(frozen=True)
class Challenge:
    nonce: str
    amount: int
    pay_to: str
    ts: int

    def to_402_body(self) -> dict:
        return {
            "x402Version": 1,
            "error": "Payment required",
            "accepts": [
                {
                    "scheme": "exact",
                    "network": "sim",
                    "maxAmountRequired": str(self.amount),
                    "payTo": self.pay_to,
                    "asset": "USDC",
                    "extra": {"nonce": self.nonce, "ts": self.ts},
                }
            ],
        }


def make_challenge(amount: int = DEFAULT_AMOUNT, pay_to: str = "sim:stall") -> Challenge:
    if amount <= 0:
        raise ValueError("amount must be positive integer")
    return Challenge(nonce=secrets.token_hex(16), amount=int(amount), pay_to=pay_to, ts=int(time.time()))


def proof_for(secret: str, nonce: str, amount: int) -> str:
    msg = f"{nonce}:{amount}".encode("utf-8")
    return hmac.new(secret.encode("utf-8"), msg, hashlib.sha256).hexdigest()


def verify_payment(secret: str, nonce: str, amount: int, proof: str) -> bool:
    expected = proof_for(secret, nonce, amount)
    return hmac.compare_digest(expected, proof)


def parse_payment_header(raw: str) -> dict:
    data = json.loads(raw)
    if not isinstance(data, dict) or "nonce" not in data or "proof" not in data:
        raise ValueError("payment must be JSON with nonce and proof")
    return data
