#!/usr/bin/env node
/*
 * Finds the rows a widget layout needs at each card width: for every width and density it forces the card to 2, 2.5, 3 … 6 rows
 * and keeps the smallest height with no defect that still shows the content the layout shows with room to spare (analysed by an-rows.mjs, which needs `sig`). Used to set `narrow.cardBelow` / `contentBelow` from data, not by eye.
 * It needs a copy of the app whose `estimate` (widgets/page-renderer.tsx) takes a card's rows from the end of its id ("…@2.5"), made
 * with serve-copy.sh and the one-line PRE_BUILD patch given in the README ("Finding the rows a layout needs"); it is a measuring tool for
 * that copy only. Each item here has the id "<type>|<variant>|<w>|<detail>@<rows>", one per candidate height, so one page holds them all.
 *
 *   node scripts/widget-bench/find-rows.mjs --base http://localhost:3107 --ids "next-live|split|4,check-in|mood|4" --out /tmp/rows.json
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const base = (args.base || "http://localhost:3107").replace(/\/$/, "")
const ids = (args.ids || "").split(",").filter(Boolean)
const details = ["compact", "standard", "detailed"]
const viewports = (args.viewports || "960,1000,1040,1080,1120,1160,1200,1240,1280,1320,1360,1400,1440,1500").split(",").map(Number)
const templates = (args.templates || "terminal,atelier,pulse").split(",")
const densities = ["compact", "comfortable", "airy"]
const rowsList = [2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6]
const detector = readFileSync(join(here, "detect.js"), "utf8")
const browser = await chromium.launch()
// One page holds every layout at every candidate height (ids end in "@rows"), so a width and a theme cost one load.
const items = ids.flatMap((id) => details.flatMap((d) => rowsList.map((r) => { const [type, variant, w] = id.split("|"); return { id: `${id}|${d}@${r}`, type, variant, w: Number(w), detail: d } }))).map((it, i) => ({ ...it, x: 0, y: i, h: 4 }))
const jobs = []
for (const vw of viewports) for (const t of templates) for (const d of densities) jobs.push({ vw, t, d })
const out = []
let done = 0
await Promise.all(Array.from({ length: Number(args.concurrency || 3) }, async () => {
  while (jobs.length) {
    const j = jobs.shift()
    const ctx = await browser.newContext({ viewport: { width: j.vw, height: 900 } })
    await ctx.addInitScript(([k, v]) => { localStorage.setItem(k, v) }, ["proto:pub:northline", JSON.stringify({ theme: { template: j.t, mode: "dark", density: j.d }, content: { modules: { courses: true, calendar: true, journal: true, community: true, ranking: true, ai: true, downloads: true, partners: true, charts: true }, pages: { home: { default: { items, free: false } } } } })])
    const page = await ctx.newPage()
    await page.goto(`${base}/c/northline`, { waitUntil: "networkidle" })
    await page.waitForFunction((n) => document.querySelectorAll("[data-widget-id]").length >= n, items.length, { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(1600)
    await page.addScriptTag({ content: detector })
    const res = await page.evaluate(() => window.__benchAnalyze())
    for (const c of res.cards) out.push({ vw: j.vw, template: j.t, density: j.d, rows: Number(c.id.split("@")[1]), id: c.id.split("@")[0], w: c.w, h: c.h, drops: c.drops, sig: c.sig, bad: (c.findings || []).filter((f) => f.sev !== "warn").map((f) => f.kind + ":" + (f.el || "")) })
    await ctx.close()
    if (++done % 50 === 0) process.stdout.write(`${done}/${done + jobs.length} `)
  }
}))
await browser.close()
writeFileSync(args.out || "rows.json", JSON.stringify(out))
console.log("\nwritten", args.out || "rows.json", out.length)
