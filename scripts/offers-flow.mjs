// Offers (high ticket): ofertas, links de checkout, pagina publica, estados e cenarios. Rodar com o servidor em localhost:3000:
// CHROME_PATH="<Chrome for Testing>" node scripts/offers-flow.mjs
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const BASE = "http://localhost:3000"
const out = []
const ok = (name, pass, extra = "") => out.push(`${pass ? "OK  " : "FAIL"} ${name} ${extra}`)
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH })
const fresh = async (w = 1280) => {
  const ctx = await b.newContext({ viewport: { width: w, height: 1000 } })
  const p = await ctx.newPage()
  p.errs = []
  p.on("pageerror", (e) => p.errs.push(e.message.slice(0, 140)))
  return { ctx, p }
}
const go = async (p, path, wait = 4500) => { await p.goto(BASE + path); await p.waitForTimeout(wait) }
const store = (p, key) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key)

// 1. every tab loads without errors
{
  const { ctx, p } = await fresh()
  for (const tab of ["overview", "tiers", "offers", "groups", "access", "page", "coupons", "transactions", "payouts"]) {
    await go(p, `/admin/kairo/sales?tab=${tab}`, 3500)
    ok(`tab ${tab} abre sem erro`, p.errs.length === 0 && (await p.locator("h1").first().textContent()) === "Sales & payments", p.errs.join(";"))
  }
  await ctx.close()
}

