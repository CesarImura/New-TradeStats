// Notificações do aluno (21/11): sino com painel, só o que o aluno ligou, lido persiste, "Also by e-mail" desligado por padrão; Admin: E-mails agrupados.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/notifications-student.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = process.env.BASE ?? "http://localhost:3000"
const res = []; const ok = (n, c, x = "") => res.push((c ? "OK   " : "FAIL ") + n + " " + x)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
const bell = (p) => p.locator("button[aria-label^=Notifications]").first()
for (const w of [1440, 768, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); const errs = []
  p.on("pageerror", (e) => errs.push(e.message.slice(0, 90)))
  await p.goto(BASE + "/c/kairo", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500)
  ok(`${w} sino com 2 novos`, (await bell(p).getAttribute("aria-label")) === "Notifications, 2 new", await bell(p).getAttribute("aria-label"))
  await bell(p).click(); await p.waitForTimeout(500)
  const panel = p.locator("[data-slot=student-notifications-panel]")
  const items = await panel.locator("li a").count(); ok(`${w} painel lista 3 avisos (comunidade desligada)`, items === 3, String(items))
  const fit = await panel.evaluate((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight })
  ok(`${w} painel cabe na tela`, fit)
  await p.keyboard.press("Escape"); await p.waitForTimeout(400); ok(`${w} Esc fecha`, (await panel.count()) === 0)
  await bell(p).click(); await p.waitForTimeout(400)
  await panel.locator("li a").first().click(); await p.waitForURL("**/journal", { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(500)
  ok(`${w} clique abre o journal e lê`, p.url().includes("/journal") && (await bell(p).getAttribute("aria-label")) === "Notifications, 1 new", await bell(p).getAttribute("aria-label"))
  await bell(p).click(); await p.waitForTimeout(400); await p.getByRole("button", { name: "Mark all read" }).click(); await p.waitForTimeout(500)
  ok(`${w} Mark all read zera`, (await bell(p).getAttribute("aria-label")) === "Notifications")
  await p.reload({ waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000)
  ok(`${w} lido persiste`, (await bell(p).getAttribute("aria-label")) === "Notifications")
  await p.goto(BASE + "/c/kairo/profile?tab=notifications", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000)
  const sw = p.getByRole("switch")
  const states = await sw.evaluateAll((a) => a.map((x) => x.getAttribute("aria-checked")))
  ok(`${w} "Also by e-mail" desligado por padrão`, states.length === 5 && states[4] === "false" && states[0] === "true", states.join(","))
  await sw.nth(4).click(); await p.waitForTimeout(500)
  ok(`${w} ligar e-mail: toast com Undo e data de opt-in`, (await p.getByText("E-mail notifications on").count()) >= 1 && (await p.getByText(/On since \d/).count()) === 1)
  await sw.nth(4).click(); await p.waitForTimeout(400)
  ok(`${w} desligar e-mail: volta ao texto de desligado`, (await p.getByText(/Off until you switch it on/).count()) === 1)
  await sw.nth(0).click(); await p.waitForTimeout(300)
  await p.goto(BASE + "/c/kairo", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000); await bell(p).click(); await p.waitForTimeout(400)
  ok(`${w} aviso de feedback some quando desligado`, (await p.locator("[data-slot=student-notifications-panel] li a").count()) === 2)
  ok(`${w} erros js`, errs.length === 0, errs.join("|")); await ctx.close()
}
{ // Admin: aba E-mails agrupada
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
  await p.goto(BASE + "/admin/kairo/settings?tab=email", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500)
  const t = await p.locator("main").innerText()
  ok("E-mails: alcance de cada grupo", t.includes("Reaches every student") && t.includes("Reaches 142 of 194") && t.includes("Reaches 38 of 194"))
  ok("E-mails: três grupos", ["Service e-mails", "Activity e-mails", "Marketing e-mails"].every((x) => t.includes(x)))
  ok("E-mails: recibo e pagamento recusado sempre ligados", (await p.getByText("Always on", { exact: true }).count()) === 2)
  ok("E-mails: 'We miss you' é marketing e começa desligado", (await p.getByRole("switch", { name: "We miss you e-mail" }).getAttribute("aria-checked")) === "false")
  await ctx.close()
}
{ // plataforma nova: estado vazio
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage()
  await p.goto(BASE + "/signup/create", { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3000)
  await p.fill("input[autocomplete=name]", "Rita Tester"); await p.fill("input[type=email]", "rita@example.com")
  await p.getByRole("button", { name: "Continue" }).click(); await p.waitForURL("**/signup/verify"); await p.locator("input").first().click(); await p.keyboard.type("123456")
  await p.waitForURL("**/signup/about", { timeout: 60000 }); await p.getByRole("button", { name: "Skip" }).click(); await p.waitForURL("**/signup/name"); await p.waitForTimeout(2000)
  await p.locator("input[placeholder*='Lio']").fill("Student Bell"); await p.locator("[data-slot=checkbox]").click(); await p.getByRole("button", { name: "Continue" }).click()
  await p.waitForURL("**/getting-started", { timeout: 90000 }); const slug = p.url().split("/admin/")[1].split("/")[0]
  await p.goto(BASE + `/c/${slug}`, { waitUntil: "domcontentloaded" }); await p.waitForTimeout(3500)
  const btn = bell(p)
  if (await btn.count()) { await btn.click(); await p.waitForTimeout(500); ok("plataforma nova: sino vazio", (await p.getByText("You're all caught up").count()) === 1 && (await btn.getAttribute("aria-label")) === "Notifications") } else ok("plataforma nova: sino existe", false, p.url())
  await ctx.close()
}
console.log(res.join("\n")); await b.close()
