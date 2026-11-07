#!/usr/bin/env node
/*
 * Etapa 16: why does the page look worse after 1440 -> 1000 -> 1440 than after a plain load at 1440? Bench only (nothing under src/).
 * Runs viewport sequences on the bench page (every card in one page), reads the whole page at the end of each step (detector, the product's cut(),
 * Detail shown, parts dropped) and keeps a time line (trace.js) of the cards that changed. See etapa-16 report.
 *
 *   node resize-trace.mjs --base http://localhost:3100 --out DIR --config term --scenario S1 --seqs all --reps 3 --watch id1,id2 --chrome /opt/pw-browsers/chromium
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { pick, cellFor, queryFor, buildPayload } from "./scenarios.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const base = (args.base || "http://localhost:3100").replace(/\/$/, "")
const out = resolve(args.out || "trace-out")
mkdirSync(out, { recursive: true })
const CONFIGS = {
  term: { template: "terminal", mode: "dark", density: "compact" },
  termlight: { template: "terminal", mode: "light", density: "compact" },
  termairy: { template: "terminal", mode: "dark", density: "airy" },
  pulse: { template: "pulse", mode: "dark", density: "comfortable" },
  pulsecompact: { template: "pulse", mode: "dark", density: "compact" },
  atel: { template: "atelier", mode: "dark", density: "airy" },
}
const cfg = CONFIGS[args.config || "term"]
const sc = pick(args.scenario || "S1")[0]
const A = [1440, 1000]
const SEQS = {
  L1440: { vws: [1440] },
  L1000: { vws: [1000] },
  C1_w300: { vws: [1440, 1000, 1440], wait: 300 },
  C1_w1000: { vws: [1440, 1000, 1440], wait: 1000 },
  C1_w2500: { vws: [1440, 1000, 1440], wait: 2500 },
  C1_w6000: { vws: [1440, 1000, 1440], wait: 6000 },
  C2: { vws: [1440, 1000, 1440, 1000], wait: 2500 },
  C5: { vws: [1440, 1000, 1440, 1000, 1440, 1000, 1440, 1000, 1440, 1000, 1440], wait: 2500 },
  C1_w7000: { vws: [1440, 1000, 1440], wait: 7000 },
  C1_reload: { vws: [1440, 1000, 1440], wait: 2500, reload: true },
  // intermediate widths: does it need to cross 960, or is any width change enough?
  W1440_1200_1440: { vws: [1440, 1200, 1440], wait: 2500 },
  W1440_1100_1440: { vws: [1440, 1100, 1440], wait: 2500 },
  W1440_700_1440: { vws: [1440, 700, 1440], wait: 2500 },
  W1440_390_1440: { vws: [1440, 390, 1440], wait: 2500 },
  R3_2_1: { vws: [1440, 1000, 700, 390, 700, 1000, 1440], wait: 2500 },
  R3_1: { vws: [1440, 390, 1440], wait: 2500 },
  R2_3: { vws: [1000, 1440, 1000], wait: 2500 },
  R_edge: { vws: [1440, 960, 959, 960, 1440, 640, 639, 640, 1440], wait: 2500 },
}
const seqNames = (args.seqs || "all") === "all" ? Object.keys(SEQS) : args.seqs.split(",")
const reps = Number(args.reps || 1)
const watch = (args.watch || "").split(",").filter(Boolean)
const detectorSrc = readFileSync(join(here, "detect.js"), "utf8")
const observeSrc = readFileSync(join(here, "probe-observe.js"), "utf8")
const traceSrc = readFileSync(join(here, "trace.js"), "utf8")
const browser = await chromium.launch({ args: ["--no-sandbox"], ...(args.chrome ? { executablePath: args.chrome } : {}) })
const cp = await browser.newPage()
await cp.goto(`${base}/bench/catalog`, { waitUntil: "networkidle" })
const catalog = JSON.parse(await cp.evaluate(() => document.getElementById("bench-catalog").textContent))
await cp.close()
const items = []
for (const w of catalog) {
  if (w.core || w.type === "page-header") continue
  for (const v of w.variants) {
    let ws = [4, 8, 12].filter((x) => x >= v.minW && x <= v.maxW)
    if (!ws.length) ws = [[4, 8, 12].reduce((a, b) => (Math.abs(b - v.minW) < Math.abs(a - v.minW) ? b : a))]
    for (const width of ws) items.push({ id: `${w.type}|${v.value}|${width}`, type: w.type, variant: v.value, w: width, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) })
  }
}
const subset = Number(args.subset || 0)
const allItems = items.slice()
if (subset && subset < items.length) { const stride = items.length / subset; const keep = new Set(Array.from({ length: subset }, (_, i) => Math.floor(i * stride))); const pick2 = items.filter((_, i) => keep.has(i)); items.length = 0; items.push(...pick2) }
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const cell = cellFor({ vw: 1440, ...cfg, detail: "standard" }, sc)
const payload = buildPayload({ cell, items, modules: MODULES, scenario: sc })
const settle = async (page) => {
  let last = -1, still = 0
  for (let i = 0; i < 40 && still < 3; i++) {
    const h = await page.evaluate(() => window.__e0.pageHeight())
    still = h === last ? still + 1 : 0
    last = h
    await page.waitForTimeout(350)
  }
}
const read = async (page) => {
  const rs = await page.evaluate(() => window.__e0.read())
  const m = {}
  for (const r of rs) if (!r.missing) m[r.id] = [r.shown || "", r.drops, Object.keys(r.defects || {}).join("+"), r.cut ? 1 : 0, r.item, r.card]
  return m
}
const counts = (m) => ({ cards: Object.keys(m).length, defect: Object.values(m).filter((x) => x[2]).length, cut: Object.values(m).filter((x) => x[3]).length, reduced: Object.values(m).filter((x) => x[0]).length, dropped: Object.values(m).filter((x) => x[1] > 0).length })

async function run(name, rep) {
  const sq = SEQS[name]
  const ctx = await browser.newContext({ viewport: { width: sq.vws[0], height: 900 } })
  await ctx.addInitScript(([key, value]) => { try { localStorage.clear(); localStorage.setItem(key, value) } catch {} }, [`proto:pub:northline`, JSON.stringify(payload)])
  await ctx.addInitScript({ content: observeSrc })
  await ctx.addInitScript({ content: traceSrc })
  await ctx.addInitScript((w) => { for (const id of w) window.__watch?.add(id); document.addEventListener("DOMContentLoaded", () => w.forEach((id) => window.__watch.add(id))) }, watch)
  const page = await ctx.newPage()
  await page.goto(`${base}/c/northline${queryFor(sc)}`, { waitUntil: "networkidle" })
  await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, items.length, { timeout: 30000 }).catch(() => {})
  await settle(page)
  await page.addScriptTag({ content: detectorSrc })
  await page.evaluate((w) => w.forEach((id) => window.__watch.add(id)), watch)
  const phases = []
  const first = await read(page)
  phases.push({ vw: sq.vws[0], what: "load", ...counts(first), state: first })
  await page.evaluate(() => window.__trTake())
  for (let i = 1; i < sq.vws.length; i++) {
    await page.evaluate((n) => window.__mark(n), `resize->${sq.vws[i]}`)
    await page.setViewportSize({ width: sq.vws[i], height: 900 })
    await page.waitForTimeout(sq.wait)
    const m = await read(page)
    phases.push({ vw: sq.vws[i], what: `after ${sq.wait}ms`, ...counts(m), state: m })
  }
  // a late read: does it keep changing or settle?
  if (sq.vws.length > 1) {
    await page.waitForTimeout(4000)
    const m = await read(page)
    phases.push({ vw: sq.vws[sq.vws.length - 1], what: "late +4s", ...counts(m), state: m })
  }
  let timeline = await page.evaluate(() => window.__trTake())
  const marks = timeline.filter((e) => e.k === "mark")
  const lastMark = marks[marks.length - 1]
  const after = lastMark ? timeline.filter((e) => e.t > lastMark.t) : []
  const adaptEv = after.filter((e) => e.k === "detail" || e.k === "drops" || e.k === "item" || e.k === "card")
  const longs = after.filter((e) => e.k === "long")
  const settleStats = lastMark ? { lastAdaptEventMs: adaptEv.length ? Math.round(Math.max(...adaptEv.map((e) => e.t)) - lastMark.t) : 0, lastDetailEventMs: Math.round(Math.max(0, ...after.filter((e) => e.k === "detail").map((e) => e.t - lastMark.t))), lastItemEventMs: Math.round(Math.max(0, ...after.filter((e) => e.k === "item").map((e) => e.t - lastMark.t))), events: adaptEv.length, detailEventCards: new Set(after.filter((e) => e.k === "detail").map((e) => e.id)).size, detailFlickerCards: (() => { const m = {}; for (const e of after) if (e.k === "detail") m[e.id] = (m[e.id] || 0) + 1; return Object.values(m).filter((n) => n >= 2).length })(), longTasks: longs.length, longTaskMs: longs.reduce((a, e) => a + e.v, 0), longMax: Math.max(0, ...longs.map((e) => e.v)), lastLongEndMs: longs.length ? Math.round(Math.max(...longs.map((e) => e.t + e.v)) - lastMark.t) : 0 } : null
  if (sq.reload) {
    await page.reload({ waitUntil: "networkidle" })
    await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, items.length, { timeout: 30000 }).catch(() => {})
    await settle(page)
    await page.addScriptTag({ content: detectorSrc })
    const m = await read(page)
    phases.push({ vw: sq.vws[sq.vws.length - 1], what: "after reload", ...counts(m), state: m })
  }
  await ctx.close()
  // keep the time line only of the watched cards and of the cards whose state differs between the load and the last phase
  const ref = phases[0].state, end = phases[phases.length - 1 - (sq.reload ? 1 : 0)].state
  const changed = Object.keys(end).filter((id) => ref[id] && (ref[id][0] !== end[id][0] || ref[id][1] !== end[id][1] || ref[id][2] !== end[id][2])).slice(0, 25)
  const keep = new Set([...watch, ...changed, "*"])
  timeline = timeline.filter((e) => keep.has(e.id))
  return { config: args.config || "term", scenario: sc.id, seq: name, rep, cards: items.length, settle: settleStats, phases, timeline, changed }
}

const jobs = seqNames.flatMap((n) => Array.from({ length: reps }, (_, r) => ({ n, r })))
let done = 0
const conc = Number(args.concurrency || 3)
const q = [...jobs]
await Promise.all(Array.from({ length: conc }, async () => {
  while (q.length) {
    const j = q.shift()
    try { const r = await run(j.n, j.r); writeFileSync(join(out, `${args.config || "term"}__${sc.id}__${j.n}__n${subset || 354}__r${j.r}.json`), JSON.stringify(r)) } catch (e) { console.error("\nfail", j, String(e).slice(0, 200)) }
    process.stdout.write(`\r${++done}/${jobs.length} `)
  }
}))
await browser.close()
console.log("\ndone", out)
