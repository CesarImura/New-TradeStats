/*
 * Etapa 16: a time line of what the adaptation does, per card, recorded from outside (injected by the bench, after probe-observe.js).
 * Events: `detail` (data-detail-shown changed), `drops` (number of [data-dropped] parts after a change), `item` (height of the
 * card's cell), `card` (client size of the card), `cut` (the product's own cut() test, sampled every 100 ms for the watched ids, logged on change),
 * `mark` (a named instant, e.g. a viewport change). Times are performance.now() in ms. Not part of the product.
 */
;(() => {
  const T = (window.__tr = [])
  const now = () => Math.round(performance.now() * 10) / 10
  const WATCH = (window.__watch = new Set())
  const lastCut = new Map()
  const idOf = (n) => (n.closest ? n.closest("[data-widget-id]") : n.parentElement?.closest("[data-widget-id]"))?.dataset.widgetId
  const seen = new WeakSet()
  const ro = new ResizeObserver((es) => {
    for (const e of es) {
      const el = e.target
      const id = el.closest("[data-widget-id]")?.dataset.widgetId
      if (!id) continue
      if (el.dataset.widgetId) T.push({ t: now(), id, k: "item", v: Math.round(el.offsetHeight) })
      else T.push({ t: now(), id, k: "card", v: `${Math.round(el.clientWidth)}x${Math.round(el.clientHeight)}` })
    }
  })
  const attach = () => {
    for (const g of document.querySelectorAll("[data-widget-id]")) {
      if (!seen.has(g)) { seen.add(g); ro.observe(g) }
      const c = g.querySelector("[data-slot=widget]")
      if (c && !seen.has(c)) { seen.add(c); ro.observe(c) }
    }
  }
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      const id = idOf(r.target)
      if (!id) continue
      if (r.attributeName === "data-detail-shown") T.push({ t: now(), id, k: "detail", v: r.target.getAttribute("data-detail-shown") || "" })
      else if (r.attributeName === "data-dropped") {
        const card = r.target.closest("[data-slot=widget]")
        T.push({ t: now(), id, k: "drops", v: card ? card.querySelectorAll("[data-dropped]").length : -1 })
      }
    }
  })
  const start = () => {
    attach()
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-detail-shown", "data-dropped"] })
    setInterval(attach, 400)
    setInterval(() => {
      if (!window.__e0) return
      for (const id of WATCH) {
        const c = window.__e0.cutOf(id)
        if (lastCut.get(id) !== c) { lastCut.set(id, c); T.push({ t: now(), id, k: "cut", v: c ? 1 : 0 }) }
      }
    }, 100)
  }
  if (document.body) start()
  else document.addEventListener("DOMContentLoaded", start)
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) T.push({ t: Math.round(e.startTime * 10) / 10, id: "*", k: "long", v: Math.round(e.duration) }) }).observe({ entryTypes: ["longtask"] }) } catch {}
  window.__mark = (name) => T.push({ t: now(), id: "*", k: "mark", v: name })
  window.__trTake = () => { const o = T.splice(0, T.length); return o }
})()
