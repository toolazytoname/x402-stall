# x402-stall

**English** · [中文](README.zh-CN.md) — plan: [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md)

An HTTP **402 Payment Required** stall: agents or scripts pay a small USDC amount, then get JSON.

This repo is the **cash register**, not the store. Unique data should come from [hlsentry](https://github.com/toolazytoname/hlsentry), [oddsradar](https://github.com/toolazytoname/oddsradar), or [chaintail](https://github.com/toolazytoname/chaintail). Without unique data, do not “open a shop”.

## Status

**v0.1 runtime.** Local simulated facilitator (HMAC proof). No user custody, no real USDC required.

```bash
cd x402-stall
PYTHONPATH=. python3 -m x402stall doctor
PYTHONPATH=. python3 -m x402stall serve --port 8420
# other terminal:
curl -sS http://127.0.0.1:8420/health
curl -sS -D- http://127.0.0.1:8420/demo/ping   # 402 + nonce
# POST /sim/pay {"nonce": "..."} then GET /demo/ping with header X-PAYMENT
PYTHONPATH=. python3 -m unittest discover -s tests -v
```

`GET /health` is free. `GET /demo/ping` returns **402** until a valid simulated payment, then JSON.

## What we will not do

- Invent a new payment protocol
- Name the company after x402
- Charge for public data anyone can scrape for free
- Custody user wallets

## License

MIT.

## Security

Read [`SECURITY.md`](SECURITY.md).
