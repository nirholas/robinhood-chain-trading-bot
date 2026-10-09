# AGENTS.md

Operating notes for AI coding agents (Claude Code, Codex, Cursor, Copilot and others) working in this repository. Everything here is derived from the files actually in the tree, so trust it over guesses, and update it when the facts change.

## What this repository is

Open-source autonomous trading bot for Robinhood Chain. Four strategies: launch sniping, momentum, Stock Token premium/discount arbitrage, and a bring-your-own-key LLM strategist (Claude, OpenAI, Groq, or OpenRouter). Real risk caps, real signed swaps, paper mode by default, live P&L dashboard.

- Homepage: https://nirholas.github.io/robinhood-chain-trading-bot/
- Source: https://github.com/nirholas/robinhood-chain-trading-bot
- Primary language: TypeScript
- License: Other (see the LICENSE file)

## Repository layout

- `dashboard/`
- `docs/`
- `scripts/`
- `src/`
- `tests/`
- `README.md`
- `LICENSE`
- `package.json`
- `Dockerfile`

Tests live in `tests/`. Add or update a test next to the code you change.

## Setup

```bash
npm install
```

## Commands

| Task | Command |
|---|---|
| dev | `npm run dev` |
| start | `npm start` |
| build | `npm run build` |
| test | `npm test` |
| typecheck | `npm run typecheck` |
| run with Docker | `docker compose up` |
| build image | `docker build .` |

Run the test and lint commands above before you consider a change finished. If a command fails on code you did not touch, say so in your report instead of silently skipping it.

## Conventions

- TypeScript runs in strict mode; do not loosen `tsconfig.json` to make an error go away.
- `.env` files are gitignored; never commit credentials, and read configuration from environment variables.
- Commit messages follow Conventional Commits (`type(scope): summary`), matching the existing history.
- Read the surrounding code before adding to it, and match its naming, file organisation and error-handling style.
- Keep `README.md` accurate: if a change alters behaviour, commands or configuration, update the docs in the same commit.
- Do not leave TODO comments, stub functions, placeholder data or commented-out code behind. Finish what you start or leave it out.
- Small, focused commits with a subject line that describes the change, not the act of committing.

## Where to raise things

- Bugs and feature requests: https://github.com/nirholas/robinhood-chain-trading-bot/issues
- Questions and ideas: https://github.com/nirholas/robinhood-chain-trading-bot/discussions
- Security issues: report privately at https://github.com/nirholas/robinhood-chain-trading-bot/security/advisories/new, never in a public issue.
