#!/usr/bin/env node
/*
 * Entrega 0 (E-1): how much height does each card need? Bench only: nothing under src/ is read or changed, and the product
 * gets no sensor. Everything is done from outside, in the browser:
 *
 *  - passive: the page is loaded and settled; probe-observe.js (injected) counts, per card, height changes and mutations
 *    of the two attributes the adaptation sets (data-detail-shown, data-dropped); the detector (detect.js) classifies
 *    what is cut and what is intentional.
 *  - probe (only where the cell height is imposed, i.e. 3 columns): the cell of every card is raised by k px (inline style,
 *    this page only) in half-row steps, and at each step the same things are read again. From the series:
 *       needClip   least k with nothing mandatory cut (detector defects), whatever Detail is shown
 *       needDetail least k with nothing cut AND the Detail that was asked for shown   (policy P1 of Etapa 12)
 *       needDrop   least k with that AND no part hidden by Drop                        (policy P2)
 *    each "least k that holds from there on": a card that meets it and later does not is marked non-monotone. A card that
 *    never meets it up to the last step is `unresolved` (by height, within the steps tried).
 *  - finally the original heights are put back and the state is compared with the start (does the adaptation come back?).
 *
 *   node entrega0.mjs --base http://localhost:3100 --out DIR --plan A|A2|B|C|D|all [--concurrency 3]
 *
 * The plan is fixed here so a run can be repeated; see PLANS. No result of this script changes a baseline or a gate.
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { pick, cellFor, cellKey, queryFor, buildPayload } from "./scenarios.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const base = (args.base || "http://localhost:3100").replace(/\/$/, "")
const slug = args.slug || "northline"
const out = resolve(args.out || "entrega0-out")
mkdirSync(join(out, "cells"), { recursive: true })
const concurrency = Number(args.concurrency || 3)
const detectorSrc = readFileSync(join(here, "detect.js"), "utf8")
const observeSrc = readFileSync(join(here, "probe-observe.js"), "utf8")

const TEMPLATES = ["terminal", "atelier", "pulse"]
const MODES = ["dark", "light"]
const DENSITIES = ["compact", "comfortable", "airy"]
const GAP = { compact: 16, comfortable: 24, airy: 32 } // lib/theme GAP, read from page-renderer.tsx (row unit = 56 + gap)
const HALF = [0, 1, 2, 3, 4, 6, 8] // steps in half rows
const HALF_SHORT = [0, 1, 2, 4, 8]

// ---- plan ------------------------------------------------------------------------------------------------------------
const T0 = { template: "terminal", mode: "dark", density: "compact", detail: "standard" }
const PLANS = {
  // A: every scenario, Terminal / dark / compact, 3 columns, full probe
  A: () => pick("all").map((sc) => ({ ...cellFor({ vw: 1440, ...T0 }, sc), steps: HALF, scenarioObj: sc })),
  // A2: Detail axis for the default and the short note
  A2: () => ["S0", "S1"].flatMap((id) => ["compact", "detailed"].map((detail) => { const sc = pick(id)[0]; return { ...cellFor({ vw: 1440, ...T0, detail }, sc), steps: HALF, scenarioObj: sc } })),
  // B: template x mode x density for S0, S1, S5 (Terminal/dark/compact is in A), shorter probe
  B: () => ["S0", "S1", "S5"].flatMap((id) => { const sc = pick(id)[0]; return TEMPLATES.flatMap((t) => MODES.flatMap((m) => DENSITIES.map((d) => ({ ...cellFor({ vw: 1440, template: t, mode: m, density: d, detail: "standard" }, sc), steps: HALF_SHORT, scenarioObj: sc })))) }).filter((c) => !(c.template === "terminal" && c.mode === "dark" && c.density === "compact")),
  // C: 2 and 1 columns (height is the content's own): passive, every scenario in Terminal/dark/compact and S0, S1 in the other templates
  C: () => [1000, 390].flatMap((vw) => [...pick("all").map((sc) => ({ ...cellFor({ vw, ...T0 }, sc), steps: null, scenarioObj: sc })), ...["atelier", "pulse"].flatMap((t) => ["S0", "S1"].map((id) => { const sc = pick(id)[0]; return { ...cellFor({ vw, template: t, mode: "dark", density: t === "atelier" ? "airy" : "comfortable", detail: "standard" }, sc), steps: null, scenarioObj: sc } }))]),
  // D: width changes on one page (breakpoint crossings), passive counts per phase
  D: () => { const sc = pick("S1")[0]; return [{ ...cellFor({ vw: 1440, ...T0 }, sc), steps: null, dynamic: true, scenarioObj: sc }] },
}
const planNames = (args.plan || "all") === "all" ? Object.keys(PLANS) : String(args.plan).split(",")
let cells = planNames.flatMap((n) => PLANS[n]().map((c) => ({ ...c, plan: n })))
const seen = new Set()
cells = cells.filter((c) => { const k = `${c.plan}|${cellKey(c)}|${c.steps ? "p" : "o"}|${c.dynamic ? "d" : ""}`; if (seen.has(k)) return false; seen.add(k); return true })
if (args.limit) cells = cells.slice(0, Number(args.limit))
if (args["dry-run"]) { console.log(`${cells.length} cells`); for (const c of cells) console.log(c.plan, cellKey(c), c.steps ? `probe ${c.steps.length}` : "passive"); process.exit(0) }

const browser = await chromium.launch({ args: ["--no-sandbox"], ...(args.chrome ? { executablePath: args.chrome } : {}) })
const cp = await browser.newPage()
await cp.goto(`${base}/bench/catalog`, { waitUntil: "networkidle" })
const raw = await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "")
await cp.close()
if (!raw) { console.error("No catalog: the app must be built with NEXT_PUBLIC_WIDGET_BENCH=1"); process.exit(2) }
const catalog = JSON.parse(raw)
const items = []
for (const w of catalog) {
  if (w.core || w.type === "page-header") continue
  for (const v of w.variants) {
    let ws = [4, 8, 12].filter((x) => x >= v.minW && x <= v.maxW)
    if (!ws.length) ws = [[4, 8, 12].reduce((a, b) => (Math.abs(b - v.minW) < Math.abs(a - v.minW) ? b : a))]
    for (const width of ws) items.push({ id: `${w.type}|${v.value}|${width}`, type: w.type, variant: v.value, w: width, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) })
  }
}
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
console.log(`catalog ${catalog.length} widgets, ${items.length} cards per cell, ${cells.length} cells (plans ${planNames.join(",")}) -> ${out}`)

// ---- one cell --------------------------------------------------------------------------------------------------------
const WAIT = 1800
const SAMPLE = 700
const settle = async (page) => {
  let last = -1, still = 0
  for (let i = 0; i < 40 && still < 3; i++) {
    const h = await page.evaluate(() => window.__e0.pageHeight())
    still = h === last ? still + 1 : 0
    last = h
    await page.waitForTimeout(350)
  }
}
const satisfied = {
  clip: (s) => Object.keys(s.defects).length === 0,
  detail: (s) => Object.keys(s.defects).length === 0 && !s.shown,
  drop: (s) => Object.keys(s.defects).length === 0 && !s.shown && s.drops === 0,
}
/** Least step index from which `ok` holds to the end of the series (null: never; `broken`: it held earlier and stopped holding). */
function need(series, ok) {
  const flags = series.map(ok)
  let i = flags.length
  while (i > 0 && flags[i - 1]) i--
  const first = flags.indexOf(true)
  return { at: i === flags.length ? null : i, broken: first !== -1 && (i === flags.length || first < i) }
}

