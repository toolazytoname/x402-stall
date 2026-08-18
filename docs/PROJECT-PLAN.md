# x402-stall — 项目说明

> 推荐顺序第 4。收费插头，不当公司。  
> 来源：`web3_explore/doc/next/WEB3-DIRECTIONS.md`

## 概述

HTTP 402 = 先付钱。x402 让程序或 agent 付一笔 USDC 再拿数据。本仓库是收银台。店里的货应来自 hlsentry / oddsradar / chaintail。

没有独特数据时，第一目标只是**跑通链路**，不要对外宣称开店。

## 你自己怎么用

自己的脚本查一次数据，走一遍「付钱再取」。

## 一开始

一个最小端点，例如：

```text
GET /health          → 200 免费
GET /demo/ping       → 402，付完返回 {"ok": true, "ts": ...}
```

用官方 facilitator（例如 Coinbase CDP / x402 文档里的托管方案），尽量让本进程不持热私钥。

## 后面

只挂你自己独有的查询：清算距离、价差、本地 tail 结果。

## 上限

按次或包月的收费层。协议可以很大，你只占一个摊位。不要把公司命名成 x402。

## 挣钱

早期每次几美分，总量会很小。价值在演示和以后的收费口。黑客松很好讲。

## 参考（动手前再打开核对）

- https://github.com/coinbase/x402
- https://docs.cdp.coinbase.com/x402/docs/welcome

## 本周先做（有空再开）

1. 读完 x402 最小例子（TS 或 Go SDK，选你熟的）
2. 本地跑通一次 402 → 测试网/小额支付 → JSON
3. 在本仓库记下用了哪个 facilitator，以及本进程**有没有**碰到私钥