// 2. offers admin
{
  const { ctx, p } = await fresh()
  await go(p, "/admin/kairo/sales?tab=offers")
  ok("3 cards de offer", (await p.locator("h3:has-text('Coaching')").count()) === 3)
  ok("Most sold so no Gold", (await p.locator("text=Most sold").count()) === 1)
  ok("filtros com contagem", (await p.locator("[role=tab]", { hasText: /All links/ }).first().textContent()).includes("14"))
  // filters
  await p.locator("[role=tab]", { hasText: /^Paid/ }).first().click(); await p.waitForTimeout(300)
  ok("filtro Paid mostra 7", (await p.locator("tbody tr").count()) === 7, String(await p.locator("tbody tr").count()))
  await p.locator("[role=tab]", { hasText: /Expired/ }).first().click(); await p.waitForTimeout(300)
  ok("filtro Expired mostra 2 com New link", (await p.locator("tbody tr").count()) === 2 && (await p.getByRole("button", { name: /New link/ }).count()) === 2)
  await p.locator("[role=tab]", { hasText: /All links/ }).first().click()
  await p.getByLabel("Search name or e-mail").fill("zzzz"); await p.waitForTimeout(300)
  ok("busca sem resultado", (await p.locator("text=No links match").count()) === 1)
  await p.getByLabel("Search name or e-mail").fill("marco"); await p.waitForTimeout(300)
  ok("busca por nome", (await p.locator("tbody tr").count()) === 1)
  await p.getByLabel("Search name or e-mail").fill("")

  // new offer: validation
  await p.getByRole("button", { name: "New offer" }).first().click(); await p.waitForTimeout(600)
  const save = p.getByRole("button", { name: "Save offer" })
  ok("Save offer desabilitado vazio", await save.isDisabled())
  await p.locator("[role=dialog] input").first().fill("Coaching Gold"); await p.getByLabel("Total price").fill("5000"); await p.waitForTimeout(200)
  ok("nome repetido bloqueia", await save.isDisabled() && (await p.locator("text=already have an offer").count()) === 1)
  await p.locator("[role=dialog] input").first().fill("Mentoring 12 weeks"); await p.waitForTimeout(200)
  ok("valido habilita Save", await save.isEnabled())
  ok("planos iniciais com preco", (await p.locator("text=Pay in full").count()) >= 1 && (await p.locator("text=4 payments").count()) >= 1)
  // plan builder: add a plan, break the sum, see the error, fix with Equal payments
  await p.getByRole("button", { name: "Add plan" }).click(); await p.waitForTimeout(300)
  ok("Add plan abre o card do plano", (await p.getByRole("textbox", { name: "Amount, instalment 1" }).count()) === 1)
  await p.getByRole("textbox", { name: "Amount, instalment 1" }).fill("1000"); await p.waitForTimeout(200)
  ok("soma errada bloqueia Save e mostra falta", await save.isDisabled() && (await p.locator("text=Every plan has to add up").count()) === 1 && (await p.locator("text=left").count()) >= 1)
  await p.getByRole("button", { name: "Equal payments" }).click(); await p.waitForTimeout(200)
  ok("Equal payments corrige e habilita Save", await save.isEnabled())
  await p.getByRole("button", { name: "Add instalment" }).click(); await p.waitForTimeout(200)
  ok("instalment extra com resto 0 mantem erro de soma", (await p.getByRole("textbox", { name: "Amount, instalment 3" }).count()) === 1)
  await p.getByRole("button", { name: "Remove instalment 3" }).click(); await p.waitForTimeout(200)
  ok("remover instalment volta a somar", await save.isEnabled())
  await p.getByRole("button", { name: "Remove plan" }).click(); await p.waitForTimeout(200)
  await p.getByLabel("Total price").fill("6000"); await p.waitForTimeout(200)
  ok("planos iguais seguem o preco (6 000)", (await p.locator("text=€1,500 each").count()) >= 1)
  await save.click(); await p.waitForTimeout(600)
  ok("offer criada (4 cards)", (await p.locator("h3:has-text('Mentoring')").count()) === 1)
  const offers = await store(p, "proto:kairo:offers")
  const mo = offers?.find((o) => o.name === "Mentoring 12 weeks")
  ok("persistida com 2 planos (1 e 4 pagamentos) somando o preco", mo?.plans?.map((x) => x.payments.length).join() === "1,4" && mo.plans.every((x) => x.payments.reduce((a, b) => a + b, 0) === 6000), JSON.stringify(mo?.plans))
  await p.reload(); await p.waitForTimeout(4000)
  ok("persiste ao recarregar", (await p.locator("h3:has-text('Mentoring')").count()) === 1)

  // send link modal: price rules
  await p.locator("section", { has: p.locator("h3:has-text('Coaching Silver')") }).getByRole("button", { name: "Send link" }).first().click(); await p.waitForTimeout(600)
  ok("Silver: preco fixo (campo desabilitado)", await p.getByLabel("Price for this client").isDisabled())
  await p.getByRole("button", { name: "Cancel" }).click(); await p.waitForTimeout(400)
  await p.locator("section", { has: p.locator("h3:has-text('Coaching Gold')") }).getByRole("button", { name: "Send link" }).first().click(); await p.waitForTimeout(600)
  const price = p.getByLabel("Price for this client")
  ok("Gold: preco editavel", await price.isEnabled())
  await price.fill("0"); await p.waitForTimeout(200)
  ok("preco 0 bloqueia", await p.getByRole("button", { name: /Create and copy link/ }).isDisabled())
  await price.fill("5500")
  await p.getByLabel("Client e-mail").fill("not-an-email"); await p.waitForTimeout(200)
  ok("e-mail invalido bloqueia", await p.getByRole("button", { name: /Create and copy link/ }).isDisabled())
  await p.getByLabel("Client e-mail").fill("ana.test@example.com")
  await p.getByRole("radio", { name: "Deposit + 3 months" }).click()
  await p.getByRole("radio", { name: "In 30 days" }).click(); await p.waitForTimeout(200)
  ok("resumo das parcelas aparece (entrada escalada)", (await p.locator("text=First payment €2,750").count()) === 1, await p.locator("text=First payment").first().textContent().catch(() => ""))
  await p.getByRole("button", { name: /Create and copy link/ }).click(); await p.waitForTimeout(700)
  const links = await store(p, "proto:kairo:offerLinks")
  const mine = links?.find((l) => l.email === "ana.test@example.com")
  ok("link criado com preco 5500 e plano entrada+3 somando 5500", mine?.price === 5500 && mine?.plan?.payments?.length === 4 && mine.plan.payments[0] === 2750 && Math.abs(mine.plan.payments.reduce((a, b) => a + b, 0) - 5500) < 0.01, JSON.stringify(mine?.plan))
  ok("expira em 30 dias (2025-12-12)", mine?.expires === "2025-12-12", mine?.expires)
  ok("link na tabela como Not opened", (await p.locator("tbody tr").first().textContent()).includes("Not opened"))

  // public page of that link
  const pg = await ctx.newPage(); pg.errs = []; pg.on("pageerror", (e) => pg.errs.push(e.message.slice(0, 140)))
  await go(pg, `/site/kairo/offer/${mine.id}`)
  ok("pagina publica abre", (await pg.locator("h1").textContent()).includes("Your offer from"), pg.errs.join(";"))
  ok("e-mail travado pelo link", await pg.locator("#of-email").evaluate((e) => e.readOnly))
  const pay = pg.getByRole("button", { name: /^Pay €/ })
  ok("Pay desabilitado sem nome", await pay.isDisabled())
  ok("total mostra €5,500 e hoje €2,750", (await pg.locator("body").textContent()).includes("€5,500") && (await pg.locator("body").textContent()).includes("€2,750"))
  ok("sem checkbox de consentimento", (await pg.getByRole("checkbox").count()) === 0)
  await pg.locator("#of-name").fill("Ana Test"); await pg.waitForTimeout(200)
  ok("com nome habilita", await pay.isEnabled())
  await pay.click(); await pg.waitForTimeout(2500)
  ok("pagar leva a /account", pg.url().endsWith("/site/kairo/account"), pg.url())
  const after = (await store(pg, "proto:kairo:offerLinks"))?.find((l) => l.id === mine.id)
  ok("link marcado paid e nome salvo", !!after?.paidAt && after?.name === "Ana Test")
  const purchase = await store(pg, "proto:kairo:purchase")
  ok("compra grava o tier da offer", purchase?.tier === "vip" && purchase?.total === 2750, JSON.stringify(purchase))
  await go(pg, `/site/kairo/offer/${mine.id}`, 3500)
  ok("reabrir mostra ja usado", (await pg.locator("h1").textContent()) === "This link was already used")
  await p.reload(); await p.waitForTimeout(4000)
  ok("admin mostra Paid para Ana", (await p.locator("tr", { hasText: "ana.test" }).count()) + (await p.locator("tr", { hasText: "Ana Test" }).count()) >= 1 && (await p.locator("tr", { hasText: "Ana Test" }).first().textContent()).includes("Paid"))

  // pay in full needs no consent
  const full = { ...links[0], id: "full-test01", plan: { id: "full", payments: [6000] }, price: 6000, email: undefined, name: undefined, paidAt: undefined, openedAt: undefined, expires: "2025-12-01", sentAt: "2025-11-12T10:23" }
  await pg.evaluate((l) => { const k = "proto:kairo:offerLinks"; const c = JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify([l, ...c])) }, full)
  await go(pg, "/site/kairo/offer/full-test01", 3500)
  ok("link sem e-mail: campo editavel", !(await pg.locator("#of-email").evaluate((e) => e.readOnly)))
  await pg.locator("#of-email").fill("x@y.co"); await pg.locator("#of-name").fill("Xavier Y")
  ok("pay in full: sem checkbox, habilita", (await pg.getByRole("checkbox").count()) === 0 && (await pg.getByRole("button", { name: /^Pay €/ }).isEnabled()))
  // opened recorded
  const op = (await store(pg, "proto:kairo:offerLinks")).find((l) => l.id === "full-test01")
  ok("abrir o link registra Opened", !!op.openedAt)
  // expired + unknown
  await go(pg, "/site/kairo/offer/gold-el5w1z", 3000)
  ok("expirado", (await pg.locator("h1").textContent()) === "This link has expired")
  await go(pg, "/site/kairo/offer/nope", 3000)
  ok("inexistente", (await pg.locator("h1").textContent()) === "This link doesn't work")

  // delete an offer + undo, then delete all => empty state
  await go(p, "/admin/kairo/sales?tab=offers")
  await p.getByRole("button", { name: "Actions for Mentoring 12 weeks" }).click(); await p.getByRole("menuitem", { name: "Delete" }).click(); await p.waitForTimeout(500)
  ok("delete remove card", (await p.locator("h3:has-text('Mentoring')").count()) === 0)
  await p.getByRole("button", { name: "Undo" }).click({ timeout: 3000 }).catch(() => {}); await p.waitForTimeout(500)
  ok("Undo devolve", (await p.locator("h3:has-text('Mentoring')").count()) === 1)
  for (const n of ["Mentoring 12 weeks", "Coaching Platinum", "Coaching Gold", "Coaching Silver"]) {
    await p.getByRole("button", { name: `Actions for ${n}` }).click(); await p.getByRole("menuitem", { name: "Delete" }).click(); await p.waitForTimeout(400)
  }
  ok("sem offers: estado vazio", (await p.locator("text=No offers yet").count()) === 1 && (await p.getByRole("button", { name: "Send offer link" }).count()) === 0)
  await ctx.close()
}

