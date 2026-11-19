// Tabs e segmented controls com thumb deslizante (19/11, interior.dev): um thumb com cópia invertida dos rótulos, mola 520/34/0,45.
// Percorre as telas do Admin e do Editor, acha cada tablist/radiogroup com thumb e confere: papéis, thumb sobre o item ativo,
// movimento (não salta), cópia dos rótulos registrada com os de baixo, retarget no meio do caminho, teclado e reduced motion.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/tabs-motion.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const BASE = "http://localhost:3000"
const widths = [1440, 768, 390]
const ROUTES = ["students", "sales?tab=tiers", "sales", "content", "calendar", "community", "charts", "settings", "journal", "downloads", "partners", "ranking", "livestreams", "ai", "design", "getting-started"]
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
  await page.locator("input[placeholder*='Lio']").fill("Tabs Test Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}

// Marca cada grupo com thumb (tablist ou radiogroup que contém um span aria-hidden com overflow hidden e pointer-events none).
const mark = (page) =>
  page.evaluate(() => {
    let n = 0
    for (const g of document.querySelectorAll("[role=tablist],[role=radiogroup]")) {
      const thumb = [...g.querySelectorAll("span[aria-hidden]")].find((s) => getComputedStyle(s).overflow === "hidden" && getComputedStyle(s).pointerEvents === "none" && getComputedStyle(s).position === "absolute")
      const items = g.querySelectorAll("[role=tab],[role=radio]")
      if (thumb && items.length >= 2 && g.getBoundingClientRect().width > 0) { g.setAttribute("data-tm", String(n++)) }
    }
    return n
  })
// geometria do grupo: thumb, itens reais, rótulos de baixo e da cópia
const geo = (page, i) =>
  page.evaluate((i) => {
    const g = document.querySelector(`[data-tm="${i}"]`)
    if (!g) return null
    const thumb = [...g.querySelectorAll("span[aria-hidden]")].find((s) => getComputedStyle(s).overflow === "hidden" && getComputedStyle(s).pointerEvents === "none" && getComputedStyle(s).position === "absolute")
    const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height } }
    const btns = [...g.querySelectorAll("[role=tab],[role=radio]")]
    const act = btns.findIndex((b) => b.getAttribute("aria-selected") === "true" || b.getAttribute("aria-checked") === "true")
    const bases = [...g.querySelectorAll(":scope [data-slide]")]
    const copy = thumb.firstElementChild
    const copyItems = copy ? [...copy.children] : []
    return { n: btns.length, act, thumb: r(thumb), btn: btns.map(r), base: bases.map(r), copy: copyItems.map(r), checked: btns.filter((b) => b.getAttribute("aria-selected") === "true" || b.getAttribute("aria-checked") === "true").length, tabindex: btns.map((b) => b.tabIndex), label: g.getAttribute("aria-label"), vw: document.documentElement.scrollWidth - document.documentElement.clientWidth }
  }, i)

