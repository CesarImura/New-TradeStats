#!/usr/bin/env node
// Before/after pictures of one card across widths: loaded fresh, resized in a window, and taken 4 -> 12 -> 4 columns in the editor.
//   node prints.mjs --base http://localhost:3201 --label antes --out DIR [--type journal-pnl --variant curve]
import { chromium } from "playwright-core"
import { mkdirSync } from "node:fs"
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const { base, label, out } = args
const type = args.type || "journal-pnl", variant = args.variant || "curve", name = args.name || "performance"
mkdirSync(out, { recursive: true })
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const payload = { theme: { template: "terminal", mode: "dark", density: "comfortable" }, content: { modules: MODULES, pages: { home: { default: { items: [{ id: "x", type, variant, w: 4, x: 0, y: 0, h: 4 }], free: false, titleRemoved: true } } } } }
const b = await chromium.launch()
const card = (p) => p.locator('[data-widget-id="x"]').first()
const shot = async (p, file) => { await p.waitForTimeout(1800); await card(p).screenshot({ path: `${out}/${name}-${label}-${file}.png`, animations: "disabled" }); console.log(file, await p.evaluate(() => { const c = document.querySelector('[data-widget-id="x"] [data-slot=widget]'); return `${c.clientWidth}x${c.clientHeight}, ${c.querySelectorAll("[data-dropped]").length} parts hidden` })) }
const ctx = async (w) => { const c = await b.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" }); await c.addInitScript(([k, v]) => { if (!localStorage.getItem("__s")) { localStorage.clear(); localStorage.setItem(k, v); localStorage.setItem("__s", "1") } }, ["proto:pub:northline", JSON.stringify(payload)]); return c }
// fresh loads at 3, 2 and 1 columns
for (const [cols, w] of [["3col", 1440], ["2col", 800], ["1col", 390]]) {
  const c = await ctx(w); const p = await c.newPage(); await p.goto(`${base}/c/northline`, { waitUntil: "networkidle" }); await p.waitForSelector('[data-widget-id="x"]'); await shot(p, `${cols}-nova`); await c.close()
}
// the window made narrower and wider again
{
  const c = await ctx(1440); const p = await c.newPage(); await p.goto(`${base}/c/northline`, { waitUntil: "networkidle" }); await p.waitForSelector('[data-widget-id="x"]'); await p.waitForTimeout(1500)
  for (const [cols, w] of [["2col", 800], ["1col", 390], ["3col", 1440]]) { await p.setViewportSize({ width: w, height: 900 }); await shot(p, `${cols}-redimensionado`) }
  await c.close()
}
// the editor: One column -> Full width -> One column
{
  const c = await ctx(1440); const p = await c.newPage(); await p.goto(`${base}/admin/northline/design?step=pages`, { waitUntil: "networkidle" }); await p.waitForSelector('[data-widget-id="x"]'); await p.waitForTimeout(1200)
  await shot(p, "ciclo-4-12-4-1-nova")
  await card(p).click({ position: { x: 6, y: 6 }, force: true }); await p.waitForTimeout(600)
  const size = p.locator('[role=radiogroup][aria-label="Size"]').last().locator("[role=radio]")
  const n = await size.count()
  await size.nth(n - 1).click({ force: true }); await shot(p, "ciclo-4-12-4-2-largura-total")
  await size.nth(0).click({ force: true }); await shot(p, "ciclo-4-12-4-3-de-volta-a-uma-coluna")
  await c.close()
}
await b.close()
