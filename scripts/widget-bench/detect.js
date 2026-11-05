/*
 * In-page detector for the widget bench. Loaded by run.mjs (page.addScriptTag) and called as
 * window.__benchAnalyze(). It looks at every widget card (`[data-slot=widget]` inside `[data-widget-id]`) and returns,
 * per card: its size, a composition signature, and `findings` (defects) plus `intentional` (counts of things that look
 * like defects but are mechanisms the code does on purpose, with the mechanism named).
 *
 * Intentional mechanisms recognised (each one is read from the code, see README):
 *  - dropped      parts hidden by useDropToFit (`[data-dropped]`, parts/card.tsx)
 *  - rolling      odometer digits (`[data-rolling]`, parts/anatomy.tsx)
 *  - carousel     Embla viewports (inline touch-action pan-y) and snap scrollers (shelf.tsx)
 *  - scroll       a box that is meant to scroll (class overflow-auto / overflow-y-auto / overflow-x-auto)
 *  - wrapped-rows rows a flex-wrap column list moves out of sight to the side (GROW_ROWS, Watchlist): only when the whole
 *                 element is outside; a row cut in half is still a defect
 *  - ellipsis     text that ends in "…" (text-overflow) or a line-clamp
 *  - layered      overlap with an absolutely positioned or SVG layer (chart labels, badges)
 *  - stacked      overlap of items that are stacked on purpose with a negative margin (avatar stacks)
 *  - collapsed-separator  the "/" of the path header, hidden together with its section when that has no room left
 *  - sr-only      text for screen readers (Tailwind sr-only: a 1px clipped box)
 *  Overlap is judged on the letters (line rects cut to what is visible, narrowed to the letters' height), not on the boxes
 *  that hold them; odometer digits (`[data-rolling]`) are left out of it.
 */
