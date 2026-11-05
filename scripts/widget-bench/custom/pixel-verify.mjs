#!/usr/bin/env node
/*
 * Checks the probe's verdicts on pictures: for the customizations the probe found with no change in the DOM (offered by the
 * inspector) or with a change (not offered), renders the card with and without it, as screenshots, and counts the pixels that differ.
 *   node pixel-verify.mjs <probe dir> --template terminal --mode dark --density comfortable [--which noeff|notoff|both]
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { alterationsFor, itemWidth, applyPatch } from "./alterations.mjs"
const args = Object.fromEntries(process.argv.slice(3).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const dir = process.argv[2]
const base = args.base || "http://localhost:3200"
const template = args.template || "terminal", mode = args.mode || "dark", density = args.density || "comfortable"
const which = args.which || "both"
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const data = JSON.parse(readFileSync(join(dir, "results.json"), "utf8"))
const groups = JSON.parse(readFileSync(join(dir, "groups.json"), "utf8"))
const key = `${template}|${mode}|${density}|1440`
const browser = await chromium.launch()
const cp = await browser.newPage(); await cp.goto(`${base}/bench/catalog`)
const catalog = JSON.parse(await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "[]")); await cp.close()
const spec = {}
for (const w of catalog) { if (w.core) continue; for (const v of w.variants) { const width = itemWidth(w, v); const id = `${w.type}|${v.value}|${width}`; spec[id] = { base: { id, type: w.type, variant: v.value, w: width, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) }, alts: Object.fromEntries(alterationsFor(w, v, width).map((a) => [a.name, { ...a, patch: JSON.parse(JSON.stringify(a.patch).replace("preset:AUTO", "preset:candles")) }])) } } }
// the cases: every (card, customization) whose verdict is to be checked
const cases = []
for (const g of groups) {
  if (g.key !== key || !g.stable || g.id.startsWith("page-header") || g.kind === "emphasis:star") continue
  const noeff = g.offered && !g.effect, notoff = !g.offered && g.effect
  if (!((noeff && which !== "notoff") || (notoff && which !== "noeff"))) continue
  for (const n of g.names) { const a = spec[g.id]?.alts[n]; if (a) cases.push({ id: g.id, name: n, verdict: noeff ? "offered-no-effect" : "not-offered-effect", ref: a.ref }) }
}
console.log(`${cases.length} cases`)
// patch names needed per card: the customization, its reference (or the plain card)
const need = new Map() // patchName -> Set(id)   ("" = plain)
for (const c of cases) { for (const n of [c.name, c.ref ?? ""]) { if (!need.has(n)) need.set(n, new Set()); need.get(n).add(c.id) } }
const shots = {} // `${patchName}||${id}` -> base64
const names = [...need.keys()]
let done = 0
const queue = [...names]
await Promise.all(Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const n = queue.shift(); const ids = [...need.get(n)]
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
    const items = ids.map((id, i) => { const s = spec[id]; const inst = n && s.alts[n] ? applyPatch(s.base, s.alts[n].patch) : s.base; return { ...inst, x: 0, y: i, h: 4 } })
    const payload = { theme: { template, mode, density }, content: { modules: MODULES, pages: { home: { default: { items, free: false, titleRemoved: true } } } } }
    await ctx.addInitScript(([k, v]) => { try { localStorage.clear(); localStorage.setItem(k, v) } catch {} }, ["proto:pub:northline", JSON.stringify(payload)])
    const p = await ctx.newPage(); await p.goto(`${base}/c/northline`, { waitUntil: "networkidle" })
    await p.waitForFunction((c) => document.querySelectorAll("[data-widget-id]").length >= c, ids.length, { timeout: 60000 }).catch(() => {})
    await p.waitForTimeout(3500)
    for (const id of ids) { const loc = p.locator(`[data-widget-id="${id}"]`); try { shots[`${n}||${id}`] = (await loc.screenshot({ animations: "disabled" })).toString("base64") } catch { /* off screen */ } }
    await ctx.close(); process.stdout.write(`\r${++done}/${names.length} `)
  }
}))
console.log()
// pixel compare in a blank page
const cmp = await browser.newPage()
const results = []
for (const c of cases) {
  const A = shots[`${c.ref ?? ""}||${c.id}`], B = shots[`${c.name}||${c.id}`]
  if (!A || !B) { results.push({ ...c, diff: null }); continue }
  const d = await cmp.evaluate(async ([a, b]) => {
    const load = async (s) => { const bm = await createImageBitmap(await (await fetch("data:image/png;base64," + s)).blob()); const cv = new OffscreenCanvas(bm.width, bm.height); const x = cv.getContext("2d"); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height) }
    const [ia, ib] = [await load(a), await load(b)]
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: true, w: [ia.width, ia.height, ib.width, ib.height] }
    let n = 0, max = 0
    for (let i = 0; i < ia.data.length; i += 4) { const dd = Math.max(Math.abs(ia.data[i] - ib.data[i]), Math.abs(ia.data[i + 1] - ib.data[i + 1]), Math.abs(ia.data[i + 2] - ib.data[i + 2])); if (dd > 2) { n++; if (dd > max) max = dd } }
    return { n, max, total: ia.width * ia.height }
  }, [A, B])
  results.push({ ...c, diff: d })
}
mkdirSync(dir, { recursive: true })
writeFileSync(join(dir, `pixels-${template}-${mode}-${density}.json`), JSON.stringify(results))
const summary = {}
for (const r of results) { const vis = r.diff && (r.diff.size || r.diff.n > 0); const k = `${r.verdict} -> ${r.diff == null ? "no picture" : vis ? "PIXELS DIFFER" : "identical"}`; summary[k] = (summary[k] || 0) + 1 }
console.table(summary)
await browser.close()
