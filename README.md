# x402-stall

**English** · [中文](README.zh-CN.md) — plan: [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md)

An HTTP **402 Payment Required** stall: agents or scripts pay a small USDC amount, then get JSON.

This repo is the **cash register**, not the store. Unique data should come from [hlsentry](https://github.com/toolazytoname/hlsentry), [oddsradar](https://github.com/toolazytoname/oddsradar), or [chaintail](https://github.com/toolazytoname/chaintail). Without unique data, do not “open a shop”.

## Status

Scaffold. Spec is in `docs/`. First goal is one working loop: request → 402 → pay → JSON.

## What we will not do

- Invent a new payment protocol
- Name the company after x402
- Charge for public data anyone can scrape for free
- Custody user wallets

## License

MIT.

## Security

Read [`SECURITY.md`](SECURITY.md).
