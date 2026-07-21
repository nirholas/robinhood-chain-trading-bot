// command-bar.js — a real, working fuzzy jump-to palette. No framework, no
// build step, no dependency. Every entry below is a real anchor or page
// inside this docs/ folder (or the real GitHub repo) — nothing decorative.
// Progressive enhancement: the bar itself is display:none until this script
// runs (see terminal.css `html.js .cmdbar`), so a no-JS visitor never sees a
// dead input — they use the always-visible tabline and in-page anchor links
// instead (see each page's <nav class="tabline">).

const MANIFEST = [
  { group: 'index', label: 'overview & hero', href: 'index.html', kw: 'home overview root start index landing readme' },
  { group: 'index', label: 'four strategies, summarized', href: 'index.html#strategies', kw: 'strategies summary four list overview' },
  { group: 'index', label: 'live from Robinhood Chain mainnet', href: 'index.html#live', kw: 'live ticker mainnet rpc chain block feed aapl' },
  { group: 'index', label: 'a captured paper session', href: 'index.html#session', kw: 'session journal paper capture soak recorded' },
  { group: 'index', label: 'risk disclaimer', href: 'index.html#risk-disclaimer', kw: 'risk disclaimer danger warning funds real money' },
  { group: 'architecture', label: 'the pipeline trace', href: 'architecture.html', kw: 'architecture pipeline trace flow observe decide simulate risk execute journal' },
  { group: 'architecture', label: 'risk rails table', href: 'architecture.html#risk-rails', kw: 'risk rails caps kill switch position spend slippage cooldown env var' },
  { group: 'architecture', label: 'paper vs. live', href: 'architecture.html#paper-vs-live', kw: 'paper live mode difference identical mev slippage' },
  { group: 'architecture', label: 'why a fresh framework, not hoodkit', href: 'architecture.html#why-not-hoodkit', kw: 'hoodkit hoodchain sdk framework why adapter' },
  { group: 'strategies', label: 'strategy inspector (all four)', href: 'strategies.html', kw: 'strategies inspector all four' },
  { group: 'strategies', label: 'launch-sniper', href: 'strategies.html#launch-sniper', kw: 'launch sniper snipe launchpad noxa deployer round trip odyssey' },
  { group: 'strategies', label: 'momentum', href: 'strategies.html#momentum', kw: 'momentum breakout trend trailing stop graduated' },
  { group: 'strategies', label: 'premium-watch', href: 'strategies.html#premium-watch', kw: 'premium watch stock token chainlink discount spread oracle tesla tsla' },
  { group: 'strategies', label: 'llm-strategist', href: 'strategies.html#llm-strategist', kw: 'llm strategist ai claude anthropic openai groq openrouter confidence bring your own key' },
  { group: 'quickstart', label: 'run your fleet in 5 minutes', href: 'quickstart.html', kw: 'quickstart install run clone build fleet start' },
  { group: 'quickstart', label: 'docker', href: 'quickstart.html#docker', kw: 'docker compose container zero node build' },
  { group: 'quickstart', label: 'kill switch', href: 'quickstart.html#kill-switch', kw: 'kill switch halt stop sigint sigterm curl api' },
  { group: 'quickstart', label: 'going live (real funds)', href: 'quickstart.html#going-live', kw: 'live real funds private key trade env' },
  { group: 'quickstart', label: 'tune a strategy', href: 'quickstart.html#tune-a-strategy', kw: 'tune configure params strategy edit main.ts' },
  { group: 'external', label: 'GitHub — source repository', href: 'https://github.com/nirholas/robinhood-chain-trading-bot', kw: 'github repo source code repository' },
  { group: 'external', label: 'README — full docs & disclaimer', href: 'https://github.com/nirholas/robinhood-chain-trading-bot#readme', kw: 'readme docs full disclaimer license' },
]

// Subsequence fuzzy match: every query char must appear in order in the
// target; contiguous runs score higher, an early match scores higher.
function fuzzyScore(query, target) {
  if (!query) return -1
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  let score = 0
  let streak = 0
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      streak += 1
      score += 1 + streak
      qi += 1
    } else {
      streak = 0
    }
  }
  if (qi < q.length) return -1
  if (t.indexOf(q[0]) === 0) score += 5
  return score
}

function search(query) {
  const trimmed = query.trim()
  if (!trimmed) return []
  return MANIFEST.map((item) => ({ item, score: fuzzyScore(trimmed, `${item.label} ${item.kw}`) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.item)
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function init() {
  const input = document.getElementById('cmdbar-input')
  const listbox = document.getElementById('cmdbar-listbox')
  const status = document.getElementById('cmdbar-status')
  if (!input || !listbox) return

  let matches = []
  let activeIndex = -1

  function close() {
    listbox.hidden = true
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
    activeIndex = -1
  }

  function render() {
    listbox.innerHTML = matches
      .map(
        (m, i) => `<li id="cmdbar-opt-${i}" role="option" class="cmdbar__option" aria-selected="${i === activeIndex}">
          <span class="grp">${escapeHtml(m.group)}</span>
          <span class="lbl">${escapeHtml(m.label)}</span>
          <span class="hit">${escapeHtml(m.href)}</span>
        </li>`,
      )
      .join('')
    listbox.hidden = matches.length === 0
    input.setAttribute('aria-expanded', String(matches.length > 0))
    if (activeIndex >= 0) input.setAttribute('aria-activedescendant', `cmdbar-opt-${activeIndex}`)
    else input.removeAttribute('aria-activedescendant')
    if (status) {
      status.textContent = matches.length
        ? `${matches.length} match${matches.length === 1 ? '' : 'es'}`
        : input.value
          ? 'no matches'
          : ''
    }
  }

  function go(item) {
    if (!item) return
    window.location.href = item.href
  }

  input.addEventListener('input', () => {
    matches = search(input.value)
    activeIndex = matches.length ? 0 : -1
    render()
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (matches.length) activeIndex = (activeIndex + 1) % matches.length
      render()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (matches.length) activeIndex = (activeIndex - 1 + matches.length) % matches.length
      render()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(matches[activeIndex] || matches[0])
    } else if (e.key === 'Escape') {
      if (!listbox.hidden) close()
      else input.blur()
    }
  })

  listbox.addEventListener('mousedown', (e) => {
    // mousedown (not click) so it fires before the input's blur handler
    const li = e.target.closest('[role="option"]')
    if (!li) return
    e.preventDefault()
    const idx = Number(li.id.replace('cmdbar-opt-', ''))
    go(matches[idx])
  })

  input.addEventListener('focus', () => {
    if (input.value) {
      matches = search(input.value)
      activeIndex = matches.length ? 0 : -1
      render()
    }
  })

  input.addEventListener('blur', () => {
    window.setTimeout(close, 120)
  })

  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' && e.key !== ':') return
    const el = document.activeElement
    const isEditable = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
    if (isEditable) return
    e.preventDefault()
    input.focus()
    input.select()
  })
}

init()
