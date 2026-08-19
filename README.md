# x402-stall

**English** · [中文](README.zh-CN.md) — plan: [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md) · 学习: [learn/](learn/)

An HTTP **402 Payment Required** stall: agents or scripts pay a small USDC amount, then get JSON.

This repo is the **cash register**, not the store. Unique data should come from [hlsentry](https://github.com/toolazytoname/hlsentry), [oddsradar](https://github.com/toolazytoname/oddsradar), or [chaintail](https://github.com/toolazytoname/chaintail). Without unique data, do not “open a shop”.

## Status

**v0.1 runtime (TypeScript, Node ≥20).** Local simulated facilitator (HMAC-SHA256, timing-safe verify). No user custody, no real USDC required. This is the protocol-native stack (HTTP 402 / agent payments).

```bash
cd x402-stall
npm install
npm test
# 模拟 facilitator（测试 / 本地）
npx tsx src/cli.ts serve --port 8420
# 真 facilitator（Base Sepolia 公开 facilitator，收款地址用环境变量）
PAY_TO=0xYourAddress X402_MODE=facilitator npx tsx src/cli.ts serve --port 8420
```

公开 `https://x402.org/facilitator` 是测试网。主网要 CDP key，本进程仍然不托管买方私钥。

## What we will not do

- Invent a new payment protocol
- Name the company after x402
- Charge for public data anyone can scrape for free
- Custody user wallets

## License

MIT.

## Security

Read [`SECURITY.md`](SECURITY.md).
