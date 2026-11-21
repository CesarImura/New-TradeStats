// Rodar com o servidor em localhost:3000. Se o Playwright não achar o Chrome: CHROME_PATH="<caminho do Chrome for Testing>" node scripts/forms-rule.mjs <grupo>
// Teste da regra de formulários (19/11): o botão principal só ativa quando tudo o que é obrigatório é válido.
// Uso: node forms-rule.mjs <grupo>   (onb | coupons | partners | legal | invite | ranking | student)
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")

const BASE = "http://localhost:3000"
const widths = [1440, 768, 390]
const group = process.argv[2] ?? "onb"
const out = []
const log = (w, name, ok, extra = "") => out.push(`${ok ? "OK  " : "FAIL"} ${w} ${name} ${extra}`)

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? undefined })

const dis = async (loc) => (await loc.count()) ? await loc.first().isDisabled() : "missing"
const seed = async (page) => {
  await page.addInitScript(() => {
    try {
      if (!localStorage.getItem("proto:account")) localStorage.setItem("proto:account", JSON.stringify({ name: "Rita Tester", email: "rita@example.com", approved: false, verified: true, mode: "create" }))
    } catch {}
  })
}

for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })
  const page = await ctx.newPage()
  await seed(page)
  const admin = async (path) => { await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" }); await page.waitForSelector("main", { timeout: 60000 }); await page.waitForTimeout(800) }

  if (group === "onb") {
    await page.goto(`${BASE}/signup`); await page.waitForSelector("input[type=email]")
    const send = page.getByRole("button", { name: "Send code" })
    log(w, "login empty disabled", (await dis(send)) === true)
    await page.fill("input[type=email]", "abc"); await page.press("input[type=email]", "Tab")
    log(w, "login bad mail disabled+error", (await dis(send)) === true && (await page.getByText("doesn't look right").count()) === 1)
    await page.fill("input[type=email]", "a@b.co")
    log(w, "login valid enabled", (await dis(send)) === false)

    await page.goto(`${BASE}/signup/create`); await page.waitForSelector("input[autocomplete=name]")
    const cont = page.getByRole("button", { name: "Continue" })
    await page.fill("input[autocomplete=name]", ""); await page.fill("input[type=email]", "")
    log(w, "create empty disabled", (await dis(cont)) === true)
    await page.fill("input[autocomplete=name]", "Rita")
    log(w, "create name only disabled", (await dis(cont)) === true)
    await page.fill("input[type=email]", "x@"); await page.press("input[type=email]", "Tab")
    log(w, "create bad mail disabled+error", (await dis(cont)) === true && (await page.getByText("doesn't look right").count()) === 1)
    await page.fill("input[type=email]", "x@y.io")
    log(w, "create valid enabled", (await dis(cont)) === false)
    await page.fill("input[autocomplete=name]", "   ")
    log(w, "create blank name disabled", (await dis(cont)) === true)

    await page.goto(`${BASE}/signup/about`); await page.waitForSelector("[role=radio]")
    // limpa respostas guardadas
    for (const c of await page.locator("[role=radio][aria-checked=true],[role=checkbox][aria-checked=true]").all()) await c.click()
    const ac = page.getByRole("button", { name: "Continue" }), sk = page.getByRole("button", { name: "Skip" })
    log(w, "about none: continue disabled, skip enabled", (await dis(ac)) === true && (await dis(sk)) === false)
    await page.locator("[role=radio]").nth(1).click()
    log(w, "about one answer enabled", (await dis(ac)) === false)
    await page.locator("[role=radio]").nth(1).click()
    log(w, "about unselect disabled again", (await dis(ac)) === true)

    await page.goto(`${BASE}/signup/name`); await page.waitForSelector("input[placeholder*='Lio']")
    const nc = page.getByRole("button", { name: "Continue" })
    const name = page.locator("input[placeholder*='Lio']"), call = page.locator("input[placeholder*='First name']")
    log(w, "name start disabled", (await dis(nc)) === true)
    await name.fill("L"); await name.press("Tab")
    log(w, "name 1 char disabled+error", (await dis(nc)) === true && (await page.getByText("at least 2").count()) === 1)
    await name.fill("Lio Floor")
    log(w, "name ok, terms off disabled", (await dis(nc)) === true)
    await page.locator("[data-slot=checkbox]").click()
    log(w, "terms on enabled", (await dis(nc)) === false)
    await call.fill("")
    log(w, "call cleared disabled", (await dis(nc)) === true)
    await call.fill("Lio")
    log(w, "call ok enabled", (await dis(nc)) === false)
    await page.locator("[data-slot=checkbox]").click()
    log(w, "terms off again disabled", (await dis(nc)) === true)
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    log(w, "no horizontal scroll", ov <= 0, `(${ov})`)
  }

  if (group === "ranking") {
    await admin("/admin/northline/ranking")
    await page.getByRole("button", { name: "New competition" }).first().click()
    const create = page.getByRole("button", { name: "Create competition" })
    await create.waitFor()
    log(w, "competition empty disabled", (await dis(create)) === true)
    await page.fill("input[placeholder='November discipline cup']", "Spring cup")
    log(w, "competition named enabled", (await dis(create)) === false)
    await page.locator("input[type=date]").nth(1).fill("2020-01-01")
    log(w, "end before start disabled+error", (await dis(create)) === true && (await page.getByText("can't end before").count()) === 1)
    await page.locator("input[type=date]").nth(1).fill("2025-11-30")
    log(w, "dates fixed enabled", (await dis(create)) === false)
    await page.fill("input[placeholder='November discipline cup']", "  ")
    log(w, "blank name disabled", (await dis(create)) === true)
  }

  if (group === "coupons") {
    await admin("/admin/northline/sales?tab=coupons")
    await page.getByRole("button", { name: /New coupon/ }).first().click()
    const create = page.getByRole("button", { name: "Create coupon" })
    await create.waitFor()
    log(w, "coupon empty disabled, no error", (await dis(create)) === true && (await page.locator(".text-a-danger").count()) === 0)
    await page.fill("input[placeholder='AUTUMN20']", "SPRING20")
    log(w, "coupon code ok (20% default) enabled", (await dis(create)) === false)
    await page.fill("input[aria-label='Discount']", "150")
    log(w, "150% disabled+error", (await dis(create)) === true && (await page.getByText("100% is the most").count()) === 1)
    await page.fill("input[aria-label='Discount']", "")
    log(w, "empty amount disabled, no error", (await dis(create)) === true && (await page.getByText("Enter a discount").count()) === 0)
    await page.fill("input[aria-label='Discount']", "25")
    log(w, "25 enabled", (await dis(create)) === false)
  }

  if (group === "partners") {
    await admin("/admin/northline/partners")
    await page.getByRole("button", { name: "Add my own link" }).first().click()
    const add = page.getByRole("button", { name: "Add", exact: true })
    await add.waitFor()
    log(w, "offer empty disabled, no error", (await dis(add)) === true && (await page.locator(".text-a-danger").count()) === 0)
    await page.fill("input[placeholder='Tradeify']", "Acme")
    await page.fill("input[placeholder='20% off the first month']", "10% off")
    log(w, "offer name+offer, no link disabled", (await dis(add)) === true)
    await page.fill("input[placeholder='https://']", "acme")
    log(w, "bad link disabled+error", (await dis(add)) === true && (await page.getByText("full link").count()) === 1)
    await page.fill("input[placeholder='https://']", "https://acme.io")
    log(w, "valid enabled", (await dis(add)) === false)
  }

  if (group === "legal") {
    await admin("/admin/northline/settings?tab=legal")
    const row = page.getByRole("button", { name: /^(Set up|Edit|Open|View)$/ })
    await page.getByRole("button").filter({ hasText: /^(Set up|Edit)$/ }).first().click().catch(() => {})
    await page.waitForTimeout(600)
    const save = page.getByRole("button", { name: /^(Save|Use this text)$/ })
    log(w, "legal drawer opened", (await save.count()) > 0)
    if ((await save.count()) > 0) {
      const name = page.locator("[data-tour=legal-imprint] input").first()
      if ((await name.count()) > 0) {
        await name.fill(""); await page.locator("[data-tour=legal-imprint] textarea").fill(""); await page.locator("[data-tour=legal-imprint] input[type=email]").fill("")
        log(w, "imprint empty disabled, no error", (await dis(save)) === true && (await page.locator(".text-a-danger").count()) === 0)
        await name.fill("Acme GmbH"); await page.locator("[data-tour=legal-imprint] textarea").fill("Hauptstrasse 5, 10115 Berlin")
        await page.locator("[data-tour=legal-imprint] input[type=email]").fill("x@")
        log(w, "imprint bad mail disabled+error", (await dis(save)) === true && (await page.getByText("Check the e-mail").count()) === 1)
        await page.locator("[data-tour=legal-imprint] input[type=email]").fill("hello@acme.io")
        log(w, "imprint valid enabled", (await dis(save)) === false)
      } else {
        const ta = page.locator("textarea").first()
        const before = await dis(save)
        await ta.fill(""); log(w, "text empty disabled", (await dis(save)) === true)
        await ta.fill("Some terms."); log(w, "text filled enabled", (await dis(save)) === false)
      }
    }
  }

  if (group === "invite") {
    await admin("/admin/northline/settings?tab=team")
    await page.getByRole("button", { name: /Invite/ }).first().click()
    const send = page.getByRole("button", { name: "Send invite" })
    await send.waitFor()
    const em = page.locator("input[placeholder='rui@gmail.com']")
    log(w, "invite empty disabled", (await dis(send)) === true)
    await em.fill("rui@"); log(w, "invite 'rui@' disabled", (await dis(send)) === true)
    await em.fill("rui@x"); log(w, "invite 'rui@x' disabled (no dot)", (await dis(send)) === true)
    await em.fill("rui@gmail.com"); log(w, "invite valid enabled", (await dis(send)) === false)
  }

  if (group === "partners-edit") {
    await admin("/admin/northline/partners")
    const first = page.locator("main").getByRole("button", { name: /Edit|Manage|Settings/ }).first()
    log(w, "edit opener present", (await first.count()) > 0)
    if ((await first.count()) > 0) {
      await first.click()
      const save = page.getByRole("button", { name: "Save", exact: true }).last()
      await save.waitFor()
      log(w, "edit unchanged disabled", (await dis(save)) === true)
      await page.locator("input[placeholder='20% off the first month']").fill("Changed offer")
      log(w, "edit changed enabled", (await dis(save)) === false)
    }
  }

  if (group === "student") {
    await page.goto(`${BASE}/site/northline/start`, { waitUntil: "domcontentloaded" }); await page.waitForSelector("main, h1", { timeout: 60000 }); await page.waitForTimeout(1000)
    const cont = page.getByRole("button", { name: /^Continue|Go to/ }).first()
    log(w, "welcome step: continue enabled", (await dis(cont)) === false)
    await cont.click(); await page.waitForTimeout(500)
    const label = await page.locator("h1").first().textContent()
    const cont2 = page.getByRole("button", { name: /^Continue|Go to/ }).first()
    const skip = page.getByRole("button", { name: "Skip" })
    const nick = page.locator("#st-nick")
    if ((await nick.count()) > 0) await nick.fill("")
    for (const c of await page.locator("[role=radio][aria-checked=true],[role=checkbox][aria-checked=true],button[aria-pressed=true]").all()) await c.click()
    log(w, `step '${label}': empty -> continue disabled, skip enabled`, (await dis(cont2)) === true && (await dis(skip)) === false)
    if ((await nick.count()) > 0) { await nick.fill("alex"); log(w, "profile nickname -> continue enabled", (await dis(cont2)) === false); await nick.fill(""); log(w, "profile cleared -> disabled", (await dis(cont2)) === true) }
  }

  await ctx.close()
}
await browser.close()
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} ok, ${out.filter((l) => l.startsWith("FAIL")).length} fail`)
