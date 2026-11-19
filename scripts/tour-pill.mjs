// Course tour pill e Progress ring (19/11): a pill só existe nos fluxos da timeline (nunca no Getting started), anel laranja sempre à esquerda, check verde ao concluir; o anel do design no onboarding também é laranja.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/tour-pill.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const BASE = "http://localhost:3000"
const widths = [1440, 768, 390]
const ORANGE = "rgb(194, 86, 28)"
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })

const createPlatform = async (page) => {
  await page.goto(`${BASE}/signup/create`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(3000)
  await page.fill("input[autocomplete=name]", "Rita Tester"); await page.fill("input[type=email]", "rita@example.com")
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/signup/verify"); await page.locator("input").first().click(); await page.keyboard.type("123456")
  await page.waitForURL("**/signup/about", { timeout: 60000 }).catch(async () => { await page.getByRole("button", { name: "Verify" }).click() })
  await page.waitForURL("**/signup/about", { timeout: 60000 })
  await page.getByRole("button", { name: "Skip" }).click()
  await page.waitForURL("**/signup/name"); await page.waitForTimeout(2000)
  await page.locator("input[placeholder*='Lio']").fill("Pill Test Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}
// a pill: o botão fixo com aria-expanded ou o botão que contém o rótulo do tour
const pillInfo = (page) =>
  page.evaluate(() => {
    const b = [...document.querySelectorAll("button.fixed")].find((x) => /first tier|tier added/i.test(x.textContent ?? ""))
    if (!b) return null
    const ring = b.querySelector("svg circle:nth-of-type(2)"), svg = b.querySelector("svg:not([class*=size-])") ?? b.querySelector("svg")
    const label = [...b.querySelectorAll("span")].find((s) => /tier/i.test(s.textContent ?? "") && !s.querySelector("svg"))
    const sr = b.querySelector("svg circle") ? svg.getBoundingClientRect() : null
    const lr = label?.getBoundingClientRect()
    return { ringStroke: ring ? getComputedStyle(ring).stroke : null, hasRing: !!ring, hasCheck: !!b.querySelector("svg:not(:has(circle))"), ringLeft: sr && lr ? sr.left < lr.left : null, text: b.textContent.trim() }
  })

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  const slug = await createPlatform(page)
  const setTour = (s) => page.evaluate(({ slug, s }) => { if (s) localStorage.setItem(`proto:${slug}:tour`, JSON.stringify(s)); else localStorage.removeItem(`proto:${slug}:tour`) }, { slug, s })
  // com um tour em andamento: some no Getting started, aparece nos outros
  await setTour({ id: "tier", started: false, panel: false, at: "new" })
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500)
  log(w, "getting started: sem pill", (await pillInfo(page)) === null)
  await page.goto(`${BASE}/admin/${slug}/sales?tab=tiers`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(4500)
  let p = await pillInfo(page)
  log(w, "fluxo da timeline: pill aparece", !!p, `(${p?.text})`)
  log(w, "pill: anel laranja #c2561c, à esquerda do nome", p?.ringStroke === ORANGE && p?.ringLeft === true, `(${p?.ringStroke} | esquerda=${p?.ringLeft})`)
  // painel aberto: o anel vai para a direita, segue laranja
  await page.locator("button.fixed", { hasText: /first tier/i }).first().click(); await page.waitForTimeout(700)
  p = await pillInfo(page)
  log(w, "painel aberto: anel continua à esquerda, laranja", p?.ringStroke === ORANGE && p?.ringLeft === true, `(${p?.ringStroke} | esquerda=${p?.ringLeft})`)
  // concluído: check verde no lugar do anel
  await setTour({ id: "tier", started: false, panel: false, at: "created", done: true })
  await page.goto(`${BASE}/admin/${slug}/sales?tab=tiers`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(4500)
  p = await pillInfo(page)
  const checkColor = await page.evaluate(() => { const b = [...document.querySelectorAll("button.fixed")].find((x) => /tier/i.test(x.textContent ?? "")); const s = b?.querySelector("svg"); return s ? getComputedStyle(s).color : null })
  log(w, "concluído: check verde, sem anel", p && !p.hasRing && /74, 222, 128|22, 163, 74/.test(checkColor ?? ""), `(${p?.text} | ${checkColor})`)
  // clicar no concluído leva ao Getting started e a pill some
  await page.locator("button.fixed", { hasText: /tier/i }).first().click(); await page.waitForURL("**/getting-started", { timeout: 20000 }); await page.waitForTimeout(2500)
  log(w, "concluído: volta ao Getting started sem pill", (await pillInfo(page)) === null)
  // anel do design no onboarding
  await page.goto(`${BASE}/setup?step=look`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500)
  const ring = await page.evaluate(() => { const s = document.querySelector("svg[role=img][aria-label^='Step ']"); const c = s?.querySelectorAll("circle")[1]; return c ? getComputedStyle(c).stroke : null })
  log(w, "design: anel do onboarding laranja (a prévia só existe em tela larga)", ring === ORANGE || (ring === null && w < 1024), `(${ring})`)
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(w, "sem rolagem horizontal", ov <= 0, `(${ov})`)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
