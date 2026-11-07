#!/usr/bin/env node
/*
 * Customization probe: for every layout of every widget, applies each customization the Design editor offers (alterations.mjs)
 * to the widget on the student Home of a running copy (needs NEXT_PUBLIC_WIDGET_BENCH=1), and compares the card with the same
 * card unchanged. Writes results.json: per cell (template/mode/density/viewport), per card, per customization: did the card change.
 *
 *   node scripts/widget-bench/custom/probe.mjs --base http://localhost:3200 --templates terminal --modes dark --densities comfortable --out /tmp/probe
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { alterationsFor, itemWidth, applyPatch } from "./alterations.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const list = (v, d) => (v ? String(v).split(",").filter(Boolean) : d)
const base = (args.base || "http://localhost:3200").replace(/\/$/, "")
const slug = args.slug || "northline"
const vw = Number(args.vw || 1440)
const templates = list(args.templates, ["terminal"]), modes = list(args.modes, ["dark"]), densities = list(args.densities, ["comfortable"])
const only = list(args.only, null)
const out = resolve(args.out || join(process.env.TMPDIR || "/tmp", `probe-${Date.now()}`))
mkdirSync(out, { recursive: true })
const concurrency = Number(args.concurrency || 3)
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }

const sigSrc = readFileSync(join(here, "sig.js"), "utf8")

const browser = await chromium.launch()
const cp = await browser.newPage()
await cp.goto(`${base}/bench/catalog`)
const raw = await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "")
await cp.close()
if (!raw) { console.error("No catalog: start the app with NEXT_PUBLIC_WIDGET_BENCH=1"); process.exit(2) }
const catalog = JSON.parse(raw)

const items = []
for (const w of catalog) {
  if (w.core || (only && !only.includes(w.type))) continue
  for (const v of w.variants) {
    const width = itemWidth(w, v)
    const base0 = { id: `${w.type}|${v.value}|${width}`, type: w.type, variant: v.value, w: width, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) }
    const alts = alterationsFor(w, v, width).map((a) => ({ ...a, patch: JSON.parse(JSON.stringify(a.patch).replace("preset:AUTO", "preset:candles")) }))
    items.push({ base: base0, alts, widget: w.type, variant: v.value })
  }
}
const passes = Math.max(...items.map((i) => i.alts.length))
console.log(`${items.length} cards, up to ${passes} customizations each -> ${passes + 2} page loads per cell; ${templates.length * modes.length * densities.length} cells`)

async function load(cell, layoutItems) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, reducedMotion: "reduce" })
  const payload = { theme: { template: cell.template, mode: cell.mode, density: cell.density }, content: { modules: MODULES, pages: { home: { default: { items: layoutItems, free: false } } } } }
  await ctx.addInitScript(([key, value]) => { try { localStorage.clear(); localStorage.setItem(key, value) } catch {} }, [`proto:pub:${slug}`, JSON.stringify(payload)])
  const page = await ctx.newPage()
  await page.goto(`${base}/c/${slug}`, { waitUntil: "networkidle" })
  await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, layoutItems.length, { timeout: 60000 }).catch(() => {})
  let last = -1, still = 0
  for (let i = 0; i < 40 && still < 3; i++) {
    const h = await page.evaluate(() => document.documentElement.scrollHeight)
    still = h === last ? still + 1 : 0
    last = h
    await page.waitForTimeout(350)
  }
  await page.waitForTimeout(500)
  await page.addScriptTag({ content: sigSrc })
  const sig = await page.evaluate(() => window.__sig())
  await ctx.close()
  return sig
}

const jobs = []
for (const template of templates) for (const mode of modes) for (const density of densities) {
  const cell = { template, mode, density }
  // pass -1 and -2: the plain widgets, twice (what changes between two identical loads is not a customization)
  for (const p of [-1, -2]) jobs.push({ cell, pass: p })
  for (let p = 0; p < (args["solo-only"] ? 0 : passes); p++) jobs.push({ cell, pass: p })
  // one card at a time: Star (only one Star per page)
  items.forEach((it, idx) => it.alts.forEach((a, ai) => { if (a.solo) jobs.push({ cell, solo: { idx, ai } }) }))
}
const results = {}
let done = 0
const t0 = Date.now()
const queue = [...jobs]
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (queue.length) {
    const { cell, pass, solo } = queue.shift()
    const key = `${cell.template}|${cell.mode}|${cell.density}|${vw}`
    const layoutItems = solo ? items.map((it, i) => ({ ...(i === solo.idx ? applyPatch(it.base, it.alts[solo.ai].patch) : it.base), x: 0, y: i, h: 4 })) : items.map((it, i) => {
      const a = pass >= 0 && !it.alts[pass]?.solo ? it.alts[pass] : undefined
      const inst = a ? applyPatch(it.base, a.patch) : it.base
      return { ...inst, x: 0, y: i, h: 4 }
    })
    try {
      const sig = await load(cell, layoutItems)
      if (solo) { const it = items[solo.idx]; const r = (results[key] ??= { cell: { ...cell, vw }, passes: {} }); ((r.solo ??= {})[it.base.id] ??= {})[it.alts[solo.ai].name] = sig[it.base.id]; process.stdout.write(`\r${++done}/${jobs.length} loads, ${Math.round((Date.now() - t0) / 1000)}s `); continue }
      ;(results[key] ??= { cell: { ...cell, vw }, passes: {} }).passes[pass] = { sig, alts: items.map((it) => it.alts[pass]?.name ?? null) }
    } catch (e) { (results[key] ??= { cell: { ...cell, vw }, passes: {} }).passes[pass] = { error: String(e).slice(0, 200) } }
    process.stdout.write(`\r${++done}/${jobs.length} loads, ${Math.round((Date.now() - t0) / 1000)}s `)
  }
}))
await browser.close()
console.log()
writeFileSync(join(out, "results.json"), JSON.stringify({ items: items.map((i) => ({ id: i.base.id, widget: i.widget, variant: i.variant, alts: i.alts.map(({ name, offered, ref, internal }) => ({ name, offered, ref, internal })) })), results }))
console.log(`wrote ${join(out, "results.json")}`)
