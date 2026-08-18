from __future__ import annotations

import argparse
import json
import sys
import urllib.request

from x402stall.pay import DEFAULT_AMOUNT, proof_for
from x402stall.server import serve, sim_secret


def cmd_serve(args) -> int:
    httpd = serve(args.host, args.port)
    print(f"listening http://{args.host}:{args.port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        return 0
    return 0


def cmd_doctor(args) -> int:
    # Refuse wallet-looking env names used as config file
    if args.config:
        data = json.loads(open(args.config, encoding="utf-8").read())
        from x402stall.secrets import forbidden_fields

        hits = forbidden_fields(data)
        if hits:
            print(f"doctor: forbidden secret field(s): {', '.join(hits)}", file=sys.stderr)
            return 2
    print("ok simulated facilitator (no user custody)")
    return 0


def cmd_prove(args) -> int:
    print(proof_for(sim_secret(), args.nonce, int(args.amount or DEFAULT_AMOUNT)))
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="x402-stall")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("serve")
    s.add_argument("--host", default="127.0.0.1")
    s.add_argument("--port", type=int, default=8420)
    s.set_defaults(func=cmd_serve)
    s = sub.add_parser("doctor")
    s.add_argument("--config", default=None)
    s.set_defaults(func=cmd_doctor)
    s = sub.add_parser("prove")
    s.add_argument("--nonce", required=True)
    s.add_argument("--amount", default=None)
    s.set_defaults(func=cmd_prove)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)
