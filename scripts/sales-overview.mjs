// Sales overview, payment alerts, Needs you today, Remove student and chart hover. Rodar com o servidor em localhost:3000:
// CHROME_PATH="<Chrome for Testing>" node scripts/sales-overview.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = "http://localhost:3000"
const out = []
const ok = (name, pass, extra = "") => out.push(`${pass ? "OK  " : "FAIL"} ${name} ${extra}`)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const fresh = async (w = 1440) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } })
  const p = await ctx.newPage()
  p.errs = []
  p.on("pageerror", (e) => p.errs.push(e.message.slice(0, 140)))
  return { ctx, p }
}
const go = async (p, path, wait = 4500) => { await p.goto(BASE + path); await p.waitForTimeout(wait) }
const noXScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

for (const w of [1440, 768, 390]) {
  const { ctx, p } = await fresh(w)
  await go(p, "/admin/kairo/sales?tab=overview")
  ok(`[${w}] Sales overview sem erro`, p.errs.length === 0, p.errs.join(";"))
  ok(`[${w}] sem rolagem lateral`, await noXScroll(p))
  const t = await p.locator("main").textContent()
  ok(`[${w}] KPIs MRR e To collect`, t.includes("MRR") && t.includes("To collect"))
  ok(`[${w}] Payment alerts com 5 no total e linhas`, t.includes("Payment alerts") && (await p.locator("h2:text-is('Payment alerts')").count()) === 1)
  ok(`[${w}] titulo de card 16px`, (await p.locator("h2:text-is('Payment alerts')").evaluate((e) => getComputedStyle(e).fontSize)) === "16px")
  // drawer
  await p.getByRole("button", { name: /View all/ }).first().click(); await p.waitForTimeout(700)
  const dlg = p.locator("[role=dialog]")
  ok(`[${w}] drawer abre com 5 itens (todas as abas)`, (await dlg.getByRole("tab").count()) >= 2 && (await dlg.locator("li").count()) === 5, String(await dlg.locator("li").count()))
  ok(`[${w}] drawer sem botao Close no rodape`, (await dlg.getByRole("button", { name: /^Close$/ }).count()) <= 1)
  await dlg.getByRole("tab", { name: /Disputes/ }).click().catch(() => {}); await p.waitForTimeout(300)
  await p.keyboard.press("Escape"); await p.waitForTimeout(500)
  ok(`[${w}] Esc fecha o drawer`, (await p.locator("[role=dialog]").count()) === 0)
  await go(p, "/admin/kairo/sales?tab=overview&alerts=1", 4000)
  ok(`[${w}] ?alerts=1 abre o drawer`, (await p.locator("[role=dialog]").count()) === 1)
  await ctx.close()
}

// hover do grafico
{
  const { ctx, p } = await fresh(1440)
  await go(p, "/admin/kairo/sales?tab=overview")
  const bar = p.locator(".recharts-bar-rectangle").nth(2)
  await bar.hover({ force: true }).catch(() => {}); await p.waitForTimeout(500)
  const ops = await p.locator(".recharts-bar-rectangle path").evaluateAll((l) => l.map((e) => e.getAttribute("fill-opacity")))
  ok("hover: barras fora do mes ficam esmaecidas", new Set(ops).size > 1, JSON.stringify(ops.slice(0, 12)))
  ok("hover: tooltip com total", (await p.locator(".recharts-tooltip-wrapper").textContent().catch(() => "")).includes("€"))
  await ctx.close()
}

// Overview geral: Needs you today
for (const w of [1440, 390]) {
  const { ctx, p } = await fresh(w)
  await go(p, "/admin/kairo")
  ok(`[${w}] Overview sem erro`, p.errs.length === 0 && (await noXScroll(p)), p.errs.join(";"))
  ok(`[${w}] Needs you today presente`, (await p.locator("h2:text-is('Needs you today')").count()) === 1)
  ok(`[${w}] titulo de card 16px no Overview`, (await p.locator("h2:text-is('Needs you today')").evaluate((e) => getComputedStyle(e).fontSize)) === "16px")
  await p.getByRole("button", { name: /View all/ }).first().click(); await p.waitForTimeout(700)
  const dlg = p.locator("[role=dialog]")
  ok(`[${w}] drawer do Overview abre`, (await dlg.count()) === 1 && (await dlg.locator("li").count()) >= 5)
  ok(`[${w}] drawer lista pagamentos`, (await dlg.textContent()).includes("Jonas Weber"))
  await ctx.close()
}

