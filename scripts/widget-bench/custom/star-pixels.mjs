#!/usr/bin/env node
// Stand out → Star, one card at a time (only one Star per page), as pictures: how many pixels change.
//   node star-pixels.mjs --template terminal --mode dark --density comfortable --out /tmp/star-px
import { chromium } from "playwright-core"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { itemWidth } from "./alterations.mjs"
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1]]] : a), []))
const base = args.base || "http://localhost:3200"
const template = args.template || "terminal", mode = args.mode || "dark", density = args.density || "comfortable"
const out = args.out || "/tmp/star-px"; mkdirSync(out, { recursive: true })
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const browser = await chromium.launch()
const cp = await browser.newPage(); await cp.goto(`${base}/bench/catalog`)
const catalog = JSON.parse(await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "[]")); await cp.close()
const todo = []
for (const w of catalog) { if (w.core || w.type === "page-header") continue; for (const v of w.variants) todo.push({ w, v, width: itemWidth(w, v) }) }
const shoot = async (it, emphasis) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  const payload = { theme: { template, mode, density }, content: { modules: MODULES, pages: { home: { default: { items: [{ ...it, ...(emphasis ? { emphasis } : {}), x: 0, y: 0, h: 4 }], free: false, titleRemoved: true } } } } }
  await ctx.addInitScript(([k, v]) => { try { localStorage.clear(); localStorage.setItem(k, v) } catch {} }, ["proto:pub:northline", JSON.stringify(payload)])
  const p = await ctx.newPage(); await p.goto(`${base}/c/northline`, { waitUntil: "networkidle" }); await p.waitForSelector("[data-widget-id]"); await p.waitForTimeout(2200)
  const b = (await p.locator("[data-widget-id]").first().screenshot({ animations: "disabled" })).toString("base64")
  await ctx.close(); return b
}
const cmp = await browser.newPage()
const diff = (a, b) => cmp.evaluate(async ([a, b]) => {
  const load = async (s) => { const bm = await createImageBitmap(await (await fetch("data:image/png;base64," + s)).blob()); const cv = new OffscreenCanvas(bm.width, bm.height); const x = cv.getContext("2d"); x.drawImage(bm, 0, 0); return x.getImageData(0, 0, bm.width, bm.height) }
  const [ia, ib] = [await load(a), await load(b)]
  if (ia.width !== ib.width || ia.height !== ib.height) return { size: true }
  let n = 0; for (let i = 0; i < ia.data.length; i += 4) if (Math.max(Math.abs(ia.data[i] - ib.data[i]), Math.abs(ia.data[i + 1] - ib.data[i + 1]), Math.abs(ia.data[i + 2] - ib.data[i + 2])) > 2) n++
  return { n, total: ia.width * ia.height }
}, [a, b])
const res = []; const queue = [...todo]; let done = 0
await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) { const { w, v, width } = queue.shift(); const it = { id: `${w.type}|${v.value}|${width}`, type: w.type, variant: v.value, w: width, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) }
  try { const a = await shoot(it), a2 = await shoot(it), s = await shoot(it, "star"); const noise = await diff(a, a2); const d = await diff(a, s); res.push({ id: it.id, noise: noise.n ?? "size", star: d.size ? "size" : d.n }) } catch (e) { res.push({ id: it.id, error: String(e).slice(0, 80) }) }
  process.stdout.write(`\r${++done}/${todo.length} `) } }))
await browser.close(); console.log()
writeFileSync(join(out, `star-${template}-${mode}-${density}.json`), JSON.stringify(res))
const same = res.filter((r) => r.star === 0 && r.noise === 0)
console.log(`${template}/${mode}: Star changes nothing visible on ${same.length} of ${res.length} cards:`, same.map((r) => r.id).join(" "))
console.log("unstable (two plain renders differ):", res.filter((r) => r.noise).map((r) => r.id).join(" "))
