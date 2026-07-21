// Loads a captured paper-session summary (session.json, written by
// `npm run capture-session` / the ≥30-minute paper-mode soak run against live
// mainnet data) and renders it as a session log. Designed-empty state when no
// session has been captured into docs/ yet, and a plain-language fallback if
// fetch() can't reach session.json at all (e.g. opened via file:// — some
// browsers block same-origin fetch for local files; this is a real, honest
// failure mode, not swallowed silently).

function fmtUsd(n) {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function statRow(label, value, muted) {
  return `<div class="stat-row"><div class="stat-row__label">${label}</div><div class="stat-row__value${muted ? ' is-muted' : ''}">${value}</div></div>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function journalRow(j) {
  const time = new Date(j.ts).toLocaleTimeString('en-US', { hour12: false })
  const tag = j.kind === 'trade' ? 'TRADE' : j.kind === 'refused' ? 'REFUSED' : 'ALERT'
  return `<div class="journal-row journal-row--${j.kind}">
    <span class="journal-row__time">${time}</span>
    <span class="journal-row__tag">${tag}</span>
    <span class="journal-row__detail">${escapeHtml(j.agentId)} :: ${escapeHtml(j.detail)}</span>
  </div>`
}

async function render() {
  const summaryEl = document.getElementById('session-summary')
  const journalEl = document.getElementById('session-journal')
  if (!summaryEl || !journalEl) return
  try {
    const res = await fetch('session.json', { cache: 'no-store' })
    if (!res.ok) throw new Error('no session.json yet')
    const s = await res.json()

    summaryEl.innerHTML = [
      statRow('mode', s.mode === 'live' ? 'LIVE' : 'PAPER'),
      statRow('duration', `${s.durationMinutes} min`),
      statRow('network', s.network),
      statRow('agents', String(s.agents)),
      statRow('ticks', String(s.totalTicks)),
      statRow('trades executed', String(s.trades)),
      statRow('refusals (risk gate)', String(s.refusals)),
      statRow('fleet equity', fmtUsd(s.equityUsd)),
      statRow('captured', new Date(s.capturedAt).toUTCString(), true),
    ].join('')

    const rows = (s.journalExcerpt || []).slice(0, 20).map(journalRow).join('')
    journalEl.innerHTML = rows || '<div class="state-block">No journal rows in this excerpt.</div>'
  } catch {
    summaryEl.innerHTML = `<div class="state-block">
      No captured session loaded. Run <code>npm run capture-session</code> (a live-mainnet paper
      soak, see <a href="architecture.html">Architecture</a>) and copy its <code>session.json</code>
      output into <code>docs/</code> to populate this section. If you're viewing this file directly
      from disk (<code>file://</code>), some browsers also block local <code>fetch()</code> calls —
      serve <code>docs/</code> over any static HTTP server to see the captured run below.
    </div>`
    journalEl.innerHTML = ''
  }
}

render()
