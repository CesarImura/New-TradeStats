#!/usr/bin/env node
/*
 * The page's own tools (Courses, Calendar, Chart, Community, Journal, Leaderboard, AI chat, Downloads, Partner offers) and their
 * settings (Design → Pages → the tool): every option applied on the student page, compared with the page as it is. Text fields
 * must also show their text. Needs NEXT_PUBLIC_WIDGET_BENCH=1 (the catalog lists the settings).
 *   node scripts/widget-bench/custom/core-probe.mjs --base http://localhost:3200 --template terminal --mode dark --out /tmp/core
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const base = (args.base || "http://localhost:3200").replace(/\/$/, "")
const template = args.template || "terminal", mode = args.mode || "dark", density = args.density || "comfortable", vw = Number(args.vw || 1440)
const out = resolve(args.out || `/tmp/core-${Date.now()}`); mkdirSync(out, { recursive: true })
const sigSrc = readFileSync(join(here, "sig.js"), "utf8")
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const PROBE = "Probe text 123"
const browser = await chromium.launch()
const cp = await browser.newPage(); await cp.goto(`${base}/bench/catalog`)
const catalog = JSON.parse(await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "[]")); await cp.close()
const results = []
async function load(page, props) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, reducedMotion: "reduce" })
  const id = `core-${page}`
  const payload = { theme: { template, mode, density }, content: { modules: MODULES, pages: { [page]: { default: { items: [{ id, type: `page-${page}`, x: 0, y: 0, w: 12, h: 8, ...(props ? { props } : {}) }], free: false, titleRemoved: true } } } } }
  await ctx.addInitScript(([k, v]) => { try { localStorage.clear(); localStorage.setItem(k, v); window.__SIG_WHOLE = true } catch {} }, [`proto:pub:northline`, JSON.stringify(payload)])
  const p = await ctx.newPage()
  await p.goto(`${base}/c/northline/${page}`, { waitUntil: "networkidle" })
  await p.waitForSelector(`[data-widget-id="${id}"]`, { timeout: 30000 }).catch(() => {})
  await p.waitForTimeout(2500)
  await p.addScriptTag({ content: sigSrc })
  const r = await p.evaluate((i) => ({ sig: window.__sig()[i], text: document.querySelector(`[data-widget-id="${i}"]`)?.innerText ?? "", html: document.querySelector(`[data-widget-id="${i}"]`)?.innerHTML ?? "" }), id)
  await ctx.close(); return r
}
const same = (a, b) => a && b && a.html === b.html && a.style === b.style && a.h === b.h
const jobs = []
for (const w of catalog.filter((x) => x.core)) {
  const page = w.core
  jobs.push(async () => {
    await load(page) // warm up: the first visit compiles the page in a dev server
    const b1 = await load(page), b2 = await load(page)
    const stable = same(b1.sig, b2.sig)
    results.push({ page, setting: "-", option: "baseline", stable })
    for (const s of w.settings) {
      const opts = s.type === "toggle" ? [!s.defaultOn] : s.type === "select" ? s.options.slice(1) : [PROBE]
      for (const o of opts) {
        const r = await load(page, { [s.key]: o })
        const changed = !same(b1.sig, r.sig)
        results.push({ page, setting: s.key, label: s.label, type: s.type, option: String(o), stable, effect: changed, textShown: s.type === "text" || s.type === "textarea" ? r.text.includes(PROBE) || r.html.includes(PROBE) : undefined })
      }
    }
  })
}
await Promise.all(Array.from({ length: Number(args.concurrency || 3) }, async () => { while (jobs.length) await jobs.shift()() }))
await browser.close()
writeFileSync(join(out, "core.json"), JSON.stringify(results))
for (const r of results.filter((x) => x.setting !== "-")) console.log(`${r.stable ? " " : "~"} ${r.effect ? "ok     " : "NO EFFECT"} ${r.page} :: ${r.label} = ${r.option}${r.textShown === false ? "  (text not shown)" : ""}`)
