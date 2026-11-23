// Só as abas da página (as de dentro de um painel, como Revenue/Members do gráfico, somem quando a aba da página muda). Troca de conteúdo das abas (20/11): o painel novo entra (fade + 12 px do lado da aba), o antigo sai em 110 ms, a altura acompanha e volta a auto.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/tab-content-motion.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = process.env.BASE ?? "http://localhost:3000"
const SCREENS = [
  ["sales", "/admin/kairo/sales"], ["community", "/admin/kairo/community"], ["partners", "/admin/kairo/partners"],
  ["ranking", "/admin/kairo/ranking"], ["charts", "/admin/kairo/charts"], ["calendar", "/admin/kairo/calendar"],
]
const out = []
const log = (n, ok, x = "") => out.push(`${ok ? "OK  " : "FAIL"} ${n} ${x}`)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
const state = (p) => p.evaluate(() => {
  const f = document.querySelector("main [data-slot=tab-panel]")
  if (!f) return null
  const panes = [...f.querySelectorAll(":scope > [data-pane]")]
  return { panes: panes.length, op: panes.map((e) => +getComputedStyle(e).opacity), h: f.style.height, text: (panes.at(-1)?.textContent ?? "").length }
})
for (const w of (process.env.WIDTHS ?? "1440,768,390").split(",").map(Number)) {
  for (const reduced of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: reduced ? "reduce" : "no-preference" })
    const p = await ctx.newPage(); const errs = []
    p.on("pageerror", (e) => errs.push(`[pageerror ${p.url().split("/").pop()}] ` + e.message.slice(0, 90))); p.on("console", (m) => m.type() === "error" && errs.push(`[${p.url().split("/").pop()}] ` + m.text().slice(0, 110)))
    for (const [name, path] of SCREENS) {
      await p.goto(BASE + path, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(2800)
      const tabs = await p.evaluate(() => [...document.querySelectorAll("main [data-tab]")].filter((e) => !e.closest("[data-slot=tab-panel]")).map((e) => e.getAttribute("data-tab")))
      if (tabs.length < 2) { log(`${w}${reduced ? "r" : ""} ${name}: abas`, false, `(${tabs.length})`); continue }
      let bad = ""
      for (const t of tabs.slice(1, 4)) {
        await p.locator(`main [data-tab="${t}"]`).first().click({ force: true })
        await p.waitForTimeout(60)
        const mid = await state(p)
        await p.waitForTimeout(900)
        const end = await state(p)
        if (!end || end.panes !== 1 || end.op[0] !== 1 || end.h !== "" && end.h !== "auto" || end.text < 5) bad += ` ${t}:fim ${JSON.stringify(end)}`
        if (!reduced && mid && mid.panes < 2 && mid.op[0] === 1) bad += ` ${t}:sem transição ${JSON.stringify(mid)}`
        if (reduced && mid && mid.panes !== 1) bad += ` ${t}:reduced ${JSON.stringify(mid)}`
      }
      // cliques rápidos: termina assentado no último
      const last = tabs.at(-1)
      for (const t of tabs.slice(0, 3)) await p.locator(`main [data-tab="${t}"]`).first().click({ force: true })
      await p.locator(`main [data-tab="${last}"]`).first().click({ force: true })
      await p.waitForTimeout(900)
      const fin = await state(p)
      if (!fin || fin.panes !== 1 || fin.op[0] !== 1 || fin.h !== "" && fin.h !== "auto") bad += ` rápido:${JSON.stringify(fin)}`
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (ov > 0) bad += ` overflow ${ov}`
      log(`${w}${reduced ? " reduced" : ""} ${name}`, !bad, bad)
    }
    log(`${w}${reduced ? " reduced" : ""} erros de console`, errs.length === 0, errs.slice(0, 3).join("|"))
    await ctx.close()
  }
}
console.log(out.join("\n")); await b.close()
