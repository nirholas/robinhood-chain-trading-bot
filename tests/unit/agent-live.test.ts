import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseEther, parseUnits, type Account, type Address } from 'viem'

// Live execution builds the swap and checks the allowance through hoodchain;
// stub both so the test drives only the agent's own handling of the receipt.
vi.mock('hoodchain', async (importOriginal) => {
  const actual = await importOriginal<typeof import('hoodchain')>()
  return {
    ...actual,
    buildSwapTx: (_client: unknown, quote: { amountOut: bigint }) => ({
      to: '0xCaf681a66D020601342297493863E78C959E5cb2',
      data: '0x',
      value: 0n,
      amountOutMinimum: quote.amountOut,
    }),
    ensureApproval: async () => null,
  }
})

const { Agent } = await import('../../src/framework/agent.js')
const { Journal } = await import('../../src/framework/journal.js')
const { KillSwitch } = await import('../../src/framework/kill.js')
const { FakeMarket } = await import('./helpers/fake-market.js')
import type { Market } from '../../src/framework/market.js'
import type { Strategy, StrategyTickContext } from '../../src/framework/strategy.js'
import type { Decision, Intent } from '../../src/framework/types.js'

const USDG = '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168' as Address
const TOKEN_A = '0x2222222222222222222222222222222222222b' as Address
const TX_HASH = `0x${'ab'.repeat(32)}` as const

class OneShot implements Strategy {
  readonly id = 'one-shot'
  readonly title = 'One shot'
  readonly quote = 'usdg' as const
  readonly meta = { edge: 'test double', failureModes: ['n/a'], params: {} }
  constructor(private intents: Intent[]) {}
  async tick(_ctx: StrategyTickContext): Promise<Decision> {
    const intents = this.intents
    this.intents = []
    return { intents, alerts: [] }
  }
}

function liveAgent(receiptStatus: 'success' | 'reverted') {
  const market = new FakeMarket()
  market.buyRoutes.set(TOKEN_A.toLowerCase(), parseEther('1000'))
  market.sellRoutes.set(TOKEN_A.toLowerCase(), parseUnits('9.5', 6))
  const sendTransaction = vi.fn(async () => TX_HASH)
  Object.assign(market.client, {
    chain: { id: 4663 },
    wallet: { sendTransaction },
    public: {
      ...market.client.public,
      waitForTransactionReceipt: async () => ({ status: receiptStatus, transactionHash: TX_HASH }),
    },
  })
  const journal = new Journal(':memory:')
  const kill = new KillSwitch('/nonexistent/KILL')
  const agent = new Agent({
    id: 'live-1',
    strategy: new OneShot([
      {
        side: 'buy',
        token: TOKEN_A,
        tokenSymbol: 'MEME',
        amountIn: parseUnits('10', 6),
        quoteToken: USDG,
        quoteSymbol: 'USDG',
        reason: 'test entry',
      },
    ]),
    market: market as unknown as Market,
    limits: { maxPositionUsdg: 50, maxDailySpendUsdg: 100, maxSlippageBps: 100, cooldownSeconds: 0 },
    journal,
    kill,
    mode: 'live',
    account: { address: '0x1111111111111111111111111111111111111111', type: 'local' } as unknown as Account,
    fleetMaxDailySpendUsdg: 250,
    fleetSpentTodayUsd: () => 0,
    reportFleetSpend: () => undefined,
    tickIntervalMs: 999_999_999,
  })
  return { agent, journal, kill, sendTransaction }
}

describe('Agent — live execution receipt handling', () => {
  let cleanup: (() => void) | null = null
  afterEach(() => {
    cleanup?.()
    cleanup = null
  })

  it('books a fill when the swap transaction succeeds', async () => {
    const { agent, journal, kill, sendTransaction } = liveAgent('success')
    cleanup = () => {
      journal.close()
      kill.dispose()
    }

    await agent.tick()

    expect(sendTransaction).toHaveBeenCalledTimes(1)
    const status = agent.status()
    expect(status.trades).toBe(1)
    expect(status.positions).toHaveLength(1)
    expect(journal.recentTrades('live-1', 5)[0]?.txHash).toBe(TX_HASH)
  })

  it('does not book a fill, a position or spend when the swap transaction reverts', async () => {
    const { agent, journal, kill, sendTransaction } = liveAgent('reverted')
    cleanup = () => {
      journal.close()
      kill.dispose()
    }

    await agent.tick()

    expect(sendTransaction).toHaveBeenCalledTimes(1)
    const status = agent.status()
    expect(status.trades).toBe(0)
    expect(status.refusals).toBe(1)
    expect(status.positions).toHaveLength(0)
    expect(status.spentTodayUsd).toBe(0)
    expect(journal.recentTrades('live-1', 5)).toHaveLength(0)
  })
})
