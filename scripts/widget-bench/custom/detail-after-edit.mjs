#!/usr/bin/env node
// Does a card adapt to a note added in the editor as it does after a reload?  node detail-after-edit.mjs --base http://localhost:3200 goals:list:4 check-in:mood:4
import { chromium } from "playwright-core"
const argv = process.argv.slice(2), base = argv[argv.indexOf("--base") + 1]?.startsWith("http") ? argv[argv.indexOf("--base") + 1] : "http://localhost:3200"
const cases = argv.filter((a) => a.includes(":") && !a.startsWith("http"))
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const b = await chromium.launch(); let bad = 0
for (const c of cases) {
  const [type, variant, w] = c.split(":")
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  const payload = { theme: { template: "terminal", mode: "dark", density: "comfortable" }, content: { modules: MODULES, pages: { home: { default: { items: [{ id: "x", type, variant, w: Number(w), x: 0, y: 0, h: 4 }], free: false, titleRemoved: true }, } } } }
  await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem("__s")) { localStorage.clear(); localStorage.setItem(k, v); localStorage.setItem("__s", "1") } }, ["proto:pub:northline", JSON.stringify(payload)])
  const p = await ctx.newPage(); await p.goto(`${base}/admin/northline/design?step=pages`, { waitUntil: "networkidle" }); await p.waitForTimeout(1200)
  const st = async (ms = 2500) => { await p.waitForTimeout(ms); return p.evaluate(() => { const c = document.querySelector("[data-widget-id] [data-slot=widget]"); return `${c.dataset.detailShown ?? "as chosen"} | ${c.innerText.replace(/\n+/g, " / ").slice(0, 90)}` }) }
  await p.locator('[data-widget-id="x"]').first().click({ position: { x: 6, y: 6 }, force: true }); await p.waitForTimeout(500)
  await p.getByRole("button", { name: /Add text, button or picture/ }).click()
  await p.locator('textarea[aria-label="Text"]').last().fill("Probe note 123 and a longer line so that it takes room in the card")
  const edited = await st(); await p.reload({ waitUntil: "networkidle" }); const reloaded = await st(1500)
  const ok = edited === reloaded; if (!ok) bad++
  console.log(ok ? "same " : "DIFF ", c, "\n   edited  :", edited, "\n   reloaded:", reloaded); await ctx.close()
}
await b.close(); process.exit(bad ? 1 : 0)