// 3. ⌘K params and palette
{
  const { ctx, p } = await fresh()
  await go(p, "/admin/kairo/sales?tab=offers&new=1")
  ok("?new=1 abre drawer", (await p.getByRole("button", { name: "Save offer" }).count()) === 1)
  await go(p, "/admin/kairo/sales?tab=offers&send=1")
  ok("?send=1 abre modal", (await p.locator("text=Send an offer link").count()) === 1)
  await go(p, "/admin/kairo")
  await p.keyboard.press("Control+k"); await p.waitForTimeout(500)
  await p.keyboard.type("offer"); await p.waitForTimeout(400)
  const txt = await p.locator("[role=dialog]").textContent()
  ok("busca 'offer' mostra Actions e Offers", txt.includes("Send offer link") && txt.includes("New offer") && txt.includes("Coaching Gold"), txt.slice(0, 120))
  await p.keyboard.press("Enter"); await p.waitForTimeout(3500)
  ok("Enter abre modal de link", p.url().includes("send=1") && (await p.locator("text=Send an offer link").count()) === 1, p.url())
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}

// 4. transactions, overview, payouts, partners
{
  const { ctx, p } = await fresh()
  await go(p, "/admin/kairo/sales?tab=transactions")
  await p.locator("[role=tab]", { hasText: /Instalments/ }).first().click(); await p.waitForTimeout(300)
  ok("Instalments mostra 6 linhas", (await p.locator("tbody tr").count()) === 6, String(await p.locator("tbody tr").count()))
  ok("rodape das tentativas", (await p.locator("text=retried for 2 weeks").count()) === 1)
  await go(p, "/admin/kairo/sales?tab=overview")
  ok("Overview: Revenue by source com donut e Coming up", (await p.locator("h2:text-is('Revenue by source')").count()) === 1 && (await p.locator("h2:text-is('Coming up')").count()) === 1 && (await p.locator("svg[aria-label^='Revenue by source']").count()) === 1)
  await go(p, "/admin/kairo/partners")
  ok("Partners usa Deals", (await p.locator("[role=tab]", { hasText: /Deals/ }).first().count()) === 1 && (await p.locator("text=Offers").count()) === 0)
  await go(p, "/admin/kairo/settings?tab=general")
  await p.getByLabel("Booking link").fill("ftp://bad"); await p.waitForTimeout(300)
  ok("booking invalido mostra erro", (await p.locator("text=Start with https://").count()) === 1)
  await p.getByLabel("Booking link").fill("https://calendly.com/x/y"); await p.waitForTimeout(300)
  await go(p, "/site/kairo/checkout", 5000)
  ok("checkout mostra Book a call", (await p.locator("a:text('Book a call')").count()) === 1)
  await p.evaluate(() => localStorage.setItem("proto:kairo:booking", JSON.stringify("")))
  await go(p, "/site/kairo/checkout", 5000)
  ok("vazio: some a linha", (await p.locator("a:text('Book a call')").count()) === 0)
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}


