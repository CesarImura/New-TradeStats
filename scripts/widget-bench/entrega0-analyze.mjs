#!/usr/bin/env node
/*
 * Entrega 0 (E-1): reads the cell files written by entrega0.mjs and writes
 *   entrega0-cards.json   one compact record per card and cell (what the probe measured and how it is classified)
 *   entrega0-summary.json aggregates the report quotes
 * No decision is taken here: the numbers are descriptive (see the thresholds named below).
 *
 *   node entrega0-analyze.mjs --in DIR --out DIR
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs"
import { join, resolve } from "node:path"

const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const inDir = resolve(args.in), outDir = resolve(args.out)
mkdirSync(outDir, { recursive: true })
const files = readdirSync(join(inDir, "cells")).filter((f) => f.endsWith(".json")).sort()
const pct = (a, p) => (a.length ? [...a].sort((x, y) => x - y)[Math.min(a.length - 1, Math.floor((p / 100) * a.length))] : null)
const INTENT_KEEP = ["carousel", "scroll", "rolling", "ellipsis", "wrapped-rows", "layered", "stacked", "collapsed-separator"]

const records = []
const dyn = []
const cellsMeta = []
for (const f of files) {
  const d = JSON.parse(readFileSync(join(inDir, "cells", f), "utf8"))
  const m = d.meta
  const c = m.cell
  const cellId = `${c.plan}|${c.scenario}|${c.vw}|${c.template}|${c.mode}|${c.density}|${c.detail}`
  cellsMeta.push({ cellId, plan: c.plan, scenario: c.scenario, vw: c.vw, cols: m.cols, template: c.template, mode: c.mode, density: c.density, detail: c.detail, probed: !!(c.steps && m.cols === 3), half: m.halfRowPx })
  if (m.dynamic) dyn.push({ cellId, phases: m.dynamic })
  const exc = 16 + m.halfRowPx // descriptive threshold for "excess": the card's own bottom padding (about 16px) plus one half row
  for (const k of d.cards) {
    if (k.missing || !k.start) continue
    const [type, variant, w] = k.id.split("|")
    const s = k.start
    const flags = []
    if (Object.keys(s.defects).length) flags.push("real-cut")
    if (s.shown) flags.push("detail-reduced")
    if (s.drops > 0) flags.push("drop-hidden")
    for (const key of INTENT_KEEP) if (s.intent[key]) flags.push(`int:${key}`)
    if (s.free !== null && s.free >= exc) flags.push("excess")
    const n = k.need
    if (n) {
      if (flags.includes("real-cut") && n.clipPx === null) flags.push("unresolved:clip")
      if ((flags.includes("real-cut") || flags.includes("detail-reduced")) && n.detailPx === null) flags.push("unresolved:detail")
      if (flags.includes("drop-hidden") && n.dropPx === null) flags.push("unresolved:drop")
      if (n.nonMonotone) flags.push("non-monotone")
    }
    records.push({
      cell: cellId, plan: c.plan, scenario: c.scenario, vw: c.vw, cols: m.cols, template: c.template, mode: c.mode, density: c.density, detailAxis: c.detail,
      id: k.id, type, layout: variant, width: Number(w), requested: k.requested, shownAtStart: s.shown || null, dropsAtStart: s.drops, defectsAtStart: s.defects,
      intentAtStart: Object.fromEntries(INTENT_KEEP.filter((x) => s.intent[x]).map((x) => [x, s.intent[x]])), freeAtStart: s.free, cutAtStart: s.cut ?? null, cutAtBack: k.back?.cut ?? null, defectsAtBack: k.back ? Object.keys(k.back.defects || {}) : null, shownAtBack: k.back ? k.back.shown || null : null, estimatePx: s.est, itemPx: s.item, cardPx: s.card,
      needPx: n ? { clip: n.clipPx, detail: n.detailPx, drop: n.dropPx } : null, nonMonotone: n?.nonMonotone ?? null, attempts: k.attempts ?? null, grewAsAsked: k.grewAsAsked ?? null,
      flipsDuringProbe: n?.flips ?? null, loadHeightChanges: k.load?.hc ?? 0, loadDetailMutations: k.load?.df ?? 0, loadDropMutations: k.load?.dm ?? 0,
      returnsToStart: k.back ? k.back.same : null, flags,
    })
  }
}
writeFileSync(join(outDir, "entrega0-cards.json"), JSON.stringify({ at: new Date().toISOString(), thresholds: { excess: "free room under last content >= 16px + one half row (descriptive)", steps: "half rows [0,1,2,3,4,6,8] (A, A2) and [0,1,2,4,8] (B)" }, records }))

// ---- aggregates ------------------------------------------------------------------------------------------------------
const sum = { cells: cellsMeta.length, byPlan: {}, records: records.length }
for (const c of cellsMeta) sum.byPlan[c.plan] = (sum.byPlan[c.plan] || 0) + 1
const rate = (a, f) => a.filter(f).length

// A: per scenario at 3 columns, Terminal/dark/compact
const A = records.filter((r) => r.plan === "A")
sum.A = {}
for (const sc of [...new Set(A.map((r) => r.scenario))]) {
  const rs = A.filter((r) => r.scenario === sc)
  const half = 36
  const cut = rs.filter((r) => r.flags.includes("real-cut"))
  const red = rs.filter((r) => r.flags.includes("detail-reduced"))
  const redNoCut = red.filter((r) => !r.flags.includes("real-cut"))
  const need = (arr, key) => arr.map((r) => r.needPx?.[key]).filter((v) => v !== null && v !== undefined)
  const hs = (v) => v / half
  sum.A[sc] = {
    cards: rs.length, realCut: cut.length, detailReduced: red.length, detailReducedWithoutCut: redNoCut.length, dropHidden: rate(rs, (r) => r.flags.includes("drop-hidden")),
    excess: rate(rs, (r) => r.flags.includes("excess")),
    intent: Object.fromEntries(INTENT_KEEP.map((k) => [k, rate(rs, (r) => r.flags.includes(`int:${k}`))])),
    cutNeedClip: { n: cut.length, unresolved: cut.filter((r) => r.needPx.clip === null).length, p50hs: hs(pct(need(cut, "clip"), 50)), p90hs: hs(pct(need(cut, "clip"), 90)), maxhs: hs(Math.max(0, ...need(cut, "clip"))) },
    needDetailAmong: { n: red.length + cut.filter((r) => !r.flags.includes("detail-reduced")).length },
    redNeedDetail: { n: red.length, unresolved: red.filter((r) => r.needPx.detail === null).length, zero: red.filter((r) => r.needPx.detail === 0).length, p50hs: hs(pct(need(red, "detail"), 50)), p90hs: hs(pct(need(red, "detail"), 90)), maxhs: hs(Math.max(0, ...need(red, "detail"))) },
    redWithoutCutNeedDetail: { n: redNoCut.length, unresolved: redNoCut.filter((r) => r.needPx.detail === null).length, p50hs: hs(pct(need(redNoCut, "detail"), 50)), p90hs: hs(pct(need(redNoCut, "detail"), 90)), maxhs: hs(Math.max(0, ...need(redNoCut, "detail"))) },
    dropNeed: (() => { const dd = rs.filter((r) => r.flags.includes("drop-hidden")); const v = need(dd, "drop"); return { n: dd.length, unresolved: dd.filter((r) => r.needPx.drop === null).length, p50hs: hs(pct(v, 50)), p90hs: hs(pct(v, 90)), maxhs: hs(Math.max(0, ...v)) } })(),
    // cumulative: share of the cards with a need that is met by k half rows
    cumDetail: [0, 1, 2, 3, 4, 6, 8].map((h) => ({ hs: h, n: rate(rs, (r) => (r.flags.includes("detail-reduced") || r.flags.includes("real-cut")) && r.needPx.detail !== null && r.needPx.detail <= h * half) })),
    cumClip: [0, 1, 2, 3, 4, 6, 8].map((h) => ({ hs: h, n: rate(cut, (r) => r.needPx.clip !== null && r.needPx.clip <= h * half) })),
    nonMonotone: rate(rs, (r) => r.nonMonotone), returnsToStart: rate(rs, (r) => r.returnsToStart), notGrew: rate(rs, (r) => r.grewAsAsked === false), flips: rate(rs, (r) => r.flipsDuringProbe > 0),
    unresolvedDetail: rs.filter((r) => r.flags.includes("unresolved:detail")).map((r) => r.id),
    unresolvedClip: rs.filter((r) => r.flags.includes("unresolved:clip")).map((r) => r.id),
    unresolvedDrop: rs.filter((r) => r.flags.includes("unresolved:drop")).map((r) => r.id),
    freeP50: pct(rs.map((r) => r.freeAtStart).filter((v) => v !== null), 50), freeP90: pct(rs.map((r) => r.freeAtStart).filter((v) => v !== null), 90),
  }
}

// layouts that need height, across all probed cells (3 columns): how often and how much
const probed = records.filter((r) => r.needPx)
const byLayout = new Map()
for (const r of probed) {
  const key = `${r.type}|${r.layout}|${r.width}`
  const g = byLayout.get(key) || { key, cells: 0, needDetail: 0, needClip: 0, needDrop: 0, unresolvedDetail: 0, unresolvedClip: 0, unresolvedDrop: 0, maxDetailPx: 0, maxClipPx: 0, scen: new Set() }
  g.cells++
  const wantsDetail = r.flags.includes("detail-reduced") || r.flags.includes("real-cut")
  if (wantsDetail && r.needPx.detail > 0) { g.needDetail++; g.scen.add(r.scenario) }
  if (wantsDetail && r.needPx.detail === null) { g.unresolvedDetail++; g.scen.add(r.scenario) }
  if (r.flags.includes("real-cut") && r.needPx.clip > 0) { g.needClip++; g.maxClipPx = Math.max(g.maxClipPx, r.needPx.clip) }
  if (r.flags.includes("real-cut") && r.needPx.clip === null) g.unresolvedClip++
  if (r.flags.includes("drop-hidden") && r.needPx.drop > 0) g.needDrop++
  if (r.flags.includes("drop-hidden") && r.needPx.drop === null) g.unresolvedDrop++
  if (wantsDetail && r.needPx.detail > 0) g.maxDetailPx = Math.max(g.maxDetailPx, r.needPx.detail)
  byLayout.set(key, g)
}
sum.layouts = [...byLayout.values()].map((g) => ({ ...g, scen: [...g.scen].sort() })).filter((g) => g.needDetail || g.needClip || g.needDrop || g.unresolvedDetail || g.unresolvedClip || g.unresolvedDrop).sort((a, b) => b.needDetail + b.unresolvedDetail - (a.needDetail + a.unresolvedDetail))

// B: theme sweep, counts per cell (S0, S1, S5)
sum.B = cellsMeta.filter((c) => c.plan === "B").map((c) => {
  const rs = records.filter((r) => r.cell === c.cellId)
  return { scenario: c.scenario, template: c.template, mode: c.mode, density: c.density, cards: rs.length, realCut: rate(rs, (r) => r.flags.includes("real-cut")), detailReduced: rate(rs, (r) => r.flags.includes("detail-reduced")), needDetailGt0: rate(rs, (r) => (r.flags.includes("detail-reduced") || r.flags.includes("real-cut")) && r.needPx?.detail > 0), unresolvedDetail: rate(rs, (r) => r.flags.includes("unresolved:detail")), dropHidden: rate(rs, (r) => r.flags.includes("drop-hidden")), excess: rate(rs, (r) => r.flags.includes("excess")), maxDetailHs: Math.max(0, ...rs.map((r) => (r.needPx?.detail ?? 0) / c.half)) }
})

// C: 2 and 1 columns, passive
sum.C = cellsMeta.filter((c) => c.plan === "C").map((c) => {
  const rs = records.filter((r) => r.cell === c.cellId)
  return { scenario: c.scenario, vw: c.vw, cols: c.cols, template: c.template, density: c.density, cards: rs.length, realCut: rate(rs, (r) => r.flags.includes("real-cut")), detailReduced: rate(rs, (r) => r.flags.includes("detail-reduced")), dropHidden: rate(rs, (r) => r.flags.includes("drop-hidden")), excess: rate(rs, (r) => r.flags.includes("excess")), loadHcGt1: rate(rs, (r) => r.loadHeightChanges > 1) }
})

// data dependence: layouts whose start state differs between S0 and S8 (empty data) in plan A
{
  const s0 = new Map(A.filter((r) => r.scenario === "S0").map((r) => [r.id, r])), s8 = new Map(A.filter((r) => r.scenario === "S8").map((r) => [r.id, r]))
  const diff = []
  for (const [id, a] of s0) {
    const b = s8.get(id)
    if (!b) continue
    const sa = JSON.stringify([a.shownAtStart, a.dropsAtStart, Object.keys(a.defectsAtStart).sort()]), sb = JSON.stringify([b.shownAtStart, b.dropsAtStart, Object.keys(b.defectsAtStart).sort()])
    const freeD = a.freeAtStart !== null && b.freeAtStart !== null ? Math.abs(a.freeAtStart - b.freeAtStart) : 0
    if (sa !== sb || freeD >= 36) diff.push({ id, s0: a.flags.filter((f) => !f.startsWith("int:")), s8: b.flags.filter((f) => !f.startsWith("int:")), freeS0: a.freeAtStart, freeS8: b.freeAtStart, needDetailS0: a.needPx?.detail, needDetailS8: b.needPx?.detail })
  }
  sum.dataDependent = { n: diff.length, of: s0.size, items: diff.slice(0, 80) }
}

// note-dependence: need of the same card across S0, S1, S2 (plan A)
{
  const by = new Map()
  for (const r of A.filter((x) => ["S0", "S1", "S2", "S5", "S7"].includes(x.scenario))) { const g = by.get(r.id) || {}; g[r.scenario] = r.needPx?.detail ?? "none"; by.set(r.id, g) }
  sum.noteSpread = [...by.entries()].filter(([, g]) => new Set(Object.values(g)).size > 1).length
}

// stability from load: height changes and mutations between load and settled
{
  const rs = records.filter((r) => r.plan === "A" || r.plan === "C")
  sum.load = { cards: rs.length, hcP50: pct(rs.map((r) => r.loadHeightChanges), 50), hcP90: pct(rs.map((r) => r.loadHeightChanges), 90), hcMax: Math.max(0, ...rs.map((r) => r.loadHeightChanges)), dfP90: pct(rs.map((r) => r.loadDetailMutations), 90), dfMax: Math.max(0, ...rs.map((r) => r.loadDetailMutations)), dmP90: pct(rs.map((r) => r.loadDropMutations), 90), dmMax: Math.max(0, ...rs.map((r) => r.loadDropMutations)), hcGt1: rate(rs, (r) => r.loadHeightChanges > 1) }
}
sum.dynamic = dyn
sum.cellsMeta = cellsMeta
writeFileSync(join(outDir, "entrega0-summary.json"), JSON.stringify(sum, null, 1))
console.log(`records ${records.length}; cells ${cellsMeta.length}; wrote ${outDir}`)
