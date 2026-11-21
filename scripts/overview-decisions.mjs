// Overview (21/11): KPIs seguem Period e Tier, menu do avatar, rótulos de KPI em 320 px.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/overview-decisions.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = process.env.BASE ?? "http://localhost:3000"
const res = []; const ok = (n, c, x = "") => res.push((c ? "OK   " : "FAIL ") + n + " " + x)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
{
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage(); const errs = []; p.on("pageerror", (e) => errs.push(e.message.slice(0, 90)))
  await p.goto(BASE + "/admin/kairo", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(4000)
  const kpis = () => p.evaluate(() => [...document.querySelectorAll("main a")].filter((a) => /ACTIVE STUDENTS|REVENUE|NEW STUDENTS|RULES FOLLOWED/i.test(a.textContent)).map((a) => a.innerText.replace(/\n+/g, " ")).join(" | "))
  const sub = () => p.evaluate(() => [...document.querySelectorAll("main p")].find((e) => /Kairo FX ·/.test(e.textContent))?.textContent ?? "")
  const k30 = await kpis()
  ok("30 dias = Figma", k30.includes("194 +6.2% vs previous 30 days") && k30.includes("€37,180 +6.2% · €2,180 more") && k30.includes("40 −4") && k30.includes("84% +3 pp · 312"), k30)
  await p.locator("main").getByText("Last 30 days").last().click(); await p.getByRole("option", { name: "Last 7 days" }).click(); await p.waitForTimeout(600)
  const k7 = await kpis(); ok("7 dias muda KPIs e subtítulo", k7.includes("171") && k7.includes("€8,420") && (await sub()).includes("last 7 days"), k7)
  await p.locator("main").getByText("Last 7 days").last().click(); await p.getByRole("option", { name: "Last 90 days" }).click(); await p.waitForTimeout(600)
  const k90 = await kpis(); ok("90 dias muda KPIs", k90.includes("208") && k90.includes("€104,900") && k90.includes("0 pp"), k90)
  await p.locator("main").getByText("Last 90 days").last().click(); await p.getByRole("option", { name: "Last 30 days" }).click()
  await p.locator("main").getByText("All tiers").first().click(); await p.getByRole("option", { name: "Inner Circle" }).click(); await p.waitForTimeout(600)
  const kt = await kpis(); ok("Tier leva a sua fatia", !kt.includes("194") && kt.includes("84%"), kt)
  const t = p.getByRole("button", { name: /^Account/ })
  await t.click(); await p.waitForTimeout(400)
  const items = await p.getByRole("menuitem").allInnerTexts()
  ok("avatar abre menu com 6 itens", items.length === 6 && items.includes("Log out") && items.includes("Notification settings"), items.join("|"))
  await p.keyboard.press("Escape"); await p.waitForTimeout(600); ok("Esc fecha e devolve o foco", (await p.getByRole("menu").count()) === 0 && (await p.evaluate(() => document.activeElement?.getAttribute("aria-label")))?.startsWith("Account"))
  await t.click(); await p.waitForTimeout(400); await p.getByRole("menuitem", { name: "Team and roles" }).click(); await p.waitForTimeout(1800); ok("item navega", p.url().includes("settings?tab=team"), p.url())
  ok("erros js", errs.length === 0, errs.join("|"))
}
for (const w of [320, 390, 1440]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage()
  await p.goto(BASE + "/admin/kairo", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500)
  const cut = await p.evaluate(() => [...document.querySelectorAll("main a span.uppercase")].filter((e) => e.scrollWidth > e.clientWidth + 1).length)
  ok(`${w} rótulos de KPI sem corte`, cut === 0, String(cut))
  await p.getByRole("button", { name: /^Account/ }).click(); await p.waitForTimeout(500)
  ok(`${w} menu do avatar cabe`, await p.evaluate(() => { const r = document.querySelector("[role=menu]").getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }))
}
console.log(res.join("\n")); await b.close()
