import { readFileSync } from "node:fs";
import { listen } from "./server.js";
import { DEFAULT_AMOUNT, proofFor, simSecret } from "./pay.js";
import { forbiddenFields } from "./secrets.js";

async function main(argv: string[]): Promise<number> {
  const cmd = argv[0];
  if (cmd === "serve") {
    const portIdx = argv.indexOf("--port");
    const hostIdx = argv.indexOf("--host");
    const port = portIdx >= 0 ? Number(argv[portIdx + 1]) : 8420;
    const host = hostIdx >= 0 ? String(argv[hostIdx + 1]) : "127.0.0.1";
    const { port: bound } = await listen(host, port);
    console.log(`listening http://${host}:${bound}`);
    return new Promise(() => {
      /* run until signal */
    });
  }
  if (cmd === "doctor") {
    const cfgIdx = argv.indexOf("--config");
    if (cfgIdx >= 0) {
      const data = JSON.parse(readFileSync(String(argv[cfgIdx + 1]), "utf8"));
      const hits = forbiddenFields(data);
      if (hits.length) {
        console.error(`doctor: forbidden secret field(s): ${hits.join(", ")}`);
        return 2;
      }
    }
    console.log("ok simulated facilitator (no user custody)");
    return 0;
  }
  if (cmd === "prove") {
    const nIdx = argv.indexOf("--nonce");
    const aIdx = argv.indexOf("--amount");
    const nonce = nIdx >= 0 ? String(argv[nIdx + 1]) : "";
    const amount = aIdx >= 0 ? Number(argv[aIdx + 1]) : DEFAULT_AMOUNT;
    console.log(proofFor(simSecret(), nonce, amount));
    return 0;
  }
  console.error("usage: x402-stall serve|doctor|prove");
  return 1;
}

main(process.argv.slice(2)).then(
  (code) => {
    if (code !== 0 && process.argv[2] !== "serve") {
      process.exit(code);
    }
  },
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
