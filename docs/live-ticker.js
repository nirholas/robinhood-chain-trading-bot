// Live ticker — raw JSON-RPC calls straight from the browser to the public
// Robinhood Chain mainnet RPC. No SDK bundle, no server: this is the same
// read-only capability any client of the chain has. Two calls:
//   1. eth_blockNumber           — chain liveness
//   2. eth_call latestRoundData  — AAPL's Chainlink feed, decoded by hand
//
// Renders into the fixed ticker-tape strip pinned under the tabline on every
// page (see terminal.css .tickertape). The strip is display:contents-free —
// this script just fills #ticker-track twice back-to-back so the CSS marquee
// animation (translateX -50%) loops seamlessly.

const RPC_URL = 'https://rpc.mainnet.chain.robinhood.com'
const AAPL_FEED = '0x6B22A786bAa607d76728168703a39Ea9C99f2cD0'
// keccak256("latestRoundData()")[:4] — Chainlink AggregatorV3Interface selector.
const LATEST_ROUND_DATA_SELECTOR = '0xfeaf968c'

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error.message)
  return json.result
}

function decodeLatestRoundData(hex) {
  // Five ABI-encoded words: roundId(uint80) answer(int256) startedAt(uint256) updatedAt(uint256) answeredInRound(uint80)
  const data = hex.slice(2)
  const words = []
  for (let i = 0; i < 5; i++) words.push(data.slice(i * 64, i * 64 + 64))
  const answer = BigInt('0x' + words[1])
  const updatedAt = Number(BigInt('0x' + words[3]))
  return { answer, updatedAt }
}

function item(label, value) {
  return `<span class="tickertape__item">${label} <b>${value}</b></span><span class="tickertape__sep" aria-hidden="true">/</span>`
}

async function refresh() {
  const track = document.getElementById('ticker-track')
  if (!track) return
  try {
    const [blockHex, callResult] = await Promise.all([
      rpc('eth_blockNumber', []),
      rpc('eth_call', [{ to: AAPL_FEED, data: LATEST_ROUND_DATA_SELECTOR }, 'latest']),
    ])
    const blockNumber = BigInt(blockHex).toLocaleString('en-US')
    const { answer, updatedAt } = decodeLatestRoundData(callResult)
    const priceUsd = (Number(answer) / 1e8).toFixed(2)
    const ageMin = Math.max(0, Math.floor(Date.now() / 1000 - updatedAt) / 60).toFixed(0)

    const items = [
      item('robinhood-chain:4663 block', blockNumber),
      item('AAPL · Chainlink', `$${priceUsd}`),
      item('feed age', `${ageMin}m`),
      item('rpc', 'rpc.mainnet.chain.robinhood.com'),
    ].join('')
    // duplicate the content so the CSS -50% translateX loop is seamless
    track.innerHTML = items + items
  } catch (err) {
    track.innerHTML = `<span class="tickertape__item">could not reach the public RPC from your browser: ${err.message}</span>`
  }
}

refresh()
setInterval(refresh, 15_000)
