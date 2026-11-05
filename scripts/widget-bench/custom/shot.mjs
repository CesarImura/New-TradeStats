#!/usr/bin/env node
// One card with a patch, before and after, as pictures: node shot.mjs --type faq --variant list --w 4 --patch '{"emphasis":"star"}' --template terminal --mode dark --density comfortable --out /tmp/x
import { chromium } from "playwright-core"
import { mkdirSync } from "node:fs"
import { applyPatch } from "./alterations.mjs"
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const base = args.base || "http://localhost:3200", slug = "northline"
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
mkdirSync(args.out || "/tmp/shot", { recursive: true })
const browser = await chromium.launch()
const it = { id: "x", type: args.type, variant: args.variant, w: Number(args.w || 4), x: 0, y: 0, h: 4, ...(args.type === "hero" ? { props: { play: "manual" } } : {}) }
for (const [name, patch] of [["before", {}], ["after", JSON.parse(args.patch || "{}")]]) {
  const ctx = await browser.newContext({ viewport: { width: Number(args.vw || 1440), height: 900 }, deviceScaleFactor: 2, reducedMotion: "reduce" })
  const payload = { theme: { template: args.template || "terminal", mode: args.mode || "dark", density: args.density || "comfortable" }, content: { modules: MODULES, pages: { home: { default: { items: [applyPatch(it, patch)], free: false } } } } }
  await ctx.addInitScript(([k, v]) => { try { localStorage.clear(); localStorage.setItem(k, v) } catch {} }, [`proto:pub:${slug}`, JSON.stringify(payload)])
  const page = await ctx.newPage()
  await page.goto(`${base}/c/${slug}`, { waitUntil: "networkidle" })
  await page.waitForSelector("[data-widget-id]")
  await page.waitForTimeout(2500)
  await page.locator("[data-widget-id]").first().screenshot({ path: `${args.out || "/tmp/shot"}/${name}.png` })
  await ctx.close()
}
await browser.close()
console.log("ok")
