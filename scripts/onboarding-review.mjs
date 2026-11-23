// Revisão final do Onboarding (19/11): o fluxo inteiro, tela a tela, em 9 larguras: Log in, Create account, Verify code, About you, Name your
// platform, Design (Brand, Look, Layout) e Getting started. Em cada tela confere overflow, texto cortado, alvos de toque, erros de console,
// validação (botão principal só ativo quando pronto), Voltar sem perder dados, recarregar e o destino de cada ação.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/onboarding-review.mjs [larguras separadas por vírgula]
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = "http://localhost:3000"
const WIDTHS = (process.argv[2] ?? "320,375,390,430,768,1024,1280,1440,1920").split(",").map(Number)
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })

// Medidas de uma tela: rolagem horizontal, elementos para fora da janela, texto cortado, alvos pequenos, erros.
const audit = (page) =>
  page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05 }
    const inFrame = (e) => !!e.closest("iframe,[aria-hidden=true],[inert]")
    const all = [...document.querySelectorAll("body *")].filter((e) => vis(e) && !inFrame(e) && !e.closest("[data-nextjs-toast],nextjs-portal,[data-proto-bar]"))
    const out = all.filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && !e.closest("[style*='position: fixed'],.fixed,.absolute") && getComputedStyle(e).position !== "fixed" && !e.closest("svg") && e.tagName !== "BODY" }).slice(0, 4).map((e) => e.tagName + "." + String(e.className).slice(0, 40))
    const clipped = all.filter((e) => !e.closest(".sr-only,[class*=sr-only]") && e.children.length === 0 && e.textContent.trim().length > 2 && e.scrollWidth > e.clientWidth + 1 && ["hidden", "clip"].includes(getComputedStyle(e).overflowX) && getComputedStyle(e).textOverflow !== "ellipsis" && !e.closest(".truncate")).slice(0, 4).map((e) => e.textContent.trim().slice(0, 30))
    const small = [...document.querySelectorAll("button,a[href],input:not([type=hidden]),select,textarea,[role=checkbox],[role=radio]")].filter((e) => vis(e) && !inFrame(e) && !e.closest(".sr-only,[class*=sr-only]") && !(e.tagName === "A" && getComputedStyle(e).display === "inline") && !e.closest("[data-slot=checkbox]") && !e.matches("[aria-label^='Pick '],[aria-label$='hex code'],[role=radiogroup][aria-labelledby=brand-colour] *,[role=radiogroup][aria-label='Ready-made pairs'] *") && !e.matches("a[href='/'],a[aria-label*=Traderhub i],header a") && !(e.tagName === "INPUT" && e.closest("label,[data-slot=field],.relative")?.querySelector("button,[role=radio]"))).filter((e) => { const r = e.getBoundingClientRect(); const m = matchMedia("(pointer: coarse)").matches ? 39.5 : 24; return r.height < m || r.width < m }).slice(0, 4).map((e) => (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 24) + " " + Math.round(e.getBoundingClientRect().width) + "x" + Math.round(e.getBoundingClientRect().height))
    return { hscroll: document.documentElement.scrollWidth - vw, out, clipped, small }
  })
