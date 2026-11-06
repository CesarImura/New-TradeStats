#!/usr/bin/env node
/*
 * Compares two bench runs (results.json): per cell and card, what appeared or disappeared on the card (composition), height,
 * parts removed by Drop/cut, and findings that are new or gone. Use it to measure what a change (a new threshold, a theme
 * tweak) does before it is migrated.   node compare.mjs <before/results.json> <after/results.json> [--out report.md]
 */
import { readFileSync, writeFileSync } from "node:fs"
const [a, b] = process.argv.slice(2).filter((x, i, all) => !x.startsWith("--") && !(i > 0 && all[i - 1].startsWith("--")))
const outIdx = process.argv.indexOf("--out")
// --ignore type,type: widgets whose content changes on every load (open-positions draws live-looking figures); counted, listed in the report
const ignIdx = process.argv.indexOf("--ignore")
const ignore = ignIdx > 0 ? process.argv[ignIdx + 1].split(",") : []
const A = JSON.parse(readFileSync(a, "utf8")), B = JSON.parse(readFileSync(b, "utf8"))
// a run with scenarios (run.mjs --scenarios) keeps each scenario apart; without one the key is what it always was
const key = (c) => `${c.scenario ? c.scenario + "|" : ""}${c.vw}|${c.template}|${c.mode}|${c.density}|${c.detail}`
const mapB = new Map(B.results.map((r) => [key(r.cell), r]))
const changes = []
let compared = 0, ignored = 0
for (const ra of A.results) {
  const rb = mapB.get(key(ra.cell)); if (!rb) continue
  const cb = new Map(rb.cards.map((c) => [c.id, c]))
  for (const x of ra.cards) {
    const y = cb.get(x.id); if (!y || x.missing || y.missing) continue
    if (ignore.includes(x.id.split("|")[0])) { ignored++; continue }
    compared++
    // numbers are collapsed ("#"), so live figures that change length between runs are not read as a composition change
    const nz = (t) => t.replace(/#+(?:[.,]#+)*/g, "#")
    const sx = new Set((x.sig || "").split("¦").map(nz)), sy = new Set((y.sig || "").split("¦").map(nz))
    const gone = [...sx].filter((t) => !sy.has(t)), added = [...sy].filter((t) => !sx.has(t))
    const fk = (c) => new Set((c.findings || []).filter((f) => f.sev !== "warn").map((f) => `${f.kind} ${String(f.el || "").replace(/\d+/g, "#")}`))
    const fx = fk(x), fy = fk(y)
    const newF = [...fy].filter((f) => !fx.has(f)), goneF = [...fx].filter((f) => !fy.has(f))
    const dh = Math.abs(x.h - y.h) > 2, dd = x.drops !== y.drops
    if (gone.length || added.length || newF.length || goneF.length || dh || dd) changes.push({ cell: ra.cell, id: x.id, gone, added, newF, goneF, h: [x.h, y.h], drops: [x.drops, y.drops] })
  }
}
const L = [`# Bench comparison`, "", `- Before: ${a}`, `- After: ${b}`, `- Cards compared: ${compared}. Cards that changed: ${changes.length}.${ignore.length ? ` Ignored ${ignored} cards of: ${ignore.join(", ")} (content changes on every load).` : ""}`, ""]
const byCard = new Map()
for (const c of changes) { const g = byCard.get(c.id) || []; g.push(c); byCard.set(c.id, g) }
L.push(`## By widget (${byCard.size})`, "")
for (const [id, g] of [...byCard.entries()].sort((p, q) => q[1].length - p[1].length)) {
  const cells = [...new Set(g.map((c) => `${c.cell.scenario ? c.cell.scenario + " " : ""}${c.cell.vw}px ${c.cell.template}-${c.cell.mode}/${c.cell.density}/${c.cell.detail}`))]
  const gone = [...new Set(g.flatMap((c) => c.gone))].slice(0, 4), added = [...new Set(g.flatMap((c) => c.added))].slice(0, 4)
  const nf = [...new Set(g.flatMap((c) => c.newF))].slice(0, 3), gf = [...new Set(g.flatMap((c) => c.goneF))].slice(0, 3)
  const hx = g.find((c) => Math.abs(c.h[0] - c.h[1]) > 2)
  L.push(`- **${id}**: ${g.length} cells (${cells.slice(0, 3).join("; ")}${cells.length > 3 ? "…" : ""})${gone.length ? ` | gone: ${gone.join(", ")}` : ""}${added.length ? ` | appears: ${added.join(", ")}` : ""}${nf.length ? ` | NEW defect: ${nf.join(", ")}` : ""}${gf.length ? ` | defect fixed: ${gf.join(", ")}` : ""}${hx ? ` | height ${hx.h[0]}→${hx.h[1]}` : ""}`)
}
const txt = L.join("\n")
if (outIdx > 0) writeFileSync(process.argv[outIdx + 1], txt)
console.log(txt)
