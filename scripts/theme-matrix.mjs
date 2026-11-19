// Temas (19/11): Terminal, Atelier e Pulse × Dark e Light, no preview do Onboarding e no Editor, nos tamanhos, com tema salvo, recarregando,
// trocando rápido e com dados antigos. O Pulse tinha o azul-marinho do template pintado de marrom (dark) e rosa (light) pela cor da marca
// (greys "Brand"); o certo é a paleta exata do template. Confere também as ilustrações dos cards (inteiras, na largura do cartão).
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/theme-matrix.mjs
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const TEMPLATES = JSON.parse(readFileSync(new URL("../src/lib/theme/template-data.json", import.meta.url), "utf8"))

const BASE = "http://localhost:3000"
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
const lum = (hex) => { const n = parseInt(hex.replace("#", "").slice(0, 6), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const norm = (s) => s.trim().toLowerCase()

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
  await page.locator("input[placeholder*='Lio']").fill("Theme Test Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}
// cores do preview: no Onboarding é um iframe do site do aluno (--background e --card); no Editor é o canvas na própria página (.hb-canvas)
const hex = (rgb) => { const m = rgb.match(/\d+/g); return m ? "#" + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("") : rgb }
const preview = async (page) => {
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue
    const r = await f.evaluate(() => { const s = getComputedStyle(document.documentElement); return { bg: s.getPropertyValue("--background"), card: s.getPropertyValue("--card") } }).catch(() => null)
    if (r?.bg) return r
  }
  const c = await page.evaluate(() => { const e = document.querySelector(".hb-canvas"); return e ? { bg: getComputedStyle(e).backgroundColor, card: getComputedStyle(e).getPropertyValue("--card") } : null }).catch(() => null)
  return c ? { bg: hex(c.bg), card: c.card } : null
}
const THEME = ["terminal", "atelier", "pulse"], NAME = { terminal: /Terminal/, atelier: /Atelier/, pulse: /Pulse/ }
const open = {
  onboarding: async (page) => { await page.goto(`${BASE}/setup?step=look`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000) },
  editor: async (page, slug) => { await page.goto(`${BASE}/admin/${slug}/design`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(8000); await page.getByRole("tab", { name: "Theme" }).click(); await page.waitForTimeout(1500) },
}
const pickTheme = async (page, t, where) => {
  const group = where === "editor" ? page.locator("[role=radiogroup][aria-label=Theme]") : page.locator("[role=radiogroup][aria-labelledby=theme-label]")
  await group.getByRole("radio", { name: NAME[t] }).first().click()
  // o Editor pergunta antes de trocar só se o desenho foi mexido à mão
  const ok = page.getByRole("button", { name: /^(Switch|Replace|Change)/ })
  if (await ok.first().isVisible().catch(() => false)) await ok.first().click()
}
const pickMode = async (page, m) => { await page.locator(`[role=radiogroup] [data-value=${m}]`).first().click() }
// as ilustrações dos cards: inteiras (proporção do arquivo), na largura útil do cartão, sem passar da borda
const art = (page) =>
  page.evaluate(() => [...document.querySelectorAll("[role=radio] img")].map((i) => { const r = i.getBoundingClientRect(), c = i.closest("[role=radio]").getBoundingClientRect(); return { ok: i.naturalWidth > 0 && i.complete, ratio: Math.abs(r.width / r.height / (i.naturalWidth / i.naturalHeight) - 1), inner: Math.abs(c.width - 18 - r.width), over: r.right - c.right } }))

for (const w of [1440, 768, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  const slug = await createPlatform(page)
  for (const where of ["onboarding", "editor"]) {
    if (where === "onboarding" && w < 1100) { // a prévia só existe em tela larga: aqui só as ilustrações
      await open.onboarding(page)
      const a = await art(page)
      log(w, "onboarding: ilustrações dos temas inteiras", a.length >= 3 && a.every((x) => x.ok && x.ratio < 0.01 && x.inner < 1.5 && x.over <= 0), JSON.stringify(a.map((x) => [x.ratio.toFixed(3), x.inner.toFixed(1)])))
      continue
    }
    if (where === "editor" && w < 1100) continue // o Editor é só desktop
    await open[where](page, slug)
    const a0 = await art(page)
    log(w, `${where}: ilustrações dos cards inteiras`, a0.length >= 3 && a0.every((x) => x.ok && x.ratio < 0.01 && x.inner < 1.5 && x.over <= 0), JSON.stringify(a0.map((x) => [x.ratio.toFixed(3), x.inner.toFixed(1), x.over.toFixed(1)])))
    for (const t of THEME) {
      for (const m of ["dark", "light"]) {
        await pickTheme(page, t, where); await pickMode(page, m); await page.waitForTimeout(2500)
        const p = await preview(page)
        const tpl = TEMPLATES[t].theme.palettes[m]
        if (!p) { log(w, `${where} ${t} ${m}: preview lido`, false); continue }
        const FIGMA = { "terminal-light": "#f4f4f5", "atelier-light": "#efe9dc", "pulse-dark": "#0e1226", "terminal-dark": "#050505" }[`${t}-${m}`]
        if (FIGMA) log(w, `${where} ${t} ${m}: fundo igual ao do Figma (${FIGMA})`, norm(p.bg) === FIGMA, `(${norm(p.bg)})`)
        if (true) log(w, `${where} ${t} ${m}: paleta exata do template (não tingida pela marca)`, norm(p.bg) === tpl.background, `(${norm(p.bg)} esperado ${tpl.background}; o cartão sobe um degrau de contraste, ${norm(p.card)})`)
        if (t === "terminal") log(w, `${where} ${t} ${m}: luminosidade do template`, Math.abs(lum(norm(p.bg)) - lum(tpl.background)) < 0.2, `(${norm(p.bg)} esperado ~${tpl.background})`)
        const sat = (hex) => { const n = parseInt(hex.slice(1, 7), 16); const c = [n >> 16, (n >> 8) & 255, n & 255]; return Math.max(...c) - Math.min(...c) }
        if (t === "pulse") log(w, `${where} pulse ${m}: sem marrom/rosa (azul domina)`, (() => { const n = parseInt(norm(p.bg).slice(1, 7), 16); return (n & 255) >= (n >> 16) })(), `(${norm(p.bg)})`)
      }
    }
    if (where === "onboarding") {
      // animação da troca no preview: a prévia some (220 ms), a mudança entra sem ser vista e ela volta (420 ms); nunca fica apagada nem pisca a cor errada
      await pickTheme(page, "terminal", where); await page.waitForTimeout(2500)
      const tl = await page.evaluate(async () => {
        const f = document.querySelector("iframe.onb-frame"); const samples = []; const t0 = performance.now()
        document.querySelector("[role=radiogroup][aria-labelledby=theme-label]").querySelectorAll("[role=radio]")[2].click()
        await new Promise((r) => { const tick = () => { samples.push(+getComputedStyle(f).opacity); const d = f.contentDocument?.documentElement; samples.length < 90 ? requestAnimationFrame(tick) : r() }; tick() })
        return { min: Math.min(...samples), last: samples[samples.length - 1], ms: Math.round(performance.now() - t0) }
      })
      log(w, "onboarding: troca de tema anima (some e volta) e termina visível", tl.last === 1 && tl.min < 0.2, `(${JSON.stringify(tl)})`)
    }
    // troca rápida: o estado final é o último clique
    for (const t of ["terminal", "atelier", "pulse", "terminal", "pulse"]) { await pickTheme(page, t, where); await page.waitForTimeout(60) }
    await pickMode(page, "dark"); await pickMode(page, "light"); await pickMode(page, "dark"); await page.waitForTimeout(3000)
    const fin = await preview(page)
    log(w, `${where}: troca rápida termina em Pulse dark`, !!fin && norm(fin.bg) === TEMPLATES.pulse.theme.palettes.dark.background, `(${fin && norm(fin.bg)})`)
    // recarregar mantém o tema salvo
    await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(8000)
    if (where === "editor") { await page.getByRole("tab", { name: "Theme" }).click().catch(() => {}); await page.waitForTimeout(1500) }
    const after = await preview(page)
    log(w, `${where}: depois de recarregar segue Pulse dark`, !!after && norm(after.bg) === TEMPLATES.pulse.theme.palettes.dark.background, `(${after && norm(after.bg)})`)
  }
  if (w >= 1100) {
    // dados antigos: rascunho sem "tint" = exato; com tint "brand" salvo pelo coach = a escolha dele vale (tingido)
    for (const [label, tint, expectExact] of [["sem tint (dados antigos)", undefined, true], ['tint "brand" escolhido', "brand", false], ['tint "none" escolhido', "none", false]]) {
      await page.goto(`${BASE}/admin/${slug}/design`, { waitUntil: "domcontentloaded" })
      await page.evaluate(({ slug, tint }) => { localStorage.setItem(`proto:draft:${slug}`, JSON.stringify({ theme: { template: "pulse", mode: "dark", ...(tint ? { tint } : {}) }, content: {} })) }, { slug, tint })
      await page.reload({ waitUntil: "domcontentloaded" }); await page.waitForTimeout(8000)
      const p = await preview(page)
      const exact = !!p && norm(p.bg) === TEMPLATES.pulse.theme.palettes.dark.background
      log(w, `dados antigos · pulse dark ${label}`, exact === expectExact, `(${p && norm(p.bg)})`)
    }
  }
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(w, "sem rolagem horizontal", ov <= 0, `(${ov})`)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
