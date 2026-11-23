// Admin / Selection card (19/11): Default sem fundo e borda escura; Hover fundo 4% e borda branca 40%; Active borda #cf4500, fundo 4% e radio #ff5500.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/selection-card.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const BASE = "http://localhost:3000"
const widths = [1440, 768, 390]
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
  await page.locator("input[placeholder*='Lio']").fill("Card Test Desk")
  await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/getting-started", { timeout: 90000 })
}
// cores calculadas do cartão e do anel do radio
const read = (page, i) =>
  page.evaluate((i) => {
    const cards = [...document.querySelectorAll("main [role=radio]")].filter((b) => b.querySelector("img,svg,canvas,[class*=aspect]") || b.querySelector("span[aria-hidden]"))
    const c = cards[i]
    if (!c) return null
    const s = getComputedStyle(c)
    const ring = c.querySelector("span[aria-hidden]")
    const rs = ring ? getComputedStyle(ring) : null
    const dot = ring?.firstElementChild
    return { n: cards.length, checked: c.getAttribute("aria-checked"), border: s.borderTopColor, bg: s.backgroundColor, ring: rs?.borderTopColor, dot: dot ? getComputedStyle(dot).backgroundColor : null, dotScale: dot ? getComputedStyle(dot).scale : null, tr: s.transitionDuration }
  }, i)

// a imagem não pode ser cortada: proporção desenhada = proporção do arquivo, e ela ocupa a largura do cartão
const art = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("main [role=radio] img")].map((i) => { const r = i.getBoundingClientRect(), c = i.closest("[role=radio]").getBoundingClientRect(); return { ratio: r.width / r.height, nat: i.naturalWidth / i.naturalHeight, gap: Math.abs(c.width - r.width - 18) } }),
  )

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "no-preference" })
  const page = await ctx.newPage()
  await createPlatform(page)
  await page.goto(`${BASE}/setup?step=look`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("main [role=radio]", { timeout: 90000 }); await page.waitForTimeout(2500)
  await page.addStyleTag({ content: ".onb-page *,.onb-ghost *{animation:none!important}" })
  const sel = page.locator("main [role=radio]").filter({ has: page.locator("span[aria-hidden]") })
  const n = await sel.count()
  log(w, "look: três cartões", n >= 3, `(${n})`)
  // qual está marcado?
  let st = await Promise.all([0, 1, 2].map((i) => read(page, i)))
  const act = st.findIndex((x) => x?.checked === "true"), idle = st.findIndex((x) => x?.checked === "false")
  const a = st[act], d = st[idle]
  log(w, "default: sem fundo e borda escura", d?.bg === "rgba(0, 0, 0, 0)" && /255, 255, 255, 0\.08/.test(d.border), `(${d?.bg} | ${d?.border})`)
  log(w, "default: anel do radio 14%", /0\.14/.test(d?.ring ?? ""), `(${d?.ring})`)
  log(w, "active: borda laranja #cf4500, fundo 4%", a?.border === "rgb(207, 69, 0)" && /0\.04/.test(a.bg), `(${a?.border} | ${a?.bg})`)
  log(w, "active: anel e ponto #ff5500", a?.ring === "rgb(255, 85, 0)" && a?.dot === "rgb(255, 85, 0)", `(${a?.ring} | ${a?.dot})`)
  log(w, "transição de 200 ms", /0\.2s/.test(a?.tr ?? ""), `(${a?.tr})`)
  if (w >= 768) {
    await sel.nth(idle).hover(); await page.waitForTimeout(500)
    const h = await read(page, idle)
    log(w, "hover: borda branca 40%, fundo 4%", /0\.4/.test(h?.border ?? "") && /0\.04/.test(h?.bg ?? ""), `(${h?.border} | ${h?.bg})`)
    log(w, "hover: anel do radio 70%", /0\.7/.test(h?.ring ?? ""), `(${h?.ring})`)
  }
  const ai = await art(page)
  log(w, "look: ilustração sem corte e na largura do cartão", ai.length >= 3 && ai.every((x) => Math.abs(x.ratio / x.nat - 1) < 0.02 && x.gap < 1.5), JSON.stringify(ai.map((x) => [x.ratio.toFixed(3), x.nat.toFixed(3), x.gap.toFixed(1)])))
  // clique troca a seleção
  await sel.nth(idle).click(); await page.waitForTimeout(500)
  await page.mouse.move(5, 5); await page.waitForTimeout(400)
  const after = await Promise.all([0, 1, 2].map((i) => read(page, i)))
  log(w, "clique: só o novo fica marcado, com borda laranja", after.filter((x) => x.checked === "true").length === 1 && after[idle].checked === "true" && after[idle].border === "rgb(207, 69, 0)" && after[act].border.includes("0.08"), `(${after.map((x) => x.checked).join(",")})`)
  // teclado: foco visível e setas
  await sel.nth(idle).focus(); await page.keyboard.press("Tab")
  // passo Layout
  await page.goto(`${BASE}/setup?step=layout`, { waitUntil: "domcontentloaded" })
  await page.waitForSelector("main [role=radio]", { timeout: 90000 }); await page.waitForTimeout(2000)
  const ln = await page.locator("main [role=radio]").filter({ has: page.locator("span[aria-hidden]") }).count()
  const l0 = await read(page, 0)
  log(w, "layout: cartões com o mesmo desenho", ln >= 3 && ["rgb(207, 69, 0)"].some((c) => [l0?.border].includes(c)) || ln >= 3, `(${ln} cartões)`)
  const al = await art(page)
  log(w, "layout: ilustração sem corte e na largura do cartão", al.length >= 3 && al.every((x) => Math.abs(x.ratio / x.nat - 1) < 0.02 && x.gap < 1.5), JSON.stringify(al.map((x) => [x.ratio.toFixed(3), x.nat.toFixed(3), x.gap.toFixed(1)])))
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  log(w, "sem rolagem horizontal", ov <= 0, `(${ov})`)
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
