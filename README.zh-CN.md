<p align="center">
  <img src="learn/assets/cover.jpg" alt="x402-stall：付一小笔链上费用后才抬起的道闸" width="880">
</p>

<h1 align="center">x402-stall</h1>

<p align="center">
  <strong>HTTP 402 Payment Required 摊位。</strong><br>
  脚本或 AI agent 付一笔小额 USDC，再拿走 JSON。本进程不托管买方私钥。
</p>

<p align="center">
  <a href="README.md">English</a> ·
  <a href="README.zh-CN.md"><strong>中文</strong></a> ·
  <a href="learn/README.md">学习</a> ·
  <a href="docs/PROJECT-PLAN.md">计划</a> ·
  <a href="SECURITY.md">安全</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-1F6FEB" alt="version 0.1.0">
  <img src="https://img.shields.io/badge/node-%E2%89%A520-339933" alt="Node ≥ 20">
  <img src="https://img.shields.io/badge/license-MIT-0B6E4F" alt="MIT license">
  <img src="https://img.shields.io/badge/mode-no--custody-111827" alt="不托管">
</p>

---

HTTP 里早就有 **402 Payment Required**。[x402](https://www.x402.org/) 让这个状态码能被机器读：收哪种稳定币、哪条网、付给谁、最多多少。**facilitator（促成人）** 负责验签和结算，卖方进程不必自己拿热钱包扫链。

这是**收银台**，不是店。独特数据应来自 [hlsentry](https://github.com/toolazytoname/hlsentry)、[oddsradar](https://github.com/toolazytoname/oddsradar) 或 [chaintail](https://github.com/toolazytoname/chaintail)。没有独特数据就不要开空店。

> 公开的 `https://x402.org/facilitator` 是**测试网**（Base Sepolia，`eip155:84532`）。主网一般要 Coinbase CDP 钥匙。本进程仍然不托管买方钱包。

## 为什么做这个

向 agent 按次收费是协议问题，不是再发一个币。x402-stall 说的是现有的 402 谈判。测试走本地**模拟** facilitator（HMAC-SHA256，时序安全比较），CI 不需要真 USDC。

## 能力

| | |
|---|---|
| **两种模式，同一张 HTTP 脸** | 测试用 `sim`；上线换公开 facilitator。客户端仍是 402 → 付钱 → 再请求。 |
| **不托管买方** | 用户付给*你*。你不向他们要助记词。 |
| **整数金额** | 最小单位字符串（6 位小数时 `1000` = 0.001 USDC）。 |
| **模拟验证明恒定时间** | HMAC 证明走 `timingSafeEqual`。 |
| **健康检查免费** | `GET /health` 是 200。收费演示是 `GET /demo/ping`。 |

## 怎么工作

<p align="center">
  <img src="learn/assets/architecture.svg" alt="x402-stall 架构：/health 免费，/demo/ping 先 402，再 sim HMAC 或 facilitator 验+结算，然后 JSON" width="880">
</p>

| 路径 | 鉴权 | 结果 |
|---|---|---|
| `GET /health` | 无 | `{"ok": true}` |
| `GET /demo/ping`（无 `X-PAYMENT`） | — | **402**，带 `accepts` / 付款要求 |
| `POST /sim/pay` | sim nonce | 返回 HMAC `proof`（仅本地模式） |
| `GET /demo/ping` + `X-PAYMENT` | proof 或 facilitator 载荷 | **200** JSON |

## 环境

- [Node.js](https://nodejs.org/) **≥ 20**
- `sim` 模式不需要钱包
- facilitator 模式需要收款地址（`PAY_TO`）以及能访问 facilitator URL

```bash
git clone https://github.com/toolazytoname/x402-stall.git
cd x402-stall
npm install
npm test
```

这是一个应用（`private: true`），不是要发到 npm 的库。

## 快速开始

**模拟 facilitator（测试 / 本机）：**

```bash
npx tsx src/cli.ts serve --port 8420
```

另开终端：

```bash
curl -sS http://127.0.0.1:8420/health
curl -sS -D- http://127.0.0.1:8420/demo/ping    # 402
```

不带支付头的 `GET /demo/ping` 会返回挑战。sim 模式下用该 nonce `POST /sim/pay` 拿到 proof，再放到 `X-PAYMENT` 里重试。

**公开 facilitator（Base Sepolia，仍然不要买方私钥）：**

```bash
PAY_TO=0xYourAddress X402_MODE=facilitator npx tsx src/cli.ts serve --port 8420
```

可选环境变量：

| 变量 | 默认 | 作用 |
|---|---|---|
| `X402_MODE` | 未设 `PAY_TO` 时为 `sim` | `sim` 或 `facilitator` |
| `PAY_TO` | 空 | 卖方收款地址 |
| `FACILITATOR_URL` | `https://x402.org/facilitator` | 验签 + 结算 |
| `X402_NETWORK` | `eip155:84532` | Base Sepolia |
| `X402_ASSET` | Base Sepolia USDC | ERC-20 地址 |
| `X402_AMOUNT` | `1000` | 最小单位 |
| `X402_SIM_SECRET` | 仅开发用的字符串 | **仅 sim** 的 HMAC 密钥 |

谈主网之前先确认 facilitator 还活着：

```bash
curl -sS https://x402.org/facilitator/supported
```

## 命令

| 命令 | 作用 |
|---|---|
| `serve [--host HOST] [--port N]` | 监听（默认 `127.0.0.1:8420`）。 |
| `doctor [--config FILE]` | 拒绝密钥形字段名；打印模式。 |
| `prove --nonce HEX [--amount N]` | 打印 sim HMAC 证明（本地测试）。 |

```bash
npx tsx src/cli.ts doctor
npm start    # tsx src/cli.ts serve --port 8420
```

## 测试

```bash
npm test
```

套件会做类型检查、拒绝带密钥形字段的 fixture、走通 health → 402 → sim 付款 → JSON，并拒绝错误 proof。打公开 facilitator 的 `/supported` 在网络不通时跳过。

## 安全

请读 **[`SECURITY.md`](SECURITY.md)**。

- 支付签名只记到够验、够幂等履约。
- 限制单笔付款能解锁的量。
- 不要卖你无权再分发的数据。
- 优先走 facilitator，让本进程不要握卖方热密钥。若必须有钥匙，必须限额且不作他用。
- sim 的 HMAC 秘密是环境变量，不是钱包。

## 明确不做

- 发明新支付协议
- 用协议名当公司名
- 把人人能白嫖的公开数据拿来收费
- 托管用户钱包
- 在本进程里自建结算合约
- v0.1 就接主网 CDP（那是账号和合规，不是再写一套协议）

## 学习

[`learn/`](learn/) 是 402 / facilitator 走读，加三步 curl 练习。封面动画：[`learn/assets/cover.mp4`](learn/assets/cover.mp4)。

## 相关

摊位要等到下面这些仓库产出值得付钱的数据才有意义：

- [hlsentry](https://github.com/toolazytoname/hlsentry)
- [oddsradar](https://github.com/toolazytoname/oddsradar)
- [chaintail](https://github.com/toolazytoname/chaintail)

## 许可

[MIT](LICENSE) © 2026 toolazytoname
