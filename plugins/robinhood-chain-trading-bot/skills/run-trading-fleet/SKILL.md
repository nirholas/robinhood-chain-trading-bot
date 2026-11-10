---
name: run-trading-fleet
description: Run the hood-traders autonomous trading fleet for Robinhood Chain in paper mode and read its dashboard API (agents, trades, decision journal, kill switch). Use when asked to simulate, monitor or halt the fleet.
---

# Run the hood-traders fleet

`hood-traders` (npm, bin `hood-traders`) runs a fleet of strategy agents on Robinhood Chain (mainnet 4663, testnet 46630): `launch-sniper`, `momentum`, `premium-watch` and an optional `llm-strategist`. Each tick runs observe, decide, simulate (a real quoter `eth_call`), risk-check (fails closed), execute, journal. A local dashboard server exposes the state.

## Safety first

Paper mode is the default. It simulates fills against live market data and moves no funds. Live mode signs real transactions and needs both `HOOD_TRADERS_LIVE=1` and `ROBINHOOD_CHAIN_PRIVATE_KEY`. Do not enable live mode, and never ask the user to paste a key into the chat. If the user wants live mode, tell them to export those variables in their own shell, state the risk caps below, and get an explicit yes first. Stock Token acquisition additionally needs `HOOD_STOCK_TOKEN_ELIGIBLE=true`, which is the user's own legal affirmation; never set it for them.

## Launch (paper mode)

```bash
npx -y hood-traders
```

This starts the fleet (`sniper-1`, `momentum-1`, `premium-1`, plus `llm-1` when configured) and prints a banner with the network, mode, agents, caps and dashboard URL. Dashboard default: `http://localhost:4670`. Stop it with Ctrl-C, SIGTERM, a `KILL` file, or `POST /api/kill`; these halt new orders and never force-sell.

## Environment (all optional in paper mode)

- `HOOD_NETWORK`: `mainnet` (default) or `testnet`.
- `HOOD_RPC_URL`: custom RPC. Falls back to the public RPC.
- `DASHBOARD_PORT` (default 4670), `KILL_FILE` (default `./KILL`), `HOOD_TRADERS_DB` (default `./data/hood-traders.db`).
- Risk caps: `FLEET_MAX_DAILY_SPEND_USDG` (250), `AGENT_MAX_POSITION_USDG` (50), `AGENT_MAX_DAILY_SPEND_USDG` (100), `AGENT_MAX_SLIPPAGE_BPS` (100), `AGENT_COOLDOWN_SECONDS` (60).
- `llm-strategist`, only when both are set: `HOOD_LLM_PROVIDER` (`anthropic`, `openai`, `groq` or `openrouter`) and `HOOD_LLM_API_KEY`; optional `HOOD_LLM_MODEL`, `HOOD_LLM_MIN_CONFIDENCE` (0.6).

## Dashboard API

- `GET /api/health`, `GET /api/summary`, `GET /api/agents`, `GET /api/trades`
- `GET /api/agents/<id>/trades`, `/journal`, `/equity`
- `POST /api/kill`: trips the global kill switch.

## Worked example

```bash
npx -y hood-traders &          # paper mode, dashboard on :4670
sleep 20
curl -s localhost:4670/api/summary
curl -s localhost:4670/api/agents/sniper-1/journal
```

Report each agent's equity, open positions and the journal reasons for trades and refusals. Treat results as a simulation of one market window, not a forecast. Most new launches go to zero.
