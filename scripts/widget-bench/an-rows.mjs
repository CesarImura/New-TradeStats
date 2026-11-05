#!/usr/bin/env node
/*
 * Reads find-rows.mjs output. For each layout, detail, template and density it takes how many parts Drop removes at the widest
 * card with the layout's own default rows (the design's own give-way) and finds, at every card width, the fewest rows with no
 * defect that remove no more than that. Where that is more than the default rows the layout needs extra rows: it prints the widest card (and the widest
 * content, card less padding) that still needs them, per density, to set `narrow.cardBelow` / `contentBelow` from data.
 *   node scripts/widget-bench/an-rows.mjs rows.json
 */
import { readFileSync } from "node:fs"
const BASE = { // default rows per detail, from the registry (heightFor without `narrow`)
  "check-in|mood|4": { compact: 2.5, standard: 3.5, detailed: 3.5 }, "check-in|notes|4": { compact: 4.5, standard: 4.5, detailed: 5 },
  "next-live|split|4": { compact: 2, standard: 2.5, detailed: 3.5 }, "book-call|split|4": { compact: 2.5, standard: 3, detailed: 4 }, "coach-feedback|latest|4": { compact: 2, standard: 3, detailed: 4.5 },
}
// only what more height can fix: content cut or out of sight, a card that clips (an overlap or a text clipped by width is not a matter of rows)
const heightDefect = (b) => /^(cut-content|hidden-content|card-clips-content)/.test(b)
const PAD = { compact: 13.6, comfortable: 16, airy: 20.8 }
const rows = JSON.parse(readFileSync(process.argv[2], "utf8"))
const key = (r) => `${r.template}|${r.density}|${r.vw}`
const by = new Map()
for (const r of rows) { const [type, variant, w, detail] = r.id.split("|"); const id = `${type}|${variant}|${w}`; const k = `${id}|${detail}`; const g = by.get(k) || new Map(); const kk = key(r); const e = g.get(kk) || { template: r.template, density: r.density, vw: r.vw, w: r.w, byRows: new Map() }; e.byRows.set(r.rows, r); g.set(kk, e); by.set(k, g) }
for (const [k, g] of [...by].sort()) {
  const [type, variant, w, detail] = k.split("|"); const id = `${type}|${variant}|${w}`; const base = BASE[id][detail]
  // only pages where the height is fixed: the card is taller when asked for more rows
  const pts = [...g.values()].filter((e) => e.byRows.get(6).h > e.byRows.get(2).h + 20)
  const widest = {}
  for (const e of pts) { const c = widest[`${e.template}|${e.density}`]; if (!c || e.w > c.w) widest[`${e.template}|${e.density}`] = e }
  const need = []
  for (const e of pts) {
    const allowed = widest[`${e.template}|${e.density}`].byRows.get(base).drops
    let n = null
    for (const rr of [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]) { const r = e.byRows.get(rr); if (!r.bad.some(heightDefect) && r.drops <= allowed) { n = rr; break } }
    need.push({ ...e, need: n, content: e.w - 2 * PAD[e.density] })
  }
  const extra = need.filter((p) => p.need === null || p.need > base)
  const byD = {}
  for (const d of ["compact", "comfortable", "airy"]) {
    const a = need.filter((p) => p.density === d), x = extra.filter((p) => p.density === d)
    byD[d] = { n: a.length, extra: x.length, cardMax: x.length ? Math.max(...x.map((p) => p.w)) : null, cardNext: x.length ? Math.min(...a.filter((p) => !x.includes(p) && p.w > Math.max(...x.map((q) => q.w))).map((p) => p.w), Infinity) : null, contentNext: x.length ? Math.min(...a.filter((p) => !x.includes(p) && p.content > Math.max(...x.map((q) => q.content))).map((p) => p.content), Infinity) : null, contentMax: x.length ? Math.max(...x.map((p) => p.content)) : null, needMax: x.length ? Math.max(...x.map((p) => p.need ?? 7)) : null, clean: a.filter((p) => p.need !== null && p.need <= base && p.w < (x.length ? Math.max(...x.map((q) => q.w)) : 0)).length }
  }
  console.log(`${k.padEnd(34)} base ${base}  ` + Object.entries(byD).map(([d, v]) => `${d}: ${v.extra}/${v.n} extra${v.extra ? `, card ${Math.round(v.cardMax)}..${Math.round(v.cardNext)} content ${Math.round(v.contentMax)}..${Math.round(v.contentNext)} need ${v.needMax}` : ""}`).join(" | "))
}
