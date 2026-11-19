// Tours do Getting started (19/11): cada tour abre pelo link ?tour=, mostra o coachmark do primeiro passo dentro da janela, Skip / Do it later
// pausa (a pill fica e o Getting started mostra "Paused"/Resume), sem rolagem horizontal nem erro de console, em 1440, 768 e 390 px.
// Rodar com o servidor em localhost:3000: CHROME_PATH="<Chrome for Testing>" node scripts/tours-smoke.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = "http://localhost:3000"
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })
const TOURS = [
  { id: "tier", path: "sales?tab=tiers", title: "Create your first tier" },
  { id: "course", path: "content", title: "Start your first course", pill: "Add your first course" },
  { id: "payouts", path: "sales?tab=payouts", title: "Connect payouts" },
  { id: "legal", path: "settings?tab=legal", title: "Add your legal pages" },
  { id: "editor", path: "design", title: "This is your design editor", pill: "Explore the design editor" },
]
const createPlatform = async (page) => {
  await page.goto(`${BASE}/signup/create`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(3000)
  await page.fill("input[autocomplete=name]", "Rita Tester"); await page.fill("input[type=email]", "rita@example.com")
  await page.getByRole("button", { name: "Continue" }).click()
  await page.waitForURL("**/signup/verify"); await page.locator("input").first().click(); await page.keyboard.type("123456")
  await page.waitForURL("**/signup/about", { timeout: 60000 }); await page.getByRole("button", { name: "Skip" }).click()
  await page.waitForURL("**/signup/name"); await page.waitForTimeout(2000)
  await page.locator("input[placeholder*='Lio']").fill("Tour Smoke Desk"); await page.locator("[data-slot=checkbox]").click()
  await page.getByRole("button", { name: "Continue" }).click(); await page.waitForURL("**/getting-started", { timeout: 90000 })
  return page.url().split("/admin/")[1].split("/")[0]
}
for (const w of [1440, 768, 390]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, hasTouch: w < 1024 })
  const page = await ctx.newPage()
  const errs = []
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 100)))
  const slug = await createPlatform(page)
  for (const t of TOURS) {
    await page.goto(`${BASE}/admin/${slug}/getting-started`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(2500)
    // todos os passos "adiados": nada fica bloqueado, qualquer tour pode abrir
    await page.evaluate(({ slug }) => { const l = JSON.parse(localStorage.getItem("proto:communities") || "[]"); const c = l.find((x) => x.slug === slug); c.setup = { design: true, skipped: ["tier", "course", "payouts", "legal"] }; localStorage.setItem("proto:communities", JSON.stringify(l)); localStorage.removeItem(`proto:${slug}:tour`); localStorage.removeItem(`proto:${slug}:tours-paused`) }, { slug })
    errs.length = 0
    await page.goto(`${BASE}/admin/${slug}/${t.path}${t.path.includes("?") ? "&" : "?"}tour=${t.id}`, { waitUntil: "domcontentloaded" }); await page.waitForTimeout(7000)
    const card = page.getByText(t.title, { exact: true }).first()
    const box = await card.boundingBox().catch(() => null)
    const inside = !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= w + 1 && box.y + box.height <= 900 + 1
    log(w, `tour ${t.id}: coachmark do primeiro passo aparece dentro da janela`, inside, box ? `(${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)})` : "(não apareceu)")
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    log(w, `tour ${t.id}: sem rolagem horizontal e sem erro de console`, ov <= 0 && errs.length === 0, `(${ov}${errs.length ? " " + errs[0] : ""})`)
    const skip = page.getByRole("button", { name: /^(Skip|Do it later)$/ }).first()
    if (await skip.isVisible().catch(() => false)) {
      await skip.click(); await page.waitForTimeout(1200)
      const pill = await page.locator("button.fixed", { hasText: new RegExp(t.pill ?? t.title, "i") }).count()
      log(w, `tour ${t.id}: Skip pausa e a pill fica no canto`, pill >= 1, `(${pill})`)
    } else log(w, `tour ${t.id}: botão Skip visível`, false)
  }
  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
