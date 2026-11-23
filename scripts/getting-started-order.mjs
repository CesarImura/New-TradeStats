// Getting started em ordem (19/11): só o primeiro passo não concluído e não pulado fica ativo; os de baixo ficam bloqueados.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/getting-started-order.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const BASE = "http://localhost:3000"
let SLUG = ""
const widths = [1440, 768, 390]
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })

// Estado de cada passo lido da tela: marcador, botão e se está desabilitado.
const read = async (page) => {
  await page.waitForFunction(() => document.querySelectorAll("ol[aria-label='Setup steps'] > li").length === 6, null, { timeout: 60000 })
  return page.evaluate(() =>
    [...document.querySelectorAll("ol[aria-label='Setup steps'] > li")].map((li) => {
      const h = li.querySelector("h2")?.textContent ?? ""
      const btns = [...li.querySelectorAll("button")].map((b) => ({ t: b.textContent.trim(), d: b.disabled }))
      const sr = li.querySelector("h2 .sr-only")?.textContent ?? ""
      return { h, sr, btns, tag: /Skipped/.test(li.textContent) }
    }),
  )
}
// Cria uma plataforma nova pelo próprio cadastro (Create account, código, About, Name) e devolve o slug.
const createPlatform = async (page) => {
  await page.goto(`${BASE}/signup/create`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000) // espera a hidratação, senão o React apaga o que foi digitado
  await page.fill("input[autocomplete=name]", "Rita Tester"); await page.fill("input[type=email]", "rita@example.com")
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/signup/verify"); await page.locator("input").first().click(); await page.keyboard.type("123456")
  // O sexto dígito já confirma o código; o botão Verify é só o plano B.
  await page.waitForURL("**/signup/about", { timeout: 20000 }).catch(async () => { await page.getByRole("button", { name: "Verify" }).click() })
  await page.waitForURL("**/signup/about", { timeout: 60000 })
  await page.getByRole("button", { name: "Skip" }).click()
  await page.waitForURL("**/signup/name")
  await page.waitForTimeout(2000)
  await page.locator("input[placeholder*='Lio']").fill("Order Test Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}
const prep = async (page, { payouts = false, skipped = [] } = {}) => {
  if (!SLUG) SLUG = await createPlatform(page)
  await page.goto(`${BASE}/admin/${SLUG}/getting-started`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("ol[aria-label='Setup steps'] li h2", { state: "attached", timeout: 60000 })
  await page.evaluate(({ slug, payouts, skipped }) => {
    const list = JSON.parse(localStorage.getItem("proto:communities") || "[]")
    const c = list.find((x) => x.slug === slug)
    if (c) { c.setup = { skipped }; c.status = "draft"; localStorage.setItem("proto:communities", JSON.stringify(list)) }
    if (payouts) localStorage.setItem(`proto:${slug}:payouts-v2`, JSON.stringify({ done: true })); else localStorage.removeItem(`proto:${slug}:payouts-v2`)
    localStorage.removeItem(`proto:${slug}:tier-extra`)
  }, { slug: SLUG, payouts, skipped })
  await page.reload({ waitUntil: "domcontentloaded" })
  await page.waitForSelector("ol[aria-label='Setup steps'] li h2", { state: "attached", timeout: 60000 })
  await page.waitForTimeout(2500)
  if (process.env.DEBUG_VIS) console.log(await page.evaluate(() => { let e = document.querySelector("ol[aria-label='Setup steps'] li h2"), out = []; while (e && e !== document.documentElement) { const s = getComputedStyle(e), r = e.getBoundingClientRect(); out.push(e.tagName + " vis:" + s.visibility + " disp:" + s.display + " op:" + s.opacity + " " + Math.round(r.width) + "x" + Math.round(r.height) + " ov:" + s.overflow); e = e.parentElement } return out.slice(0, 12).join("\n") }))
}
const action = (s) => s.btns.find((b) => !/Skip for now/.test(b.t))

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })
  const page = await ctx.newPage()
  SLUG = "" // cada contexto começa sem dados: a plataforma é criada de novo

  // 1) conta nova: só o Design ativo
  await prep(page)
  let st = await read(page)
  log(w, "novo: 6 itens", st.length === 6, `(${st.length})`)
  log(w, "novo: Design ativo, com Skip for now", action(st[0])?.d === false && st[0].btns.some((b) => /Skip for now/.test(b.t) && !b.d))
  log(w, "novo: Tier, Course, Payouts e Legal bloqueados", [1, 2, 3, 4].every((i) => action(st[i])?.d === true && st[i].sr.startsWith("Locked")))
  log(w, "novo: Go live desabilitado", action(st[5])?.d === true)
  const hint = await page.locator("ol[aria-label='Setup steps'] li").nth(1).locator("span[title]").first().getAttribute("title")
  log(w, "novo: dica do bloqueio", /Finish .Design. first/.test(hint ?? ""), `(${hint})`)

  // 2) pular o Design libera o Tier; o Design fica Skipped e ativo
  await page.locator("ol[aria-label='Setup steps'] li").nth(0).getByRole("button", { name: "Skip for now" }).click()
  await page.waitForTimeout(600)
  st = await read(page)
  log(w, "pular: Design com etiqueta Skipped e botão ativo", st[0].tag && action(st[0])?.d === false)
  log(w, "pular: Tier é o atual (ativo, com Skip)", action(st[1])?.d === false && st[1].btns.some((b) => /Skip for now/.test(b.t)))
  log(w, "pular: Course, Payouts e Legal continuam bloqueados", [2, 3, 4].every((i) => action(st[i])?.d === true))
  log(w, "pular: Go live segue desabilitado", action(st[5])?.d === true)

  // 3) dados antigos fora de ordem: payouts feito, nada mais
  await prep(page, { payouts: true })
  st = await read(page)
  log(w, "fora de ordem: Payouts aparece Done", st[3].sr.startsWith("Done"))
  log(w, "fora de ordem: Design atual, Tier e Course bloqueados", action(st[0])?.d === false && action(st[1])?.d === true && action(st[2])?.d === true)
  log(w, "fora de ordem: Legal bloqueado", action(st[4])?.d === true)

  // 4) tudo pulado: nada fica bloqueado
  await prep(page, { skipped: ["design", "tier", "course", "payouts", "legal"] })
  st = await read(page)
  log(w, "tudo pulado: nenhum bloqueado, todos com Skipped", [0, 1, 2, 3, 4].every((i) => !st[i].sr.startsWith("Locked")))

  // 5) link com ?tour= de passo bloqueado não abre o tour; do passo atual abre
  await prep(page)
  await page.goto(`${BASE}/admin/${SLUG}/sales?tab=tiers&tour=tier`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
  let tourKey = await page.evaluate((slug) => localStorage.getItem(`proto:${slug}:tour`), SLUG)
  log(w, "tour de passo bloqueado não começa", !tourKey || tourKey === "null", `(${tourKey})`)
  await page.evaluate(({ slug }) => { const l = JSON.parse(localStorage.getItem("proto:communities")); const c = l.find((x) => x.slug === slug); c.setup = { design: true, skipped: [] }; localStorage.setItem("proto:communities", JSON.stringify(l)) }, { slug: SLUG })
  await page.goto(`${BASE}/admin/${SLUG}/sales?tab=tiers&tour=tier`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
  tourKey = await page.evaluate((slug) => localStorage.getItem(`proto:${slug}:tour`), SLUG)
  log(w, "tour do passo atual começa", !!tourKey && tourKey !== "null", `(${(tourKey ?? "").slice(0, 40)})`)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(w, "sem rolagem horizontal", ov <= 0, `(${ov})`)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
