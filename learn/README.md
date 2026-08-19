# 学习模块 · x402-stall

```bash
cd x402-stall
npm test
npx tsx src/cli.ts serve --port 8420
# 另开终端
curl -sS http://127.0.0.1:8420/health          # 200
curl -sS -D- http://127.0.0.1:8420/demo/ping   # 402
```

`/health` 免费。`/demo/ping` 先 402，模拟付款后再给 JSON。

---

## 场景：HTTP 里那个从没被用过的 402

浏览器熟悉 404。协议里还有 **402 Payment Required**——「先付钱」。  
x402 把它变成机器能读的谈判：响应里写清收哪种稳定币、哪个网、付给谁、最多多少。客户端（人或 agent）付一笔 USDC，带上证明，再请求一次，得到资源。

中间多一个 **facilitator（促成人）**：帮卖方验签名、上链结算、做 KYT。卖方进程**不必**自己握热私钥去扫链。  
公开的 `https://x402.org/facilitator` 目前是测试网（Base Sepolia，`eip155:84532`）。主网一般要 Coinbase CDP 的钥匙。

本仓库默认 `sim`：用 HMAC 假装付过。为的是测试确定性。`PAY_TO=0x… X402_MODE=facilitator` 才走真 facilitator。

---

## 知识点 → 代码落点

| 词 | 人话 | 落在哪 |
|---|---|---|
| 402 | 要钱，不是失败 | `send(res, 402, …)` |
| PaymentRequirements | 收谁的、什么币、多少 | `facilitator.ts` 的 `requirements` |
| Facilitator | 第三方验+结算 | `verify` / `settle` |
| 模拟证明 | HMAC(secret, nonce:amount) | `proofFor` |
| 时序安全比较 | 防止用响应时间猜对了几位 | `timingSafeEqual` |
| 托管边界 | 不收买方助记词 | 卖方只配 `payTo` 地址 |

金额是**整数最小单位**字符串（USDC 6 位小数，`1000` = 0.001 USDC），和链上 `uint256` 对齐。

---

## 设计

- **两种模式一个 HTTP 面。** 测试走 sim，上线换 facilitator URL。客户端仍是「看到 402 → 付钱 → 带 X-PAYMENT」。
- **密钥隔离。** sim 的 HMAC 秘密只存在服务端环境变量；facilitator 模式连这都不要，验签外包。
- **先 supported 再说话。** 测试里打 `/supported`，确认对方还活着、还支持哪条网。

精读：`src/pay.ts` 的恒定时间比较；`src/facilitator.ts` 和 `src/server.ts` 里 `mode === "facilitator"` 分支。

---

## 动手

1. 不带支付头 curl `/demo/ping`，把 JSON 里的 `accepts` 画成「一张账单」。
2. 用测试里的 `/sim/pay` 走通一次，再故意改 `proof`，应回到 402。
3. `curl https://x402.org/facilitator/supported`，对照 `DEFAULT_NETWORK`。

---

## 故意没做

自建结算合约、在本进程里塞卖方热钱包、对接主网 CDP（那是账号和合规，不是再写一套协议）。摊位卖的是你其他仓库产出的数据，空店不要开。