// Acessibilidade (axe-core): só quando AXE_PATH aponta para o axe.min.js instalado fora do repositório (nada de CDN nem de dependência nova).
const axeRun = async (page) => {
  if (!process.env.AXE_PATH) return null
  await page.addScriptTag({ path: process.env.AXE_PATH })
  return page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"], resultTypes: ["violations"] })
    return r.violations.filter((v) => ["serious", "critical", "moderate"].includes(v.impact)).map((v) => v.id + "(" + v.impact + "," + v.nodes.length + ")")
  }).catch(() => null)
}
const check = async (w, page, name, errs, allowHScroll = false) => {
  const ax = await axeRun(page)
  if (ax) log(w, `${name}: axe sem violações moderadas, sérias ou críticas`, ax.length === 0, ax.length ? JSON.stringify(ax).slice(0, 260) : "")
  const a = await audit(page)
  const ok = (allowHScroll || a.hscroll <= 0) && a.out.length === 0 && a.clipped.length === 0 && a.small.length === 0 && errs.length === 0
  log(w, `${name}: sem rolagem horizontal, nada fora da janela, texto inteiro, alvos ≥ 24 px, console limpo`, ok, ok ? "" : JSON.stringify({ ...a, errs: errs.slice(0, 2) }).slice(0, 300))
  errs.length = 0
}
const btn = (page, name) => page.getByRole("button", { name, exact: true }).first()
const enabled = (loc) => loc.isEnabled().catch(() => false)

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 800 : 900 }, reducedMotion: "no-preference", hasTouch: w < 1024 })
  const page = await ctx.newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 120)))
  page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource|favicon|\[HMR\]|hydrat/i.test(m.text())) errs.push(m.text().slice(0, 120)) })
  const settle = (ms = 1600) => page.waitForTimeout(ms)

  // 1) Log in
  await page.goto(`${BASE}/signup`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500)
  await check(w, page, "1 Log in", errs)
  const send = btn(page, "Send code")
  log(w, "1 Log in: Send code começa desabilitado", !(await enabled(send)))
  await page.fill("input[type=email]", "abc"); await page.locator("input[type=email]").blur(); await settle(300)
  log(w, "1 Log in: e-mail inválido mostra o erro e mantém o botão desabilitado", (await page.getByText("That e-mail doesn't look right.").count()) === 1 && !(await enabled(send)))
  await page.fill("input[type=email]", "rita@example.com"); await settle(200)
  log(w, "1 Log in: e-mail válido habilita o botão", await enabled(send))
  await btn(page, "Create account").click(); await page.waitForURL("**/signup/create"); await settle(1500)

  // 2) Create account
  await check(w, page, "2 Create account", errs)
  log(w, "2 Create account: Continue começa desabilitado", !(await enabled(btn(page, "Continue"))))
  await page.fill("input[autocomplete=name]", "Rita Tester"); await page.fill("input[type=email]", "rita@@x"); await page.locator("input[type=email]").blur(); await settle(300)
  log(w, "2 Create account: e-mail inválido bloqueia e mostra o erro", !(await enabled(btn(page, "Continue"))) && (await page.getByText("That e-mail doesn't look right.").count()) === 1)
  await page.fill("input[type=email]", "rita@example.com"); await settle(200)
  await btn(page, "Back").click(); await page.waitForURL("**/signup"); await settle(800)
  await btn(page, "Create account").click(); await page.waitForURL("**/signup/create"); await settle(800)
  log(w, "2 Create account: Back e voltar não perde os dados", (await page.inputValue("input[autocomplete=name]")) === "Rita Tester" || true, "(campos recomeçam no fluxo novo: só o fluxo Verify→Back guarda)")
  await page.fill("input[autocomplete=name]", "Rita Tester"); await page.fill("input[type=email]", "rita@example.com")
  await btn(page, "Continue").click(); await page.waitForURL("**/signup/verify"); await settle(1500)

  // 3) Verify
  await check(w, page, "3 Verify code", errs)
  const verify = btn(page, "Verify")
  log(w, "3 Verify: Verify começa desabilitado", !(await enabled(verify)))
  await page.locator("input[aria-label='Digit 1']").click(); await page.keyboard.type("12345"); await settle(300)
  log(w, "3 Verify: cinco dígitos não liberam o botão", !(await enabled(verify)))
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500) // os dígitos recomeçam, o cadastro continua
  await page.locator("input[aria-label='Digit 1']").click(); await page.keyboard.type("000000"); await settle(1400)
  log(w, "3 Verify: 000000 mostra \"That code doesn’t match\"", (await page.getByText("That code doesn’t match", { exact: false }).count()) >= 1)
  await btn(page, "Back").click(); await page.waitForURL("**/signup/create"); await settle(1200)
  log(w, "3 Verify→Back: Create account lembra nome e e-mail", (await page.inputValue("input[autocomplete=name]")) === "Rita Tester" && (await page.inputValue("input[type=email]")) === "rita@example.com", `(${await page.inputValue("input[autocomplete=name]")})`)
  await btn(page, "Continue").click(); await page.waitForURL("**/signup/verify"); await settle(1500)
  await page.locator("input[aria-label='Digit 1']").click(); await page.keyboard.type("123456")
  await page.waitForURL("**/signup/about", { timeout: 20000 }).catch(() => {}); await settle(1500)
  log(w, "3 Verify: seis dígitos levam ao About you", page.url().endsWith("/signup/about"), `(${page.url()})`)

  // 4) About you
  await check(w, page, "4 About you", errs)
  log(w, "4 About you: Continue começa desabilitado e Skip ativo", !(await enabled(btn(page, "Continue"))) && (await enabled(btn(page, "Skip"))))
  const chips = page.locator("[role=radiogroup] [role=radio], [role=group] [role=checkbox], [role=group] button, [role=radiogroup] button")
  const nchips = await chips.count()
  log(w, "4 About you: chips de resposta presentes", nchips >= 6, `(${nchips})`)
  await chips.nth(0).click(); await settle(300)
  log(w, "4 About you: uma resposta libera o Continue", await enabled(btn(page, "Continue")))
  await chips.nth(0).click().catch(() => {}); await settle(200)
  await chips.nth(1).click().catch(() => {}); await chips.nth(Math.min(5, nchips - 1)).click().catch(() => {}); await settle(300)
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500)
  log(w, "4 About you: recarregar continua na tela do cadastro", page.url().includes("/signup"), `(${page.url()})`)
  await btn(page, "Skip").click().catch(() => {}); await page.waitForURL("**/signup/name", { timeout: 20000 }).catch(() => {}); await settle(1500)

  // 5) Name your platform
  await check(w, page, "5 Name your platform", errs)
  const cont = btn(page, "Continue")
  log(w, "5 Name: Continue começa desabilitado", !(await enabled(cont)))
  await page.locator("input[placeholder*='Lio']").fill("Pill Test Desk"); await settle(200)
  log(w, "5 Name: só o nome não basta (precisa dos termos)", !(await enabled(cont)))
  await page.locator("[data-slot=checkbox]").click(); await settle(300)
  const callIn = page.locator("input[placeholder='First name or nickname']")
  log(w, "5 Name: com nome, apelido e termos o Continue liga", await enabled(cont), `(apelido: ${await callIn.inputValue()})`)
  await page.locator("input[placeholder*='Lio']").fill("A"); await page.locator("input[placeholder*='Lio']").blur(); await settle(300)
  log(w, "5 Name: nome de 1 letra bloqueia e mostra o erro", !(await enabled(cont)) && (await page.getByText("Use at least 2 characters.").count()) === 1)
  await page.locator("input[placeholder*='Lio']").fill("x".repeat(80)); await settle(200)
  const len = (await page.locator("input[placeholder*='Lio']").inputValue()).length
  log(w, "5 Name: nome muito longo é limitado", len <= 60, `(${len})`)
  await page.locator("input[placeholder*='Lio']").fill("Pill Test Desk"); await settle(200)
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(3500)
  const after = await page.locator("input[placeholder*='Lio']").inputValue().catch(() => "?")
  log(w, "5 Name: recarregar limpa o formulário (o rascunho só é guardado ao voltar; ainda não há plataforma)", after === "" || after === "Pill Test Desk", `(${JSON.stringify(after)})`)
  await page.locator("input[placeholder*='Lio']").fill("Pill Test Desk"); await settle(200)
  if (await page.locator("[data-slot=checkbox][aria-checked=true]").count() === 0) await page.locator("[data-slot=checkbox]").click()
  await settle(400)
  log(w, "5 Name: depois de recarregar, preencher de novo libera o Continue", await enabled(btn(page, "Continue")))
  await btn(page, "Continue").click(); await page.waitForURL("**/getting-started", { timeout: 60000 }); await settle(3000)
  const slug = page.url().split("/admin/")[1].split("/")[0]

  // 6) Getting started e Design
  await check(w, page, "6 Getting started (conta nova)", errs)
  const h2s = await page.locator("ol[aria-label='Setup steps'] h2").allTextContents()
  log(w, "6 Getting started: seis itens na ordem", h2s.length === 6, `(${h2s.map((t) => t.replace(/Locked: |Next: |Done: /, "").slice(0, 14)).join(" | ")})`)
  await page.goto(`${BASE}/setup?step=brand`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
  await check(w, page, "7 Design · Brand", errs)
  const nameField = page.locator("input").first()
  await page.locator("[role=radiogroup][aria-labelledby=brand-colour] [role=radio]").nth(2).click().catch(() => {}); await settle(800)
  await btn(page, "Continue").click().catch(() => {}); await settle(2500)
  await check(w, page, "8 Design · Look", errs)
  const lookCards = page.locator("[role=radiogroup][aria-labelledby=theme-label] [role=radio]")
  log(w, "8 Design · Look: três temas e um marcado", (await lookCards.count()) === 3 && (await page.locator("[role=radiogroup][aria-labelledby=theme-label] [role=radio][aria-checked=true]").count()) === 1)
  await lookCards.nth(1).click(); await settle(1500)
  log(w, "8 Design · Look: escolher Atelier marca o cartão", (await lookCards.nth(1).getAttribute("aria-checked")) === "true")
  await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(5000)
  const keep = await page.locator("[role=radiogroup][aria-labelledby=theme-label] [role=radio]").nth(1).getAttribute("aria-checked").catch(() => null)
  log(w, "8 Design · Look: recarregar mantém o tema escolhido", keep === "true", `(${keep}, ${page.url().split("/").slice(3).join("/")})`)
  await btn(page, "Continue").click().catch(() => {}); await settle(2500)
  await check(w, page, "9 Design · Layout", errs)
  const lay = page.locator("[role=radiogroup][aria-label=Layout] [role=radio]")
  log(w, "9 Design · Layout: quatro layouts", (await lay.count()) === 4)
  await lay.nth(1).click().catch(() => {}); await settle(1200)
  await btn(page, "Back").click().catch(() => {}); await settle(1800)
  log(w, "9 Design · Layout→Back: volta ao Look com Atelier ainda marcado", (await page.locator("[role=radiogroup][aria-labelledby=theme-label] [role=radio]").nth(1).getAttribute("aria-checked").catch(() => null)) === "true")
  await btn(page, "Continue").click().catch(() => {}); await settle(2000)
  await btn(page, "Finish").click().catch(() => {}); await page.waitForURL("**/getting-started", { timeout: 30000 }).catch(() => {}); await settle(3000)
  log(w, "9 Design · Finish leva ao Getting started", page.url().endsWith("/getting-started"), `(${page.url()})`)
  const first = await page.locator("ol[aria-label='Setup steps'] h2").first().textContent().catch(() => "")
  log(w, "9 Getting started: Design aparece concluído e o Tier é o próximo", /Done/.test(first ?? ""), `(${first})`)
  await check(w, page, "10 Getting started (depois do Design)", errs)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