;(() => {
  const TOL = 1.5
  const CONTENT_TAGS = new Set(["svg", "IMG", "CANVAS", "BUTTON", "INPUT", "VIDEO"])
  const rectOf = (e) => e.getBoundingClientRect()
  const ownText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  const label = (e) => `${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}${ownText(e) ? ` "${e.textContent.trim().slice(0, 24)}"` : ""}`
  /** The box and what it does to its children, for the report: `div.flex.min-h-0 [flex, overflow hidden/hidden, 324x150]`. */
  const boxInfo = (b) => { const cs = getComputedStyle(b), r = rectOf(b); return `${b.tagName.toLowerCase()}${typeof b.className === "string" && b.className ? "." + b.className.trim().split(/\s+/).slice(0, 2).join(".") : ""} [${cs.display}${cs.display.includes("flex") ? " " + cs.flexDirection + (cs.flexWrap !== "nowrap" ? " " + cs.flexWrap : "") : ""}, overflow ${cs.overflowX}/${cs.overflowY}, ${Math.round(r.width)}x${Math.round(r.height)}]` }
  /** The nearest ancestors that decide the layout (up to three), nearest first. */
  const ancestorsOf = (e, card) => chainOf(e, card).slice(0, 3).map(boxInfo)
  const commonAncestor = (a, b) => { for (let n = a.parentElement; n; n = n.parentElement) if (n.contains(b)) return n; return null }
  /** Where a text really sits on screen: its line rects, cut to its own box and to every box that clips it. */
  function textRects(e, chain) {
    // Only the element's own text nodes: what its children hold is judged on the children (an odometer's rolled-off digits are
    // inside a child that clips them, and must not be counted here).
    const rects = []
    for (const n of e.childNodes) {
      if (n.nodeType !== 3 || !n.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(n)
      rects.push(...range.getClientRects())
    }
    const clips = [e, ...chain].filter((b) => { const cs = getComputedStyle(b); return cs.overflowX !== "visible" || cs.overflowY !== "visible" }).map((b) => ({ r: rectOf(b), cs: getComputedStyle(b) }))
    const out = []
    // A text's client rects are its font's content area (taller than the letters, and taller than the line when the leading is tight):
    // the letters sit within about 0.38 em either side of the middle of that area, so that is what is compared.
    const fs = parseFloat(getComputedStyle(e).fontSize) || 12
    for (const q of rects) {
      if (q.width < 1 || q.height < 1) continue
      const mid = (q.top + q.bottom) / 2
      let x0 = q.left, x1 = q.right, y0 = Math.max(q.top, mid - 0.38 * fs), y1 = Math.min(q.bottom, mid + 0.38 * fs)
      for (const c of clips) {
        if (c.cs.overflowX !== "visible") { x0 = Math.max(x0, c.r.left); x1 = Math.min(x1, c.r.right) }
        if (c.cs.overflowY !== "visible") { y0 = Math.max(y0, c.r.top); y1 = Math.min(y1, c.r.bottom) }
      }
      if (x1 - x0 > 0.5 && y1 - y0 > 0.5) out.push({ left: x0, right: x1, top: y0, bottom: y1 })
    }
    return out
  }
  const SCROLL_CLASS = /(^|\s)([a-z-]+:)*overflow-(auto|y-auto|x-auto|scroll|y-scroll|x-scroll)(\s|$)|snap-x|snap-y/

  function chainOf(e, card) {
    const out = []
    for (let b = e.parentElement; b; b = b === card ? null : b.parentElement) out.push(b)
    return out
  }

  /** Visible part of `r` after every clipping ancestor up to the card. Returns { frac, clippedBy } */
  function visibleFraction(e, r, chain) {
    let x0 = r.left, x1 = r.right, y0 = r.top, y1 = r.bottom
    let clippedBy = null
    for (const b of chain) {
      const cs = getComputedStyle(b)
      const ox = cs.overflowX !== "visible", oy = cs.overflowY !== "visible"
      if (!ox && !oy) continue
      const br = rectOf(b)
      const nx0 = ox ? Math.max(x0, br.left) : x0, nx1 = ox ? Math.min(x1, br.right) : x1
      const ny0 = oy ? Math.max(y0, br.top) : y0, ny1 = oy ? Math.min(y1, br.bottom) : y1
      if ((nx0 > x0 + 0.5 || nx1 < x1 - 0.5 || ny0 > y0 + 0.5 || ny1 < y1 - 0.5) && !clippedBy) clippedBy = b
      x0 = nx0; x1 = nx1; y0 = ny0; y1 = ny1
    }
    const w = Math.max(0, x1 - x0), h = Math.max(0, y1 - y0)
    const area = Math.max(1, r.width * r.height)
    // width and height separately: a one-line text cut sideways loses width, not area-shaped
    const fracW = Math.min(1, w / Math.max(1, r.width)), fracH = Math.min(1, h / Math.max(1, r.height))
    return { fracW, fracH, frac: Math.min(fracW, fracH), fracArea: (w * h) / area, clippedBy, clip: { x0, x1, y0, y1 } }
  }

  /** Why an element that is cut or out of sight is fine, or null when it is a defect. */
  function intentional(e, r, v, chain) {
    if (e.closest("[data-dropped]")) return "dropped"
    if (e.closest("[data-rolling]")) return "rolling"
    for (const b of chain) {
      if (b.classList.contains("touch-pan-y") || /touch-action:\s*pan-y/.test(b.getAttribute("style") || "")) return "carousel"
      const cs = getComputedStyle(b)
      if ((cs.overflowX === "auto" || cs.overflowX === "scroll" || cs.overflowY === "auto" || cs.overflowY === "scroll") && SCROLL_CLASS.test(String(b.className))) return "scroll"
      if (cs.display === "flex" && cs.flexWrap.startsWith("wrap") && cs.flexDirection === "column" && cs.overflowX !== "visible") {
        const br = rectOf(b)
        // Whole rows only: an element completely outside to the side was moved out of sight on purpose.
        if (r.left >= br.right - TOL) return "wrapped-rows"
      }
      // A flex-wrap row strip that keeps only the first row (FitChips measures and drops the rest): wrapped below the strip.
      if (cs.display === "flex" && cs.flexWrap.startsWith("wrap") && cs.flexDirection === "row" && cs.overflowY !== "visible") {
        const br = rectOf(b)
        if (r.top >= br.bottom - TOL) return "wrapped-rows"
      }
    }
    // A separator that goes with its piece: a lone character (the "/" of the path header) wholly hidden by the box that holds it
    // and its section, when that section has itself collapsed to nothing. It is meant to vanish with it, rather than stay behind.
    if (v.clippedBy && e.textContent.trim().length === 1 && /[^\p{L}\p{N}]/u.test(e.textContent.trim()) && v.fracArea < 0.05) {
      const first = v.clippedBy.firstElementChild
      if (first && first !== e && rectOf(first).width < 2) return "collapsed-separator"
    }
    // "…" only excuses text that the clipping box itself ends with an ellipsis: text cut by some other box (a chip that
    // clips a longer span, for example) shows no "…" and is a defect.
    const clip = v.clippedBy
    if (clip) {
      const bs = getComputedStyle(clip)
      if (bs.textOverflow === "ellipsis" || (bs.webkitLineClamp && bs.webkitLineClamp !== "none")) return "ellipsis"
    }
    const es = getComputedStyle(e)
    if ((es.textOverflow === "ellipsis" || (es.webkitLineClamp && es.webkitLineClamp !== "none")) && !clip) return "ellipsis"
    return null
  }

  function analyzeCard(item) {
    const id = item.getAttribute("data-widget-id")
    const card = item.querySelector("[data-slot=widget]")
    if (!card) return { id, missing: true }
    const cr = rectOf(card)
    const findings = []
    const intent = {}
    const note = (k) => (intent[k] = (intent[k] || 0) + 1)
    const tokens = []
    let visibleSvg = 0
    const leaves = []
    const els = card.querySelectorAll("*")
    for (const e of els) {
      const cs = getComputedStyle(e)
      if (cs.display === "none" || cs.visibility === "hidden") continue
      const r = rectOf(e)
      if (r.width <= 0 || r.height <= 0) continue
      const isText = ownText(e)
      const isVisual = CONTENT_TAGS.has(e.tagName)
      if (!isText && !isVisual) continue
      if (isVisual && !isText && e.closest("[aria-hidden=true]")) continue // decorative
      if (e.closest(".sr-only")) { note("sr-only"); continue }
      const chain = chainOf(e, card)
      const v = visibleFraction(e, r, chain)
      const dropped = e.closest("[data-dropped]")
      if (dropped) { note("dropped"); continue }
      if (isText) tokens.push(e.textContent.trim().replace(/\d[\d.,]*/g, "#").slice(0, 18))
      else if (e.tagName === "svg" || e.tagName === "CANVAS") visibleSvg++
      // 1. Cut or out of sight
      // Text: a line box taller than the glyphs (line-height) may lose its leading at top or bottom without cutting a letter.
      const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2
      const leading = isText ? Math.max(0, (lineH - parseFloat(cs.fontSize)) / 2) : 0
      const cutX = (r.width - v.fracW * r.width), cutY = (r.height - v.fracH * r.height)
      const onlyLeading = isText && cutX < 1 && v.fracArea > 0.05 && cutY <= leading + 0.5
      if ((v.frac < 0.97 || v.fracArea < 0.97) && !onlyLeading) {
        const why = intentional(e, r, v, chain)
        if (why) note(why)
        else if (isText || e.tagName === "BUTTON" || e.tagName === "INPUT") {
          findings.push({ kind: v.fracArea < 0.05 ? "hidden-content" : "cut-content", el: label(e), visible: +Math.min(v.frac, v.fracArea).toFixed(2), by: v.clippedBy ? boxInfo(v.clippedBy) : "card", ancestors: ancestorsOf(e, card), right: Math.round(r.right - cr.right), bottom: Math.round(r.bottom - cr.bottom) })
        }
      }
      // 2. Text clipped by its own box without "…"
      if (isText && (cs.overflowX === "hidden" || cs.overflowX === "clip") && e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) {
        const why = intentional(e, r, v, chain)
        if (why === "ellipsis") note("ellipsis")
        else if (why) note(why)
        else findings.push({ kind: "text-clipped-no-ellipsis", el: label(e), scroll: e.scrollWidth, client: e.clientWidth, ancestors: ancestorsOf(e, card) })
      }
      // 3. Small text
      if (isText && parseFloat(cs.fontSize) < 10.5 && !e.closest("[aria-hidden=true]")) findings.push({ kind: "small-text", el: label(e), px: +parseFloat(cs.fontSize).toFixed(1), sev: "warn" })
      if (isText) leaves.push({ e, r, cs, chain })
    }
    // 4. Unexpected scroll boxes inside the card
    for (const b of els) {
      const cs = getComputedStyle(b)
      if ((cs.overflowY === "auto" || cs.overflowY === "scroll") && b.scrollHeight > b.clientHeight + 1 && b.clientHeight > 0 && !SCROLL_CLASS.test(String(b.className)) && !b.closest("[data-dropped]")) findings.push({ kind: "unexpected-scroll", el: label(b), scroll: b.scrollHeight, client: b.clientHeight })
    }
    // 5. The card itself clips its content (height)
    if (card.scrollHeight > card.clientHeight + 1) findings.push({ kind: "card-clips-content", scroll: card.scrollHeight, client: card.clientHeight })
    // 6. Overlap between the text itself (its line rects, cut to what is visible), not between the boxes that hold it.
    for (const l of leaves) l.q = textRects(l.e, l.chain)
    const flow = leaves.filter((l) => !l.e.closest("svg, [data-rolling]") && l.q.length)
    const layered = (l) => l.chain.some((b) => ["absolute", "fixed"].includes(getComputedStyle(b).position)) || ["absolute", "fixed"].includes(l.cs.position)
    const negMargin = (l) => [l.e, ...l.chain].some((n) => { const m = getComputedStyle(n); return parseFloat(m.marginLeft) < 0 || parseFloat(m.marginRight) < 0 })
    for (let i = 0; i < flow.length; i++) for (let j = i + 1; j < flow.length; j++) {
      const a = flow[i], b = flow[j]
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue
      let hit = null
      for (const p of a.q) for (const q of b.q) {
        const ix = Math.min(p.right, q.right) - Math.max(p.left, q.left), iy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top)
        if (ix > 2 && iy > 2 && (!hit || ix * iy > hit.ix * hit.iy)) hit = { ix, iy }
      }
      if (!hit) continue
      if (layered(a) || layered(b)) note("layered")
      else if (negMargin(a) || negMargin(b)) note("stacked")
      else {
        const via = commonAncestor(a.e, b.e)
        findings.push({ kind: "overlap", el: `${label(a.e)} × ${label(b.e)}`, px: `${Math.round(hit.ix)}x${Math.round(hit.iy)}`, a: boxInfo(a.e), b: boxInfo(b.e), via: via ? boxInfo(via) : "card" })
      }
    }
    return { id, w: Math.round(cr.width * 10) / 10, h: Math.round(cr.height * 10) / 10, drops: card.querySelectorAll("[data-dropped]").length, sig: [...new Set(tokens)].sort().join("¦"), svg: visibleSvg, findings, intentional: intent }
  }

  window.__benchAnalyze = () => {
    const cards = [...document.querySelectorAll("[data-widget-id]")].map(analyzeCard)
    return { cards, pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1, pageWidth: document.documentElement.clientWidth }
  }
})()
