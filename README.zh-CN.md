# x402-stall

[English](README.md) · **中文** — 计划见 [docs/PROJECT-PLAN.md](docs/PROJECT-PLAN.md)

HTTP **402 Payment Required** 摊位：脚本或 AI agent 付一笔小额 USDC，再拿走 JSON。

这是**收银台**，不是店。独特数据应来自 [hlsentry](https://github.com/toolazytoname/hlsentry)、[oddsradar](https://github.com/toolazytoname/oddsradar) 或 [chaintail](https://github.com/toolazytoname/chaintail)。没有独特数据就不要开空店。

## 状态

**v0.1 可运行。** 本地模拟 facilitator。`GET /health` 免费，`GET /demo/ping` 先 402 再付钱后返回 JSON。

## 明确不做

- 发明新支付协议
- 用协议名当公司名
- 把人人能白嫖的公开数据拿来收费
- 托管用户钱包

后续工作在这个文件夹里展开。先读 `docs/PROJECT-PLAN.md`。