// 6. sino: link aberto e pago nesta sessao; perfil do aluno com parcela falhada
{
  const { ctx, p } = await fresh()
  await go(p, "/admin/kairo", 3500)
  await p.evaluate(() => { const k = "proto:kairo:offerLinks"; const l = { id: "bell-test01", offerId: "gold", plan: { id: "p2", payments: [3000, 3000] }, price: 6000, email: "bell@test.co", name: "Bell Test", sender: "Ana", sentAt: "2025-11-12T10:23", expires: "2025-12-01" }; localStorage.setItem(k, JSON.stringify([l])) })
  await go(p, "/site/kairo/offer/bell-test01", 4500)
  await go(p, "/admin/kairo", 4500)
  await p.getByRole("button", { name: /Notifications/ }).click(); await p.waitForTimeout(600)
  const panel = await p.locator("[data-slot=notifications-panel]").textContent()
  ok("sino mostra link aberto nesta sessao", panel.includes("Offer link opened · Bell Test"), panel.slice(0, 160))
  await go(p, "/site/kairo/offer/bell-test01", 4000)
  await p.locator("#of-name").fill("Bell Test"); await p.getByRole("button", { name: /^Pay €/ }).click(); await p.waitForTimeout(2500)
  await go(p, "/admin/kairo", 4500)
  await p.getByRole("button", { name: /Notifications/ }).click(); await p.waitForTimeout(600)
  const panel2 = await p.locator("[data-slot=notifications-panel]").textContent()
  ok("sino mostra offer paga e some o aberto", panel2.includes("Offer paid · Bell Test") && !panel2.includes("Offer link opened · Bell Test"), panel2.slice(0, 160))
  await go(p, "/admin/kairo/students", 5000)
  await p.locator("input[placeholder*='Search']").first().fill("Bellini"); await p.waitForTimeout(500)
  await p.getByText("Marco Bellini").first().click(); await p.waitForTimeout(900)
  const dlg = await p.locator("[role=dialog]").textContent()
  ok("perfil: parcela falhada e plano", dlg.includes("Instalment 3 of 4 failed · retrying Tue 25 Nov") && dlg.includes("Payment plan") && dlg.includes("Link sent by"), dlg.slice(0, 200))
  ok("perfil: Pause access disponivel", (await p.getByRole("button", { name: "Pause access" }).count()) >= 1)
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}