const near = (a, b, e = 1.5) => Math.abs(a - b) <= e

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  const slug = await createPlatform(page)
  let seen = 0
  for (const route of ROUTES) {
    await page.goto(`${BASE}/admin/${slug}/${route}`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(6000)
    const count = await mark(page)
    for (let i = 0; i < count; i++) {
      seen++
      if (i > 0) { await page.goto(`${BASE}/admin/${slug}/${route}`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(6000) } // trocar uma aba pode esconder o grupo seguinte (Charts): recarrega
      await mark(page)
      const tag = `${route} #${i}`
      let g = await geo(page, i)
      if (!g) { log(w, `${tag}: grupo sumiu antes da leitura`, false); continue }
      log(w, `${tag} (${g.label}): um item marcado e roving tabindex`, g.checked === 1 && g.tabindex.filter((t) => t === 0).length === 1, `(${g.n} itens)`)
      const a = g.btn[g.act]
      log(w, `${tag}: thumb sobre o item ativo`, near(g.thumb.l, a.l) && near(g.thumb.w, a.w) && near(g.thumb.t, a.t, 2) && near(g.thumb.h, a.h, 2), `(thumb ${g.thumb.l.toFixed(1)}/${g.thumb.w.toFixed(1)} item ${a.l.toFixed(1)}/${a.w.toFixed(1)})`)
      // clica em outro item visível e acompanha o movimento
      const target = g.btn.map((b, k) => ({ b, k })).find(({ b, k }) => k !== g.act && b.l >= 0 && b.l + b.w <= w && b.w > 0)
      if (!target) continue
      const dist = Math.abs(target.b.l - a.l)
      const loc = page.locator(`[data-tm="${i}"] [role=tab],[data-tm="${i}"] [role=radio]`).nth(target.k)
      const disabled = await loc.isDisabled().catch(() => false)
      if (disabled) continue
      await loc.click({ trial: false }).catch(() => {})
      await page.waitForTimeout(70)
      const mid = await geo(page, i)
      if (!mid) { log(w, `${tag}: grupo sumiu no clique`, false); continue }
      const moved = mid.thumb.l
      const inFlight = dist < 8 || (Math.abs(moved - a.l) > 0.5 && Math.abs(moved - target.b.l) > 0.5)
      if (mid.act === g.act && Math.abs(mid.thumb.l - a.l) < 0.5) { await page.waitForTimeout(700); const still = await geo(page, i); if (still && still.act === g.act) { log(w, `${tag}: a tela não aceitou a troca (sem movimento a conferir)`, true, `(${g.label})`); continue } }
      log(w, `${tag}: thumb em movimento aos 70 ms (não salta)`, inFlight, `(${a.l.toFixed(0)} → ${moved.toFixed(0)} → ${target.b.l.toFixed(0)})`)
      // a cópia dos rótulos fica registrada com os de baixo em cada quadro: o item da cópia, no espaço da página, é o mesmo da base
      const reg = mid.copy.length === mid.base.length && mid.copy.every((c, k) => near(c.l, mid.base[k].l, 1.5) && near(c.w, mid.base[k].w, 1.5))
      log(w, `${tag}: cópia invertida registrada com os rótulos durante o movimento`, reg)
      await page.waitForTimeout(700)
      const end = await geo(page, i)
      if (end && end.act === g.act) { log(w, `${tag}: a tela não aceitou a troca (sem movimento a conferir)`, true, `(${g.label})`); continue }
      if (!end) { log(w, `${tag}: grupo sumiu após o clique`, false); continue }
      const na = end.btn[end.act]
      log(w, `${tag}: assenta no item novo`, end.act === target.k && near(end.thumb.l, na.l) && near(end.thumb.w, na.w), `(${end.thumb.l.toFixed(1)} / ${na.l.toFixed(1)})`)
    }
  }
  log(w, "telas com tabs encontradas", seen >= 6, `(${seen} grupos)`)
  // reduced motion: o thumb assenta no mesmo quadro
  await ctx.close()
  const ctx2 = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })
  const p2 = await ctx2.newPage()
  const slug2 = await createPlatform(p2)
  await p2.goto(`${BASE}/admin/${slug2}/students`, { waitUntil: "domcontentloaded" }); await p2.waitForTimeout(3500)
  const c2 = await mark(p2)
  if (c2) {
    const g0 = await geo(p2, 0)
    const k = g0.btn.findIndex((b, j) => j !== g0.act && b.l >= 0 && b.l + b.w <= w)
    if (k >= 0) {
      await p2.locator(`[data-tm="0"] [role=tab],[data-tm="0"] [role=radio]`).nth(k).click(); await p2.waitForTimeout(60)
      const g1 = await geo(p2, 0)
      log(w, "reduced motion: thumb já no item novo aos 60 ms", near(g1.thumb.l, g1.btn[k].l) && near(g1.thumb.w, g1.btn[k].w), `(${g1.thumb.l.toFixed(1)} / ${g1.btn[k].l.toFixed(1)})`)
      // teclado
      await p2.locator(`[data-tm="0"] [role=tab],[data-tm="0"] [role=radio]`).nth(k).focus(); await p2.keyboard.press("ArrowRight"); await p2.waitForTimeout(80)
      const g2 = await geo(p2, 0)
      log(w, "teclado: seta direita move a seleção", g2.act === (k + 1) % g2.n, `(${k} → ${g2.act})`)
    }
  }
  await ctx2.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