async function runCell(cell) {
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 } })
  const payload = buildPayload({ cell, items, modules: MODULES, scenario: cell.scenarioObj })
  const requested = Object.fromEntries(payload.content.pages.home.default.items.map((it) => [it.id, it.detail]))
  await ctx.addInitScript(([key, value]) => { try { localStorage.clear(); localStorage.setItem(key, value) } catch {} }, [`proto:pub:${slug}`, JSON.stringify(payload)])
  await ctx.addInitScript({ content: observeSrc })
  const page = await ctx.newPage()
  await page.goto(`${base}/c/${slug}${queryFor(cell.scenarioObj)}`, { waitUntil: "networkidle" })
  await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, items.length, { timeout: 30000 }).catch(() => {})
  await settle(page)
  await page.addScriptTag({ content: detectorSrc })
  const loadCounts = await page.evaluate(() => window.__e0.mark())
  const cols = await page.evaluate(() => window.__e0.cols())
  const rec = {}
  const get = (id) => (rec[id] ||= { id, requested: requested[id] ?? null })
  // state before any probe
  for (const r of await page.evaluate(() => window.__e0.read())) { if (r.missing) { get(r.id).missing = true; continue } Object.assign(get(r.id), { start: { item: r.item, est: r.est, card: r.card, shown: r.shown, drops: r.drops, defects: r.defects, intent: r.intent, free: r.free, cut: r.cut } }) }
  for (const [id, c] of Object.entries(loadCounts)) if (rec[id]) rec[id].load = c
  const meta = { cell: { plan: cell.plan, ...Object.fromEntries(Object.entries(cell).filter(([k]) => !["scenarioObj", "steps"].includes(k))) }, cols, items: items.length, halfRowPx: (56 + GAP[cell.density]) / 2, steps: cell.steps }

  if (cell.steps && cols === 3) {
    const half = (56 + GAP[cell.density]) / 2
    for (const hs of cell.steps) {
      const k = hs * half
      await page.evaluate(() => window.__e0.mark())
      await page.evaluate((k) => window.__e0.grow(k), k)
      await page.waitForTimeout(SAMPLE)
      const early = new Map((await page.evaluate(() => window.__e0.light())).map((x) => [x[0], x]))
      await page.waitForTimeout(WAIT - SAMPLE)
      const reads = await page.evaluate(() => window.__e0.read())
      const counts = await page.evaluate(() => window.__e0.mark())
      for (const r of reads) {
        if (r.missing) continue
        const e = early.get(r.id)
        const s = { hs, k, item: r.item, card: r.card, shown: r.shown, drops: r.drops, defects: r.defects, intent: r.intent, free: r.free, cut: r.cut, changed: e ? (e[2] || "") !== (r.shown || "") || e[3] !== r.drops : false, mut: counts[r.id] || { hc: 0, df: 0, dm: 0 } }
        ;(get(r.id).series ||= []).push(s)
      }
    }
    // put the heights back and read again: does the adaptation come back to where it started?
    await page.evaluate(() => window.__e0.mark())
    await page.evaluate(() => window.__e0.grow(null))
    await page.waitForTimeout(WAIT + 400)
    const back = await page.evaluate(() => window.__e0.read())
    const bc = await page.evaluate(() => window.__e0.mark())
    for (const r of back) if (!r.missing && rec[r.id]?.start) rec[r.id].back = { shown: r.shown, drops: r.drops, defects: r.defects, cut: r.cut, same: (r.shown || "") === (rec[r.id].start.shown || "") && r.drops === rec[r.id].start.drops, mut: bc[r.id] || { hc: 0, df: 0, dm: 0 } }
    for (const c of Object.values(rec)) {
      if (!c.series) continue
      const sr = c.series
      const grew = sr.map((s) => Math.round(s.item - sr[0].item))
      c.grewAsAsked = sr.every((s) => Math.abs(s.item - sr[0].item - s.k) <= 2)
      const nc = need(sr, satisfied.clip), nd = need(sr, satisfied.detail), np = need(sr, satisfied.drop)
      c.need = {
        clipHs: nc.at, clipPx: nc.at === null ? null : sr[nc.at].k,
        detailHs: nd.at, detailPx: nd.at === null ? null : sr[nd.at].k,
        dropHs: np.at, dropPx: np.at === null ? null : sr[np.at].k,
        nonMonotone: nc.broken || nd.broken || np.broken,
        flips: sr.reduce((a, s) => a + (s.changed ? 1 : 0), 0),
        tried: sr.length,
        lastK: sr[sr.length - 1].k,
      }
      c.attempts = sr.length
      c.grew = grew
    }
  }
  if (cell.dynamic) {
    const seq = [1000, 1440, 800, 1440, 390, 1440]
    const phases = []
    const stateOf = async () => (await page.evaluate(() => window.__e0.read())).filter((r) => !r.missing).map((r) => [r.id, r.shown || "", r.drops, Object.keys(r.defects || {}).join("+"), r.cut ? 1 : 0])
    meta.dynamicStart = await stateOf()
    for (const vw of seq) {
      await page.evaluate(() => window.__e0.mark())
      await page.setViewportSize({ width: vw, height: 900 })
      await page.waitForTimeout(2200)
      const reads = await page.evaluate(() => window.__benchAnalyze())
      const counts = await page.evaluate(() => window.__e0.mark())
      const cols2 = await page.evaluate(() => window.__e0.cols())
      let hc = 0, df = 0, dm = 0, maxHc = 0
      for (const c of Object.values(counts)) { hc += c.hc; df += c.df; dm += c.dm; maxHc = Math.max(maxHc, c.hc) }
      const defects = reads.cards.reduce((a, c) => a + (c.findings || []).filter((f) => f.kind !== "small-text" && f.sev !== "warn").length, 0)
      const overlaps = reads.cards.reduce((a, c) => a + (c.findings || []).filter((f) => f.kind === "overlap").length, 0)
      const state = await stateOf()
      phases.push({ vw, cols: cols2, state, heightChanges: hc, maxHeightChangesOneCard: maxHc, detailMutations: df, dropMutations: dm, defects, overlaps })
    }
    meta.dynamic = phases
  }
  await ctx.close()
  return { meta, cards: Object.values(rec) }
}

const queue = [...cells]
let done = 0
const t0 = Date.now()
const index = []
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const cell = queue.shift()
    const key = `${cell.plan}__${cellKey(cell).replace(/\|/g, "_")}${cell.dynamic ? "__dyn" : ""}`
    try {
      const res = await runCell(cell)
      writeFileSync(join(out, "cells", `${key}.json`), JSON.stringify(res))
      index.push({ key, cols: res.meta.cols, ok: true })
    } catch (e) {
      index.push({ key, ok: false, error: String(e).slice(0, 300) })
    }
    process.stdout.write(`\r${++done}/${cells.length} cells, ${Math.round((Date.now() - t0) / 1000)}s `)
  }
}))
await browser.close()
console.log()
writeFileSync(join(out, `index-${planNames.join("+")}.json`), JSON.stringify({ at: new Date().toISOString(), base, plans: planNames, cells: index }))
console.log(`failed: ${index.filter((i) => !i.ok).length}; ${out}`)