// 7. cenarios de erro: oferta removida, cartao recusado, banco pede confirmacao, payouts nao conectado
{
  const { ctx, p } = await fresh()
  await go(p, "/admin/kairo", 3500)
  const newLink = (id) => ({ id, offerId: "gold", plan: { id: "p4", payments: [1500, 1500, 1500, 1500] }, price: 6000, email: "err@test.co", name: "Err Test", sender: "Ana", sentAt: "2025-11-12T10:23", expires: "2025-12-01" })
  await p.evaluate((l) => localStorage.setItem("proto:kairo:offerLinks", JSON.stringify([l[0], l[1], l[2]])), [newLink("err-declined"), newLink("err-bank"), newLink("err-gone")])
  await go(p, "/site/kairo/offer/err-declined", 4500)
  await p.locator("#of-name").fill("Err Test")
  await p.getByRole("button", { name: "Card declined" }).click(); await p.getByRole("button", { name: /^Pay €/ }).click(); await p.waitForTimeout(1800)
  ok("cartao recusado: mostra erro e nao paga", (await p.locator("[role=alert]").first().textContent()).includes("declined") && p.url().includes("/offer/err-declined"))
  const l1 = (await store(p, "proto:kairo:offerLinks")).find((x) => x.id === "err-declined")
  ok("cartao recusado: link continua sem pagar", !l1.paidAt)
  ok("pode tentar de novo (Pay habilitado)", await p.getByRole("button", { name: /^Pay €/ }).isEnabled())
  await go(p, "/site/kairo/offer/err-bank", 4500)
  await p.locator("#of-name").fill("Err Test")
  await p.getByRole("button", { name: "Bank asks to confirm" }).click(); await p.getByRole("button", { name: /^Pay €/ }).click(); await p.waitForTimeout(1800)
  ok("banco pede confirmacao", (await p.locator("body").textContent()).includes("Your bank asks you to confirm"))
  await p.getByRole("button", { name: "Confirm in my bank app" }).click(); await p.waitForTimeout(2500)
  ok("confirmando no banco paga", p.url().endsWith("/site/kairo/account"), p.url())
  await p.evaluate(() => localStorage.setItem("proto:kairo:offers", JSON.stringify([])))
  await go(p, "/site/kairo/offer/err-gone", 4500)
  ok("oferta removida: tela propria", (await p.locator("h1").textContent()) === "This offer isn't available anymore")
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}
{
  const { ctx, p } = await fresh()
  await ctx.addInitScript(() => localStorage.setItem("proto:kairo:payouts-v2", JSON.stringify({ step: 0, done: false, country: "DE", kind: "person" })))
  await go(p, "/admin/kairo/sales?tab=offers", 5000)
  ok("payouts nao conectado: aviso", (await p.locator("text=Connect payouts first").count()) >= 1)
  ok("payouts nao conectado: Send offer link desabilitado", await p.getByRole("button", { name: "Send offer link" }).isDisabled())
  ok("payouts nao conectado: Send link do card desabilitado", await p.getByRole("button", { name: "Send link" }).first().isDisabled())
  await go(p, "/admin/kairo/sales?tab=offers&send=1", 5000)
  ok("payouts nao conectado: ?send=1 nao abre modal", (await p.locator("text=Send an offer link").count()) === 0)
  ok("sem erros", p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}

// 5. outra comunidade (northline) e plataforma nova
for (const slug of ["northline", "sophia"]) {
  const { ctx, p } = await fresh()
  await go(p, `/admin/${slug}/sales?tab=offers`, 5000)
  const title = await p.locator("h1").first().textContent().catch(() => "")
  ok(`${slug}: aba Offers abre`, title === "Sales & payments" && p.errs.length === 0, `${title} ${p.errs.join(";")}`)
  await go(p, `/admin/${slug}/sales?tab=overview`, 4500)
  ok(`${slug}: overview sem erro`, p.errs.length === 0, p.errs.join(";"))
  await ctx.close()
}
console.log(out.join("\n"))
console.log(`\n${out.filter((l) => l.startsWith("OK")).length} OK, ${out.filter((l) => l.startsWith("FAIL")).length} FAIL`)
await b.close()
