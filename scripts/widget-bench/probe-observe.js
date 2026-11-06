/*
 * Entrega 0 (E-1), observer injected by the bench. Loaded with page.addInitScript by entrega0.mjs; NOT part of the product
 * (nothing under src/ knows about it) and not loaded by run.mjs. It watches the page from outside:
 *
 *  - a MutationObserver on the attributes the product itself sets on cards: `data-detail-shown` (Detail below the chosen one,
 *    set by useFitDetail) and `data-dropped` (a part hidden by useDropToFit). It counts mutations, per card, per phase.
 *  - a ResizeObserver on every `.g-item` (the cell of a card): counts height changes of 1px or more, per card, per phase.
 *  - read(): the state of every card now (heights, Detail shown, parts dropped, defects and intentional mechanisms from the
 *    detector, free room under the last content).
 *
 * `mark()` returns the counts since the previous mark and starts a new phase. Mutation counts are raw: useDropToFit shows
 * everything and hides again in the same task when a card's size changes, so a re-fit counts as several mutations
 * even when the final state is the same. They measure how much the adaptation works, not how many times it is visible.
 */
;(() => {
  const S = { cur: {}, seen: new WeakSet(), last: new WeakMap() }
  const bucket = (id) => (S.cur[id] ||= { hc: 0, df: 0, dm: 0 })
  const idOf = (n) => (n.closest ? n.closest("[data-widget-id]") : n.parentElement?.closest("[data-widget-id]"))?.dataset.widgetId
  const ro = new ResizeObserver((entries) => {
    for (const en of entries) {
      const el = en.target
      const h = el.offsetHeight
      const prev = S.last.get(el)
      S.last.set(el, h)
      if (prev !== undefined && Math.abs(prev - h) >= 1) bucket(el.dataset.widgetId).hc++
    }
  })
  const attach = () => {
    for (const el of document.querySelectorAll("[data-widget-id]")) {
      if (S.seen.has(el)) continue
      S.seen.add(el)
      S.last.set(el, el.offsetHeight)
      ro.observe(el)
    }
  }
  const mo = new MutationObserver((recs) => {
    for (const r of recs) {
      if (r.type === "attributes") {
        const id = idOf(r.target)
        if (!id) continue
        if (r.attributeName === "data-detail-shown") bucket(id).df++
        else if (r.attributeName === "data-dropped") bucket(id).dm++
      }
    }
  })
  const start = () => {
    attach()
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-detail-shown", "data-dropped"] })
    setInterval(attach, 500)
  }
  if (document.body) start()
  else document.addEventListener("DOMContentLoaded", start)

  const LEAF = new Set(["svg", "IMG", "CANVAS", "BUTTON", "INPUT", "VIDEO"])
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  /** Room left under the last visible content of the card, in px (includes the card's own bottom padding). */
  function free(card) {
    const cr = card.getBoundingClientRect()
    let b = -Infinity
    for (const e of card.querySelectorAll("*")) {
      if (e.closest("[data-dropped], .sr-only")) continue
      if (!(LEAF.has(e.tagName) || ownText(e))) continue
      const cs = getComputedStyle(e)
      if (cs.display === "none" || cs.visibility === "hidden") continue
      const r = e.getBoundingClientRect()
      if (r.width < 1 || r.height < 1 || r.top >= cr.bottom - 0.5) continue
      b = Math.max(b, Math.min(r.bottom, cr.bottom))
    }
    return b === -Infinity ? null : Math.round((cr.bottom - b) * 10) / 10
  }

  /*
   * cutLike(card): a verbatim port of `cut()` from src/components/widgets/parts/card.tsx (commit 040a57d, plus `[data-clip]` from Etapa 2; unchanged by the Etapa 11
   * commit), the check the product's own Drop and Detail adaptation rely on. It is copied here, not imported, so the product
   * is not touched; if cut() changes in the product this copy must be updated (the bench cannot see that by itself).
   * It lets the bench ask: where the detector sees a defect, does the product's check see it too?
   */
  const scaleOf = (el) => (el.offsetHeight ? el.getBoundingClientRect().height / el.offsetHeight : 1) || 1
  function cutLike(card) {
    const k = scaleOf(card)
    for (const el of card.querySelectorAll("*")) {
      const tag = el.tagName
      const leaf = tag === "svg" || tag === "BUTTON" || tag === "IMG" || tag === "INPUT" || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())
      if (!leaf || el.closest("[data-dropped], [data-rolling] [aria-hidden], [data-clip]")) continue
      const r = el.getBoundingClientRect()
      if (r.height < 1 || r.width < 1) continue
      let limit = Infinity
      let right = Infinity
      let scrolls = false
      for (let box = el.parentElement; box; box = box === card ? null : box.parentElement) {
        const o = getComputedStyle(box)
        if (o.overflowY === "auto" || o.overflowY === "scroll") { scrolls = true; break }
        if (o.overflowY === "visible" && o.overflowX === "visible") continue
        const b = box.getBoundingClientRect()
        const pad = parseFloat(o.paddingBottom)
        limit = Math.min(limit, b.bottom - k * (box === card ? pad / 2 : pad > 0 ? pad + parseFloat(o.borderBottomWidth) - 2 : parseFloat(o.borderBottomWidth)))
        right = Math.min(right, b.right)
      }
      if (scrolls || r.left >= right - k) continue
      if (r.bottom > limit + k) return true
    }
    return false
  }
  const WARN = new Set(["small-text"])
  window.__e0 = {
    mark() {
      attach()
      const out = S.cur
      S.cur = {}
      return out
    },
    /** Light read: only what the adaptation decides (Detail shown, parts dropped, height of the cell and of the card). */
    light() {
      return [...document.querySelectorAll("[data-widget-id]")].map((g) => {
        const card = g.querySelector("[data-slot=widget]")
        return [g.dataset.widgetId, g.offsetHeight, card ? card.dataset.detailShown || "" : null, card ? card.querySelectorAll("[data-dropped]").length : null]
      })
    },
    /** Full read, with the detector: one record per card. */
    read() {
      const an = window.__benchAnalyze()
      const byId = new Map(an.cards.map((c) => [c.id, c]))
      return [...document.querySelectorAll("[data-widget-id]")].map((g) => {
        const id = g.dataset.widgetId
        const c = byId.get(id)
        const card = g.querySelector("[data-slot=widget]")
        if (!c || c.missing || !card) return { id, missing: true }
        const defects = {}
        for (const f of c.findings || []) if (!WARN.has(f.kind) && f.sev !== "warn") defects[f.kind] = (defects[f.kind] || 0) + 1
        return { id, item: g.offsetHeight, est: g.style.height || null, card: Math.round(card.getBoundingClientRect().height * 10) / 10, shown: c.detailShown, drops: c.drops, defects, intent: c.intentional || {}, free: free(card), cut: cutLike(card) }
      })
    },
    /** cutLike of one card by widget id (the product's own test, see cutLike). */
    cutOf(id) {
      const g = document.querySelector(`[data-widget-id="${id}"]`)
      const card = g?.querySelector("[data-slot=widget]")
      return card ? cutLike(card) : null
    },
    cols() {
      const page = document.querySelector(".g-page")
      const w = page?.parentElement?.clientWidth || 0
      return w >= 960 ? 3 : w >= 640 ? 2 : w > 0 ? 1 : 0
    },
    pageHeight: () => document.documentElement.scrollHeight,
    /** Raises the height of every non-core card's cell by `k` px over the base it had when first asked (inline style, page only). */
    grow(k) {
      for (const g of document.querySelectorAll("[data-widget-id]")) {
        if (g.dataset.e0base === undefined) { g.dataset.e0base = String(g.getBoundingClientRect().height); g.dataset.e0orig = g.style.height }
        if (k === null) g.style.height = g.dataset.e0orig
        else g.style.height = `${Number(g.dataset.e0base) + k}px`
      }
    },
  }
})()
