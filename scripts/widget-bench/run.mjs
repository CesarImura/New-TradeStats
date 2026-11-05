#!/usr/bin/env node
/*
 * Widget bench: lays out every registered widget (every layout, every width it allows) on the student Home of a running
 * copy of the app and measures each card in the browser: overflow, cut content, text clipped without "…", unexpected
 * scroll, overlap, small text, and a composition signature to compare runs. See README.md.
 *
 *   node scripts/widget-bench/run.mjs --base http://localhost:3100 --layer smoke --out /tmp/bench-smoke
 *   node scripts/widget-bench/run.mjs --base http://localhost:3100 --viewports 1000,1100 --templates atelier --only watchlist,partner-links
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const list = (v, d) => (v ? String(v).split(",").filter(Boolean) : d)

// ---- cells ----------------------------------------------------------------------------------------------------------
const VIEWPORTS_ALL = [320, 390, 768, 1000, 1100, 1440]
const TEMPLATES = ["terminal", "atelier", "pulse"]
const DEFAULT_DENSITY = { terminal: "compact", atelier: "airy", pulse: "comfortable" }
const DENSITIES = ["compact", "comfortable", "airy"]
const MODES = ["dark", "light"]
const DETAILS = ["compact", "standard", "detailed"]
const LAYERS = {
  // each layer says what it leaves out, so nothing is skipped silently (the viewports are the same in every layer: 320 is the narrowest phone)
  smoke: { densities: "default", details: ["standard"], leaves: "non-default densities; Compact and Detailed" },
  density: { densities: DENSITIES, details: ["standard"], leaves: "Compact and Detailed" },
  detail: { densities: "default", details: DETAILS, leaves: "non-default densities" },
  full: { densities: DENSITIES, details: DETAILS, leaves: "nothing" },
}
const layer = LAYERS[args.layer || "smoke"]
if (!layer) throw new Error(`unknown layer ${args.layer}; use ${Object.keys(LAYERS).join(", ")}`)
const viewports = list(args.viewports, VIEWPORTS_ALL).map(Number)
const templates = list(args.templates, TEMPLATES)
const modes = list(args.modes, MODES)
const details = list(args.details, layer.details)
const cells = []
for (const vw of viewports) for (const t of templates) for (const m of modes) {
  const dens = args.densities ? list(args.densities) : layer.densities === "default" ? [DEFAULT_DENSITY[t]] : layer.densities
  for (const d of dens) for (const det of details) cells.push({ vw, template: t, mode: m, density: d, detail: det })
}

// ---- playwright (a devDependency of the project; the browser is downloaded separately, see README)
const base = (args.base || "http://localhost:3100").replace(/\/$/, "")
const slug = args.slug || "northline"
const out = resolve(args.out || join(process.env.TMPDIR || "/tmp", `widget-bench-${Date.now()}`))
mkdirSync(out, { recursive: true })
const concurrency = Number(args.concurrency || 3)
const only = list(args.only, null)
const detectorSrc = readFileSync(join(here, "detect.js"), "utf8")

const browser = await chromium.launch()

// ---- catalog ---------------------------------------------------------------------------------------------------------
const cp = await browser.newPage()
await cp.goto(`${base}/bench/catalog`)
const raw = await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "")
await cp.close()
if (!raw) { console.error("No catalog: build the app with NEXT_PUBLIC_WIDGET_BENCH=1 (see serve-copy.sh)."); process.exit(2) }
const catalog = JSON.parse(raw)
const WIDTHS = [4, 8, 12]
// --shelf-cards N: the Shelf shows N cards of the coach's own (up to 12) with long and short words, instead of the sample courses
const ownCards = (n) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, kicker: `No. ${String(i + 1).padStart(2, "0")}`, title: i % 3 === 0 ? "A long title that needs two lines to fit in a tile" : `Card ${i + 1}`, text: i % 2 ? "A line about this card that may run onto a second line." : "", tags: i % 2 ? "Core, Risk" : "", pct: i % 4 === 0 ? String(10 * (i + 1)) : "", status: i % 4 === 0 ? `${10 * (i + 1)}% complete` : "", button: i % 2 ? "Open" : "Start" }))
const skipped = []
const items = []
for (const w of catalog) {
  if (w.core || w.type === "page-header") { skipped.push(`${w.type} (${w.core ? "page's own tool" : "page title"}: sized by its content, not laid out here)`); continue }
  if (only && !only.includes(w.type)) continue
  for (const v of w.variants) {
    let ws = WIDTHS.filter((x) => x >= v.minW && x <= v.maxW)
    if (!ws.length) ws = [WIDTHS.reduce((a, b) => (Math.abs(b - v.minW) < Math.abs(a - v.minW) ? b : a))]
    for (const width of ws) {
      // A Featured hero advances on its own; "manual" keeps it on its first slide so two runs show the same page.
      const props = w.type === "hero" ? { play: "manual" } : w.type === "shelf" && args["shelf-cards"] ? { source: "own", cards: JSON.stringify(ownCards(Number(args["shelf-cards"]))) } : undefined
      items.push({ id: `${w.type}|${v.value}|${width}`, type: w.type, variant: v.value, w: width, ...(props ? { props } : {}) })
    }
  }
}
console.log(`catalog: ${catalog.length} widgets, ${items.length} cards per cell, ${cells.length} cells (${args.layer || "smoke"}; leaves out: ${args.layer ? layer.leaves : LAYERS.smoke.leaves}) -> ${out}`)

// ---- one cell --------------------------------------------------------------------------------------------------------
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
async function runCell(cell) {
  const ctx = await browser.newContext({ viewport: { width: cell.vw, height: 900 }, ...(args["reduced-motion"] ? { reducedMotion: "reduce" } : {}) })
  const layoutItems = items.map((it, i) => ({ ...it, detail: cell.detail, x: 0, y: i, h: 4 }))
  const payload = { theme: { template: cell.template, mode: cell.mode, density: cell.density }, content: { modules: MODULES, pages: { home: { default: { items: layoutItems, free: false } } } } }
  await ctx.addInitScript(([key, value]) => { try { localStorage.clear(); localStorage.setItem(key, value) } catch {} }, [`proto:pub:${slug}`, JSON.stringify(payload)])
  const page = await ctx.newPage()
  await page.goto(`${base}/c/${slug}`, { waitUntil: "networkidle" })
  await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, items.length, { timeout: 30000 }).catch(() => {})
  // settled: the page height stops changing (fonts, measured heights, charts)
  let last = -1, still = 0
  for (let i = 0; i < 40 && still < 3; i++) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    still = h === last ? still + 1 : 0
    last = h
    await page.waitForTimeout(350)
  }
  await page.addScriptTag({ content: detectorSrc })
  const res = await page.evaluate(() => window.__benchAnalyze())
  const rendered = new Set(res.cards.map((c) => c.id))
  const notRendered = items.filter((i) => !rendered.has(i.id)).map((i) => i.id)
  if (args.shots) {
    const ids = list(args["shot-ids"], null)
    const bad = ids ? res.cards.filter((c) => ids.includes(c.id)) : res.cards.filter((c) => c.findings?.some((f) => f.sev !== "warn")).slice(0, Number(args.shots === "true" ? 20 : args.shots))
    mkdirSync(join(out, "shots"), { recursive: true })
    for (const c of bad) await page.locator(`[data-widget-id="${c.id}"]`).screenshot({ path: join(out, "shots", `${cell.vw}-${cell.template}-${cell.mode}-${cell.density}-${cell.detail}-${c.id.replace(/\|/g, "_")}.png`) }).catch(() => {})
  }
  await ctx.close()
  return { cell, pageOverflow: res.pageOverflow, notRendered, cards: res.cards }
}

const results = []
const queue = [...cells]
let done = 0
const t0 = Date.now()
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const cell = queue.shift()
    try { results.push(await runCell(cell)) } catch (e) { results.push({ cell, error: String(e).slice(0, 200), cards: [] }) }
    process.stdout.write(`\r${++done}/${cells.length} cells, ${Math.round((Date.now() - t0) / 1000)}s `)
  }
}))
await browser.close()
console.log()

// ---- report ----------------------------------------------------------------------------------------------------------
const cellKey = (c) => `${c.vw}|${c.template}|${c.mode}|${c.density}|${c.detail}`
results.sort((a, b) => cellKey(a.cell).localeCompare(cellKey(b.cell), undefined, { numeric: true }))
writeFileSync(join(out, "results.json"), JSON.stringify({ meta: { base, slug, layer: args.layer || "smoke", cells: cells.length, cardsPerCell: items.length, skipped, at: new Date().toISOString() }, results }))

const norm = (s) => String(s).replace(/\d+/g, "#")
const groups = new Map()
const intent = {}
const total = { defect: 0, warn: 0 }
for (const r of results) for (const c of r.cards) {
  for (const [k, n] of Object.entries(c.intentional || {})) intent[k] = (intent[k] || 0) + n
  for (const f of c.findings || []) {
    const warn = f.sev === "warn"
    total[warn ? "warn" : "defect"]++
    const key = `${warn ? "warn" : "DEFECT"} ${f.kind} | ${c.id} | ${norm(f.el || "")}`
    const g = groups.get(key) || { n: 0, cells: new Set(), ex: f }
    g.n++
    g.cells.add(`${r.cell.vw} ${r.cell.template}-${r.cell.mode}/${r.cell.density}/${r.cell.detail}`)
    groups.set(key, g)
  }
}
const lines = []
lines.push(`# Widget bench: ${args.layer || "smoke"} layer`, "", `- Base ${base}, ${results.length}/${cells.length} cells, ${items.length} cards per cell.`, `- Left out by this layer: ${args.layer ? layer.leaves : LAYERS.smoke.leaves}. Not laid out: ${skipped.join("; ") || "none"}.`)
const err = results.filter((r) => r.error)
if (err.length) lines.push(`- **${err.length} cells failed**: ${err.slice(0, 3).map((e) => e.error).join(" | ")}`)
const nr = results.filter((r) => r.notRendered?.length)
if (nr.length) lines.push(`- Not rendered in ${nr.length} cells, e.g. ${nr[0].notRendered.slice(0, 5).join(", ")}`)
const po = results.filter((r) => r.pageOverflow)
lines.push(`- Page-level horizontal overflow in ${po.length} cells${po.length ? ": " + po.slice(0, 5).map((r) => cellKey(r.cell)).join(", ") : ""}.`)
lines.push(`- Defects: **${total.defect}** occurrences in ${[...groups.keys()].filter((k) => k.startsWith("DEFECT")).length} distinct findings. Warnings: ${total.warn}.`)
lines.push(`- Intentional mechanisms recognised (counted, not reported): ${Object.entries(intent).map(([k, n]) => `${k} ${n}`).join(", ") || "none"}.`, "")
for (const sev of ["DEFECT", "warn"]) {
  const rows = [...groups.entries()].filter(([k]) => k.startsWith(sev)).sort((a, b) => b[1].n - a[1].n)
  lines.push(`## ${sev === "DEFECT" ? "Defects" : "Warnings"} (${rows.length})`, "")
  for (const [k, g] of rows.slice(0, sev === "DEFECT" ? 80 : 30)) lines.push(`- ${k.replace(/^(DEFECT|warn) /, "")}: ${g.n}× in ${g.cells.size} cells, e.g. ${[...g.cells].slice(0, 3).join("; ")} ${JSON.stringify(Object.fromEntries(Object.entries(g.ex).filter(([x]) => !["kind", "el", "sev"].includes(x))))}`)
  lines.push("")
}
writeFileSync(join(out, "summary.md"), lines.join("\n"))
console.log(lines.slice(0, 9).join("\n"))
console.log(`\nresults.json and summary.md in ${out}`)
