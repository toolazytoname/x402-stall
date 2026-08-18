# x402-stall

**English** · [中文](README.zh-CN.md) — plan: [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md)

An HTTP **402 Payment Required** stall: agents or scripts pay a small USDC amount, then get JSON.

This repo is the **cash register**, not the store. Unique data should come from [hlsentry](https://github.com/toolazytoname/hlsentry), [oddsradar](https://github.com/toolazytoname/oddsradar), or [chaintail](https://github.com/toolazytoname/chaintail). Without unique data, do not “open a shop”.

## Status

**v0.1 runtime (TypeScript, Node ≥20).** Local simulated facilitator (HMAC-SHA256, timing-safe verify). No user custody, no real USDC required. This is the protocol-native stack (HTTP 402 / agent payments).

```bash
cd x402-stall
npm install
npm test
npx tsx src/cli.ts doctor
npx tsx src/cli.ts serve --port 8420
# other terminal:
curl -sS http://127.0.0.1:8420/health
curl -sS -D- http://127.0.0.1:8420/demo/ping
```

## What we will not do

- Invent a new payment protocol
- Name the company after x402
- Charge for public data anyone can scrape for free
- Custody user wallets

## License

MIT.

## Security

Read [`SECURITY.md`](SECURITY.md).
