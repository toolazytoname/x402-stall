import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  challengeBody,
  DEFAULT_AMOUNT,
  makeChallenge,
  parsePaymentHeader,
  proofFor,
  simSecret,
  verifyPayment,
} from "./pay.js";
import {
  challenge402,
  configFromEnv,
  settle,
  verify,
  type StallConfig,
} from "./facilitator.js";

const open = new Map<string, number>();

function send(res: ServerResponse, code: number, body: unknown, extra?: Record<string, string>): void {
  const raw = Buffer.from(JSON.stringify(body));
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Length", String(raw.length));
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      res.setHeader(k, v);
    }
  }
  res.end(raw);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function pathOf(req: IncomingMessage): string {
  return (req.url ?? "/").split("?")[0] ?? "/";
}

export function createStallServer(cfg: StallConfig = configFromEnv()): Server {
  return createServer((req, res) => {
    void handle(req, res, cfg);
  });
}

async function handle(req: IncomingMessage, res: ServerResponse, cfg: StallConfig): Promise<void> {
  const path = pathOf(req);
  if (req.method === "GET" && path === "/health") {
    send(res, 200, { ok: true });
    return;
  }
  if (req.method === "GET" && path === "/demo/ping") {
    const header = req.headers["x-payment"];
    if (!header || Array.isArray(header)) {
      if (cfg.mode === "facilitator") {
        send(res, 402, challenge402(cfg), { "X-Payment-Required": "x402" });
        return;
      }
      const ch = makeChallenge(DEFAULT_AMOUNT);
      open.set(ch.nonce, ch.amount);
      send(res, 402, challengeBody(ch), { "X-Payment-Required": "sim" });
      return;
    }
    if (cfg.mode === "facilitator") {
      try {
        const payload = JSON.parse(header);
        const reqs = {
          scheme: "exact",
          network: cfg.network,
          maxAmountRequired: cfg.amount,
          payTo: cfg.payTo,
          asset: cfg.asset,
        };
        const checked = await verify(cfg.facilitatorUrl, payload, reqs);
        if (!checked.isValid) {
          send(res, 402, { ok: false, error: checked.invalidReason ?? "invalid payment" });
          return;
        }
        const settled = await settle(cfg.facilitatorUrl, payload, reqs);
        send(res, 200, { ok: true, path: "/demo/ping", settled, paid_amount: cfg.amount });
      } catch (e) {
        send(res, 400, { ok: false, error: e instanceof Error ? e.message : "bad payment" });
      }
      return;
    }
    try {
      const pay = parsePaymentHeader(header);
      const amount = open.get(pay.nonce) ?? DEFAULT_AMOUNT;
      if (!verifyPayment(simSecret(), pay.nonce, amount, pay.proof)) {
        send(res, 402, { ok: false, error: "invalid payment" });
        return;
      }
      send(res, 200, { ok: true, path: "/demo/ping", nonce: pay.nonce, paid_amount: String(amount) });
    } catch (e) {
      send(res, 400, { ok: false, error: e instanceof Error ? e.message : "bad payment" });
    }
    return;
  }
  if (req.method === "POST" && path === "/sim/pay") {
    let body: { nonce?: string; proof?: string };
    try {
      body = JSON.parse(await readBody(req)) as { nonce?: string; proof?: string };
    } catch {
      send(res, 400, { ok: false, error: "bad json" });
      return;
    }
    const nonce = body.nonce;
    if (!nonce || !open.has(nonce)) {
      send(res, 400, { ok: false, error: "unknown nonce" });
      return;
    }
    const amount = open.get(nonce) ?? DEFAULT_AMOUNT;
    const proof = body.proof ?? proofFor(simSecret(), nonce, amount);
    if (!verifyPayment(simSecret(), nonce, amount, proof)) {
      send(res, 402, { ok: false, error: "invalid payment" });
      return;
    }
    send(res, 200, { ok: true, nonce, proof, amount: String(amount) });
    return;
  }
  send(res, 404, { ok: false, error: "not found" });
}

export function listen(
  host: string,
  port: number,
  cfg: StallConfig = configFromEnv(),
): Promise<{ server: Server; port: number }> {
  const server = createStallServer(cfg);
  return new Promise((resolve, reject) => {
    server.listen(port, host, () => {
      const addr = server.address();
      if (addr && typeof addr === "object") {
        resolve({ server, port: addr.port });
      } else {
        reject(new Error("no address"));
      }
    });
    server.on("error", reject);
  });
}
