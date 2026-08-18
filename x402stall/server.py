from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

from x402stall.pay import (
    DEFAULT_AMOUNT,
    SIM_SECRET_ENV,
    make_challenge,
    parse_payment_header,
    verify_payment,
)

# nonce -> amount for open challenges (process-local sim facilitator)
OPEN: dict[str, int] = {}
PAID: set[str] = set()


def sim_secret() -> str:
    return os.environ.get(SIM_SECRET_ENV) or "dev-only-sim-secret-not-a-wallet"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        return

    def _send(self, code: int, body: dict, extra_headers: dict | None = None):
        raw = json.dumps(body).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        if extra_headers:
            for k, v in extra_headers.items():
                self.send_header(k, v)
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send(200, {"ok": True})
            return
        if path == "/demo/ping":
            header = self.headers.get("X-PAYMENT") or self.headers.get("X-Payment")
            if not header:
                ch = make_challenge(DEFAULT_AMOUNT)
                OPEN[ch.nonce] = ch.amount
                self._send(402, ch.to_402_body(), extra_headers={"X-Payment-Required": "sim"})
                return
            try:
                pay = parse_payment_header(header)
            except ValueError as e:
                self._send(400, {"ok": False, "error": str(e)})
                return
            nonce = pay["nonce"]
            amount = OPEN.get(nonce) or DEFAULT_AMOUNT
            if not verify_payment(sim_secret(), nonce, amount, pay["proof"]):
                self._send(402, {"ok": False, "error": "invalid payment"})
                return
            PAID.add(nonce)
            self._send(200, {"ok": True, "path": "/demo/ping", "nonce": nonce, "paid_amount": str(amount)})
            return
        self._send(404, {"ok": False, "error": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length") or "0")
        raw = self.rfile.read(length) if length else b"{}"
        try:
            body = json.loads(raw.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            self._send(400, {"ok": False, "error": "bad json"})
            return
        if path == "/sim/pay":
            nonce = body.get("nonce")
            if not nonce or nonce not in OPEN:
                self._send(400, {"ok": False, "error": "unknown nonce"})
                return
            amount = OPEN[nonce]
            proof = body.get("proof")
            if not proof:
                from x402stall.pay import proof_for

                proof = proof_for(sim_secret(), nonce, amount)
            if not verify_payment(sim_secret(), nonce, amount, proof):
                self._send(402, {"ok": False, "error": "invalid payment"})
                return
            PAID.add(nonce)
            self._send(200, {"ok": True, "nonce": nonce, "proof": proof, "amount": str(amount)})
            return
        self._send(404, {"ok": False, "error": "not found"})


def serve(host: str, port: int) -> ThreadingHTTPServer:
    return ThreadingHTTPServer((host, port), Handler)