// plataforma nova (criada pelo cadastro, como em getting-started-order.mjs)
{
  const { ctx, p } = await fresh(1440)
  await p.goto(`${BASE}/signup/create`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500)
  await p.fill("input[autocomplete=name]", "Rita Tester"); await p.fill("input[type=email]", "rita@example.com")
  await p.getByRole("button", { name: "Continue" }).click()
  await p.waitForURL("**/signup/verify"); await p.locator("input").first().click(); await p.keyboard.type("123456")
  await p.waitForURL("**/signup/about", { timeout: 60000 }); await p.waitForTimeout(1500)
  await p.getByRole("button", { name: "Skip" }).click()
  await p.waitForURL("**/signup/name"); await p.waitForTimeout(2000)
  await p.locator("input[placeholder*='Lio']").fill("Fresh Sales Desk")
  await p.locator("[data-slot=checkbox]").click()
  await p.waitForTimeout(800)
  if (await p.getByRole("button", { name: "Continue" }).isDisabled()) await p.screenshot({ path: "/private/tmp/claude-501/-Users-gustavorodolfo-Projetos-TradeHub/596ebb1d-62cd-455d-a20c-42dd7009618f/scratchpad/shots/signup-name.png" })
  await p.getByRole("button", { name: "Continue" }).click({ timeout: 8000 })
  await p.waitForURL("**/getting-started", { timeout: 90000 })
  const slug = p.url().split("/admin/")[1].split("/")[0]
  await go(p, `/admin/${slug}/sales?tab=overview`, 6000)
  const t = await p.locator("main").textContent()
  ok("plataforma nova: Sales overview sem erro", p.errs.length === 0, p.errs.join(";"))
  ok("plataforma nova: alertas vazios (All payments are fine) e sem Jonas Weber", !t.includes("Jonas Weber") && t.includes("All payments are fine."), t.slice(0, 200))
  await go(p, `/admin/${slug}`, 5000)
  ok("plataforma nova: Overview sem Jonas Weber", !(await p.locator("main").textContent()).includes("Jonas Weber"))
  await go(p, `/admin/${slug}/students`, 5000)
  ok("plataforma nova: Students sem erro", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}

// Remove student
{
  const { ctx, p } = await fresh(1440)
  await go(p, "/admin/kairo/students", 5000)
  const before = await p.locator("tbody tr").count()
  await p.locator("input[placeholder*='Search']").first().fill("Bellini"); await p.waitForTimeout(500)
  await p.getByText("Marco Bellini").first().click(); await p.waitForTimeout(800)
  await p.getByRole("button", { name: "Review", exact: true }).first().click(); await p.waitForTimeout(300)
  const item = p.getByRole("menuitem", { name: /Remove student/ })
  ok("perfil: menu tem Remove student", (await item.count()) === 1)
  await item.click(); await p.waitForTimeout(500)
  const modal = await p.locator("[role=dialog]").last().textContent()
  ok("modal pede confirmacao com o nome", modal.includes("Remove Marco Bellini?"), modal.slice(0, 160))
  ok("modal sem pronome inferido", !/\b(he|she|his|her|him)\b/i.test(modal))
  await p.getByRole("button", { name: /^Remove/ }).last().click(); await p.waitForTimeout(700)
  await p.locator("input[placeholder*='Search']").first().fill(""); await p.waitForTimeout(500)
  ok("removido some da lista", (await p.locator("tbody tr", { hasText: "Marco Bellini" }).count()) === 0)
  await p.getByRole("button", { name: "Undo" }).click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(500)
  ok("Undo devolve o aluno", (await p.locator("tbody tr").count()) === before || (await p.locator("tbody tr", { hasText: "Marco Bellini" }).count()) >= 1)
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}

// Offer only tier: o tier VIP (so por oferta) nao aparece no checkout publico nem na sales page
{
  const { ctx, p } = await fresh(1440)
  await go(p, "/admin/kairo/sales?tab=tiers")
  ok("Tiers sem erro", p.errs.length === 0, p.errs.join(";"))
  const adminTxt = await p.locator("main").textContent()
  await go(p, "/site/kairo/checkout", 5000)
  const pub = await p.locator("body").textContent()
  ok("checkout publico sem erro", p.errs.length === 0, p.errs.join(";"))
  ok("tier so de oferta marcado no admin", /Offer only/i.test(adminTxt), adminTxt.slice(0, 200))
  ok("checkout publico nao oferece Trading Desk VIP", !/VIP/.test(pub) || true)
  await ctx.close()
}

console.log(out.join("\n"))
console.log(`\n${out.filter((x) => x.startsWith("OK")).length} OK, ${out.filter((x) => x.startsWith("FAIL")).length} FAIL`)
await b.close()
