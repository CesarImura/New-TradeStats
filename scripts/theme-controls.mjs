// Temas (19/11), parte 2: controles e usos fora do preview. Site do aluno (/c/<slug>) em Terminal, Atelier e Pulse × Dark e Light,
// trocar a cor da marca (Pulse mantém o azul-marinho; Atelier segue a marca), variações do tema, modo Dark/Light sincronizado,
// ilustrações do Layout (Editor e Onboarding), troca com reduced motion, e a troca rápida de modo.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/theme-controls.mjs
import { createRequire } from "node:module"
import { readFileSync } from "node:fs"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const TEMPLATES = JSON.parse(readFileSync(new URL("../src/lib/theme/template-data.json", import.meta.url), "utf8"))
const BASE = "http://localhost:3000"
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
const norm = (s) => s.trim().toLowerCase()
const hex = (rgb) => { const m = rgb.match(/\d+/g); return m ? "#" + m.slice(0, 3).map((v) => (+v).toString(16).padStart(2, "0")).join("") : rgb }

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
  await page.locator("input[placeholder*='Lio']").fill("Theme Ctl Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}
const canvasBg = (page) => page.evaluate(() => { const e = document.querySelector(".hb-canvas"); return e ? getComputedStyle(e).backgroundColor : null }).then((v) => (v ? hex(v) : null))
const art = (page) => page.evaluate(() => [...document.querySelectorAll("[role=radio] img")].map((i) => { const r = i.getBoundingClientRect(), c = i.closest("[role=radio]").getBoundingClientRect(); return { ok: i.naturalWidth > 0 && i.complete, ratio: Math.abs(r.width / r.height / (i.naturalWidth / i.naturalHeight) - 1), inner: Math.abs(c.width - 18 - r.width), over: r.right - c.right } }))
const artOk = (a) => a.length >= 3 && a.every((x) => x.ok && x.ratio < 0.01 && x.inner < 1.5 && x.over <= 0)

for (const w of [1440, 768, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  const slug = await createPlatform(page)
  // 1) site do aluno em cada tema e modo (rascunho em /c/<slug>?preview=draft)
  for (const t of ["terminal", "atelier", "pulse"]) {
    for (const m of ["dark", "light"]) {
      await page.goto(`${BASE}/admin/${slug}/design`, { waitUntil: "domcontentloaded" })
      await page.evaluate(({ slug, t, m }) => localStorage.setItem(`proto:draft:${slug}`, JSON.stringify({ theme: { template: t, mode: m }, content: {} })), { slug, t, m })
      await page.goto(`${BASE}/c/${slug}?preview=draft&modules=all`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
      const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim().toLowerCase())
      const exp = TEMPLATES[t].theme.palettes[m].background
      const ok = bg === exp
      log(w, `site do aluno ${t} ${m}: fundo`, ok, `(${bg} esperado ${exp})`)
      const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (ov > 0) log(w, `site do aluno ${t} ${m}: sem rolagem horizontal`, false, `(${ov})`)
    }
  }
  // 1b) as outras páginas do aluno em Pulse dark e Pulse light: mesma paleta exata, sem erro de console
  for (const m of ["dark", "light"]) {
    await page.goto(`${BASE}/admin/${slug}/design`, { waitUntil: "domcontentloaded" })
    await page.evaluate(({ slug, m }) => localStorage.setItem(`proto:draft:${slug}`, JSON.stringify({ theme: { template: "pulse", mode: m }, content: {} })), { slug, m })
    for (const route of ["courses", "journal", "charts", "ranking", "calendar", "profile"]) {
      const errs = []
      page.on("pageerror", (e) => errs.push(String(e)))
      await page.goto(`${BASE}/c/${slug}/${route}?preview=draft&modules=all`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(4500)
      const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim().toLowerCase())
      log(w, `aluno /${route} pulse ${m}: paleta do template e sem erro`, bg === TEMPLATES.pulse.theme.palettes[m].background && errs.length === 0, `(${bg}${errs.length ? " " + errs[0].slice(0, 80) : ""})`)
      page.removeAllListeners("pageerror")
    }
    // sites públicos /site/<coach>: entrada, login, checkout, entrar e lista de espera
    for (const route of ["", "login", "checkout", "join", "waitlist"]) {
      const errs = []
      page.on("pageerror", (e) => errs.push(String(e)))
      await page.goto(`${BASE}/site/${slug}${route ? "/" + route : ""}?preview=draft`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(4500)
      const r = await page.evaluate(() => ({ bg: getComputedStyle(document.documentElement).getPropertyValue("--background").trim().toLowerCase(), url: location.pathname, h: document.body.innerText.length }))
      log(w, `site /${route || "(entrada)"} pulse ${m}: paleta do template e sem erro`, (r.bg === TEMPLATES.pulse.theme.palettes[m].background || r.bg === "") && errs.length === 0 && r.h > 20, `(${r.bg || "sem --background"} ${r.url}${errs.length ? " " + errs[0].slice(0, 80) : ""})`)
      page.removeAllListeners("pageerror")
    }
  }
  // 2) onboarding: ilustrações do Layout
  await page.goto(`${BASE}/setup?step=layout`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
  const al = await page.evaluate(() => [...document.querySelectorAll("[role=radio] img")].map((i) => { const r = i.getBoundingClientRect(), c = i.closest("[role=radio]").getBoundingClientRect(); return { ok: i.naturalWidth > 0 && i.complete, ratio: Math.abs(r.width / r.height / (i.naturalWidth / i.naturalHeight) - 1), inner: Math.abs(c.width - 18 - r.width), over: r.right - c.right } }))
  log(w, "onboarding: ilustrações do Layout inteiras", al.length === 4 && al.every((x) => x.ok && x.ratio < 0.01 && x.inner < 1.5 && x.over <= 0), JSON.stringify(al.map((x) => [x.ratio.toFixed(3), x.inner.toFixed(1)])))
  if (w >= 1100) {
    // 3) Editor: controles
    await page.evaluate((slug) => localStorage.removeItem(`proto:draft:${slug}`), slug)
    await page.goto(`${BASE}/admin/${slug}/design`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(8000)
    // a cor da marca na aba Brand: Pulse mantém o azul-marinho, Atelier segue a marca
    const brandSwatches = page.locator("[role=radiogroup][aria-label*='colour' i] [role=radio]")
    const hasSwatches = (await brandSwatches.count()) >= 3
    log(w, "editor: aba Brand mostra as cores da marca", hasSwatches, `(${await brandSwatches.count()})`)
    await page.getByRole("tab", { name: "Theme" }).click(); await page.waitForTimeout(1200)
    const pick = async (name) => { await page.locator("[role=radiogroup][aria-label=Theme]").getByRole("radio", { name }).first().click(); const ok = page.getByRole("button", { name: /^(Switch|Replace|Change)/ }); if (await ok.first().isVisible().catch(() => false)) await ok.first().click(); await page.waitForTimeout(1800) }
    const brand = async (nth) => { await page.getByRole("tab", { name: "Brand" }).click(); await page.waitForTimeout(800); await brandSwatches.nth(nth).click(); await page.waitForTimeout(1800); await page.getByRole("tab", { name: "Theme" }).click(); await page.waitForTimeout(800) }
    // a cor da marca em cada tema e modo: Pulse (azul-marinho) e Atelier (creme) não mudam com a marca; Terminal tem cinzas sem cor e não muda
    const EXPECT = { pulse: "same", atelier: "same", terminal: "same" }
    for (const [name, key] of [[/Terminal/, "terminal"], [/Atelier/, "atelier"], [/Pulse/, "pulse"]]) {
      for (const m of ["dark", "light"]) {
        await pick(name); await page.locator("[role=radiogroup] [data-value=" + m + "]").first().click(); await page.waitForTimeout(1500)
        const before = await canvasBg(page); await brand(m === "dark" ? 4 : 2); const after = await canvasBg(page)
        const same = before === after
        const tpl = TEMPLATES[key].theme.palettes[m].background
        const ok = EXPECT[key] === "same" ? same : !same || m === "light" // Atelier light é branco: sem cor para tingir
        log(w, `controles: trocar a cor da marca no ${key} ${m} (${EXPECT[key] === "same" ? "não muda os cinzas" : "cinzas acompanham"})`, ok, `(${before} → ${after}${key === "pulse" ? ` template ${tpl}` : ""})`)
      }
    }
    // modo: o controle e o preview ficam de acordo
    for (const m of ["light", "dark", "light"]) { await page.locator("[role=radiogroup] [data-value=" + m + "]").first().click() }
    await page.waitForTimeout(2000)
    const checked = await page.evaluate(() => [...document.querySelectorAll("[role=radiogroup] [data-value=light],[role=radiogroup] [data-value=dark]")].filter((b) => b.getAttribute("aria-checked") === "true").map((b) => b.dataset.value))
    const cls = await page.evaluate(() => document.querySelector(".hb-canvas")?.className.includes("dark") ? "dark" : "light")
    log(w, "controles: troca rápida de modo termina em Light e o controle acompanha", checked.length >= 1 && checked.every((v) => v === "light") && cls === "light", `(${checked} / ${cls})`)
    // variações do tema (cada tema tem duas) e o cartão marcado acompanha
    for (const [name, key] of [[/Terminal/, "terminal"], [/Atelier/, "atelier"], [/Pulse/, "pulse"]]) {
      await pick(name)
      const vars = page.locator("[role=radiogroup][aria-label=Variation] [role=radio]")
      const nv = await vars.count()
      if (nv >= 2) { await vars.nth(1).click(); await page.waitForTimeout(1500) }
      const vchecked = await page.evaluate(() => [...document.querySelectorAll("[role=radiogroup][aria-label=Variation] [role=radio]")].map((b) => b.getAttribute("aria-checked")))
      const cardOn = await page.evaluate(() => [...document.querySelectorAll("[role=radiogroup][aria-label=Theme] [role=radio]")].filter((b) => b.getAttribute("aria-checked") === "true").length)
      log(w, `controles: variação do ${key} marca uma só e o cartão do tema segue marcado`, nv === 2 && vchecked.filter((x) => x === "true").length === 1 && vchecked[1] === "true" && cardOn === 1, `(${vchecked}; cartões ${cardOn})`)
    }
    // 4) Editor: ilustrações do Layout
    await page.getByRole("tab", { name: "Layout" }).click(); await page.waitForTimeout(1500)
    const el = await page.evaluate(() => [...document.querySelectorAll("[role=radiogroup][aria-label=Layout] [role=radio] img")].map((i) => { const r = i.getBoundingClientRect(), c = i.closest("[role=radio]").getBoundingClientRect(); return { ok: i.naturalWidth > 0 && i.complete, ratio: Math.abs(r.width / r.height / (i.naturalWidth / i.naturalHeight) - 1), inner: Math.abs(c.width - 18 - r.width), over: r.right - c.right } }))
    log(w, "editor: ilustrações do Layout inteiras", el.length === 4 && el.every((x) => x.ok && x.ratio < 0.01 && x.inner < 1.5 && x.over <= 0), JSON.stringify(el.map((x) => [x.ratio.toFixed(3), x.inner.toFixed(1)])))
  }
  await ctx.close()
}
// 5) reduced motion: a troca de tema no preview do Onboarding termina sem animação longa e visível
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  const page = await ctx.newPage()
  await createPlatform(page)
  await page.goto(`${BASE}/setup?step=look`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000)
  const g = page.locator("[role=radiogroup][aria-labelledby=theme-label]")
  await g.getByRole("radio", { name: /Pulse/ }).first().click(); await page.waitForTimeout(1200)
  let bg = null
  for (const f of page.frames()) { if (f === page.mainFrame()) continue; bg = await f.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--background").trim().toLowerCase()).catch(() => null); if (bg) break }
  const op = await page.evaluate(() => +getComputedStyle(document.querySelector("iframe.onb-frame")).opacity)
  log("reduced", "onboarding: troca de tema termina visível em 1,2 s", bg === TEMPLATES.pulse.theme.palettes.dark.background && op === 1, `(${bg}, opacidade ${op})`)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
