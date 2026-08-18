# Security

x402-stall accepts **inbound micropayments** and returns data. It must not custody user wallets or ask for their keys.

## Rules

- The stall’s receive address / facilitator config is yours. Users pay you; you do not take their seed.
- Do not log full payment signatures beyond what you need to verify and idempotently fulfill.
- Rate-limit and cap what a single payment unlocks.
- Do not sell data you are not allowed to redistribute.
- Secrets (facilitator tokens, wallet keys for *your* receive side if any) stay in `.env` (`chmod 0600`). Prefer a facilitator so this process never holds a hot key. If a key is unavoidable, it must be spend-limited and not used for anything else.

## Reporting

Open a private GitHub security advisory, or contact the maintainer on the GitHub profile.
