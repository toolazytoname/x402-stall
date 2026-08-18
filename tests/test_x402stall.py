from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from x402stall.pay import proof_for, verify_payment  # noqa: E402
from x402stall.server import serve, sim_secret  # noqa: E402


class TestPayMath(unittest.TestCase):
    def test_verify_good_and_bad(self):
        secret = "s"
        proof = proof_for(secret, "abc", 1000)
        self.assertTrue(verify_payment(secret, "abc", 1000, proof))
        self.assertFalse(verify_payment(secret, "abc", 1000, "00" * 32))
        self.assertFalse(verify_payment(secret, "abc", 999, proof))


class TestHTTP(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["X402_SIM_SECRET"] = "test-sim"
        cls.httpd = serve("127.0.0.1", 0)
        cls.port = cls.httpd.server_address[1]
        cls.t = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.t.start()
        cls.base = f"http://127.0.0.1:{cls.port}"

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()

    def _get(self, path, headers=None):
        req = urllib.request.Request(self.base + path, headers=headers or {})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode())

    def _post(self, path, body):
        data = json.dumps(body).encode()
        req = urllib.request.Request(self.base + path, data=data, headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.status, json.loads(resp.read().decode())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read().decode())

    def test_health(self):
        code, body = self._get("/health")
        self.assertEqual(code, 200)
        self.assertTrue(body["ok"])

    def test_402_then_pay_then_json(self):
        code, body = self._get("/demo/ping")
        self.assertEqual(code, 402)
        nonce = body["accepts"][0]["extra"]["nonce"]
        amount = int(body["accepts"][0]["maxAmountRequired"])
        self.assertEqual(amount, 1000)
        st, paid = self._post("/sim/pay", {"nonce": nonce})
        self.assertEqual(st, 200, paid)
        code2, body2 = self._get("/demo/ping", headers={"X-PAYMENT": json.dumps({"nonce": nonce, "proof": paid["proof"]})})
        self.assertEqual(code2, 200)
        self.assertTrue(body2["ok"])
        self.assertEqual(body2["paid_amount"], "1000")

    def test_bad_payment_rejected(self):
        code, body = self._get("/demo/ping")
        self.assertEqual(code, 402)
        nonce = body["accepts"][0]["extra"]["nonce"]
        code2, body2 = self._get(
            "/demo/ping",
            headers={"X-PAYMENT": json.dumps({"nonce": nonce, "proof": "deadbeef"})},
        )
        self.assertEqual(code2, 402)
        self.assertFalse(body2.get("ok", True))


class TestDoctor(unittest.TestCase):
    def test_doctor_secret(self):
        r = subprocess.run(
            [sys.executable, "-m", "x402stall", "doctor", "--config", str(ROOT / "fixtures/config.secret.json")],
            capture_output=True,
            text=True,
            env={**os.environ, "PYTHONPATH": str(ROOT)},
        )
        self.assertNotEqual(r.returncode, 0)
        self.assertNotIn("PLANT-SECRET-DO-NOT-LOG", r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
