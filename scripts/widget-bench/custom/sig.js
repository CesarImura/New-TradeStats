// Injected into the page: a signature of every card as drawn (structure, text and computed styles).
window.__sig = () => {
  const P = ["color", "backgroundColor", "backgroundImage", "borderTopColor", "borderTopWidth", "boxShadow", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "display", "width", "height", "borderTopLeftRadius", "visibility"]
  const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(16) }
  const clean = (s) => s.replace(/url\("?#[^")]+"?\)/g, "url(#)").replace(/ (id|for|aria-labelledby|aria-describedby|aria-controls)="[^"]*"/g, "")
  // The tree as drawn: elements that take no box (display: contents, the style scopes) are walked through, so a wrapper that
  // only re-sets variables is not a change; the effect of the variables is in the computed styles.
  let count = 0
  const walk = (n, parts) => {
    if (count > 1500) return
    if (n.nodeType === 3) { parts.html.push(n.textContent); return }
    if (n.nodeType !== 1) return
    const c = getComputedStyle(n)
    if (c.display === "contents") { for (const k of n.childNodes) walk(k, parts); return }
    count++
    // (An empty style="" is what a part shown again by Drop leaves behind: no difference on screen, the computed styles below carry the real ones.)
    // every attribute (href, src, aria-label, title, data-*), so a link target or a label that changes counts
    const at = n.getAttributeNames().filter((a) => a !== "id" && a !== "data-emphasis" && a !== "data-spotlight" && !(a === "style" && !n.getAttribute(a).trim())).sort().map((a) => a + "=" + n.getAttribute(a).replace(/_r_[0-9a-z]+_/g, "_r_").replace(/(opacity|transform): [^;]+;?/g, "")).map((kv) => (kv.startsWith("style=") ? "style=" + kv.slice(6).split(";").map((d) => d.trim()).filter(Boolean).sort().join(";") : kv)).join(" ")
    const svg = n.namespaceURI && n.namespaceURI.includes("svg")
    parts.html.push("<" + n.tagName + clean(" " + at) + ">")
    parts.style.push(P.map((p) => c[p]).join("|"))
    if (svg) {
      // A drawing is its marks and how they are painted, not the path of an animation frame: tag counts, the paints and dashes used, the text.
      const all = [...n.querySelectorAll("*")]
      const tags = {}, paints = new Set()
      for (const e of all) {
        tags[e.tagName] = (tags[e.tagName] || 0) + 1
        for (const a of ["fill", "stroke", "stroke-width", "stroke-dasharray", "rx", "class"]) { const v = e.getAttribute(a); if (v) paints.add(a + "=" + v.replace(/_r_[0-9a-z]+_/g, "_r_").replace(/\d+\.\d+/g, (m) => String(Math.round(Number(m))))) }
        const cs = getComputedStyle(e); paints.add("cf=" + cs.fill + "|cs=" + cs.stroke)
      }
      parts.html.push(clean(JSON.stringify(tags) + [...paints].sort().join(";")) + n.textContent)
      parts.html.push("</>")
      return
    }
    for (const k of n.childNodes) walk(k, parts)
    parts.html.push("</>")
  }
  const res = {}
  for (const el of document.querySelectorAll("[data-widget-id]")) {
    count = 0
    const parts = { html: [], style: [] }
    // the card itself (the editor wraps it in its own chips and outline: those are not the widget)
    const card = window.__SIG_WHOLE ? null : el.querySelector("[data-slot=widget]")
    for (const k of card ? [card] : el.childNodes) walk(k, parts)
    // A clock or a live price changes every second: for those widgets the digits are not compared (what is drawn, and where, still is).
    const live = /(^|-)(next-live|countdown|open-positions)$/.test(el.dataset.widgetId)
    const digits = (t) => (live ? t.replace(/[+\u2212-]?€?[\d.,]+/g, "#").replace(/var\(--(profit|loss)-text\)/g, "var(--pl)") : t)
    res[el.dataset.widgetId] = { html: fnv(digits(clean(parts.html.join("")))), style: fnv((live ? parts.style.map((x) => x.split("|").filter((_, i) => P[i] !== "width" && P[i] !== "color").join("|")) : parts.style).join(";")), h: el.offsetHeight, w: el.offsetWidth, ds: (el.querySelector("[data-slot=widget]") || el).dataset.detailShown || "", text: fnv(digits(el.innerText)), n: count, ...(window.__SIG_RAW ? { raw: digits(parts.html.join("")) } : {}) }
  }
  return res
}
