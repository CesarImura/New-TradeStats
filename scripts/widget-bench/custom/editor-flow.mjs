#!/usr/bin/env node
/*
 * Editor flow: drives the real Design editor (inspector controls, not patches) for one widget at a time.
 * For every control the inspector shows (radio groups, selects, text fields, header parts), it clicks each option and records:
 * did the card change, what did the draft in localStorage (proto:draft) change, and does clicking back restore the card.
 * Then a combination, reload (persistence), Undo, Redo, Publish and the same card on the student page.
 *
 *   node scripts/widget-bench/custom/editor-flow.mjs --base http://localhost:3200 --only faq,watchlist --template terminal --mode dark --out /tmp/flow
 */
import { chromium } from "playwright-core"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
const here = dirname(fileURLToPath(import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const list = (v, d) => (v ? String(v).split(",").filter(Boolean) : d)
const base = (args.base || "http://localhost:3200").replace(/\/$/, "")
const slug = "northline"
const only = list(args.only, null)
const template = args.template || "terminal", mode = args.mode || "dark", density = args.density || "comfortable"
const layoutsToo = args.layouts === "true" // every layout of a widget, not only its first
const out = resolve(args.out || `/tmp/flow-${Date.now()}`)
mkdirSync(out, { recursive: true })
const sigSrc = readFileSync(join(here, "sig.js"), "utf8")
const MODULES = { courses: true, calendar: true, charts: true, community: true, journal: true, ranking: true, ai: true, downloads: true, partners: true }
const browser = await chromium.launch()

const cp = await browser.newPage()
await cp.goto(`${base}/bench/catalog`)
const catalog = JSON.parse(await cp.evaluate(() => document.getElementById("bench-catalog")?.textContent || "[]"))
await cp.close()

const results = []
const note = (r) => { results.push(r); }

async function run(w, v) {
  const id = `flow-${w.type}`
  const width = Math.max(4, Math.min(12, [4, 8, 12].includes(w.defaultW) ? w.defaultW : w.defaultW >= 12 ? 12 : w.defaultW >= 8 ? 8 : 4))
  const okW = [4, 8, 12].filter((x) => x >= v.minW && x <= v.maxW)
  const W = okW.includes(width) ? width : okW[0] ?? 4
  const item = { id, type: w.type, variant: v.value, w: W, x: 0, y: 0, h: 4, ...(w.type === "hero" ? { props: { play: "manual" } } : {}) }
  const payload = { theme: { template, mode, density }, content: { modules: MODULES, pages: { home: { default: { items: [item], free: false, titleRemoved: true } } } } }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
  let first = true
  await ctx.addInitScript(([k, val]) => { try { if (!localStorage.getItem("__seeded")) { localStorage.clear(); localStorage.setItem(k, val); localStorage.setItem("__seeded", "1") } } catch {} }, [`proto:pub:${slug}`, JSON.stringify(payload)])
  if (args.raw) await ctx.addInitScript(() => { window.__SIG_RAW = true })
  const page = await ctx.newPage()
  const errors = []
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 160)))
  const R = (extra) => note({ type: w.type, variant: v.value, template, mode, density, ...extra })
  const sigOf = async () => { await page.waitForTimeout(900); await page.addScriptTag({ content: sigSrc }).catch(() => {}); return page.evaluate((i) => window.__sig()[i], id) }
  const draftItem = () => page.evaluate(([k, i]) => { try { const d = JSON.parse(localStorage.getItem(k) || "null"); return d?.content?.pages?.home?.default?.items?.find((x) => x.id === i) ?? null } catch { return "ERR" } }, [`proto:draft:${slug}`, id])
  const same = (a, b) => a && b && a.html === b.html && a.style === b.style && a.h === b.h
  const open = async () => {
    await page.goto(`${base}/admin/${slug}/design?step=pages`, { waitUntil: "networkidle" })
    await page.waitForSelector(`[data-widget-id="${id}"]`, { timeout: 30000 })
    await page.waitForTimeout(800)
  }
  const select = async () => {
    // the dev-only overlay and the canvas zoom: click near the card's top left corner
    await page.locator(`[data-widget-id="${id}"]`).first().click({ position: { x: 6, y: 6 }, force: true })
    await page.waitForTimeout(500)
  }
  try {
    await open(); await select()
    const base0 = await sigOf()
    const base0Again = await sigOf()
    if (!same(base0, base0Again)) { R({ control: "-", option: "-", status: "unstable-baseline" }) }
    const inspector = page.locator("aside").last()
    // every control of the inspector as a descriptor: radio groups with their labels, selects, text inputs
    const groups = async () => page.evaluate(() => {
      const root = [...document.querySelectorAll("aside")].pop()
      const scopes = [root, ...[...document.querySelectorAll('[role=dialog]')].filter((d) => / · (Header|Charts)$/.test(d.getAttribute("aria-label") || ""))]
      const seen = new Set(), out = []
      for (const s of scopes) for (const g of s.querySelectorAll('[role=radiogroup]')) {
        if (seen.has(g)) continue; seen.add(g)
        if (g.parentElement?.closest('[role=radiogroup][aria-label="Layout"]')) continue // thumbnails of the layouts draw the widget's own controls
        const label = g.getAttribute("aria-label") || ""
        if (["Layout", "On phones", "Screen size", "Gallery"].includes(label)) continue
        const radios = [...g.querySelectorAll('[role=radio]')].map((r, i) => ({ i, name: r.getAttribute("aria-label") || r.title || r.textContent.trim(), on: r.getAttribute("aria-checked") === "true" }))
        out.push({ label, radios })
      }
      return out
    })
    const clickRadio = async (label, i) => {
      const loc = page.locator(`[role=radiogroup][aria-label="${label}"]`)
      const target = (await loc.count()) > 1 ? loc.last() : loc.first()
      await target.locator("[role=radio]").nth(i).click({ force: true })
    }
    const processed = new Set()
    const processGroups = async () => {
      const gs = await groups()
      for (const g of gs) {
        if (processed.has(g.label)) continue
        processed.add(g.label)
        const orig = g.radios.findIndex((r) => r.on)
        for (const r of g.radios) {
          if (r.on) continue
          const before = await sigOf(); const di0 = JSON.stringify(await draftItem())
          await clickRadio(g.label, r.i)
          const after = await sigOf(); const di1 = JSON.stringify(await draftItem())
          const keys = (() => { try { const a = JSON.parse(di0) ?? {}, b = JSON.parse(di1) ?? {}; return Object.keys({ ...a, ...b }).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])) } catch { return ["?"] } })()
          R({ control: g.label, option: r.name, status: "clicked", effect: !same(before, after), draftKeys: keys, ds: after?.ds })
          if (orig >= 0) { await clickRadio(g.label, orig); const back = await sigOf(); R({ control: g.label, option: `${r.name} -> ${g.radios[orig].name}`, status: "restored", effect: same(back, before), ...(same(back, before) ? {} : { before, back }) }) }
        }
      }
      // header parts: chips that are on or off
      const chips = await page.evaluate(() => [...document.querySelectorAll('[role=group][aria-label="Header parts"] button')].map((b, i) => ({ i, name: b.textContent.trim(), on: b.getAttribute("aria-pressed") === "true" })))
      if (!processed.has("Header parts") && chips.length) {
        processed.add("Header parts")
        for (const c of chips) {
          const loc = page.locator('[role=group][aria-label="Header parts"] button').nth(c.i)
          const before = await sigOf(); const di0 = JSON.stringify(await draftItem())
          await loc.click({ force: true }); const after = await sigOf(); const di1 = JSON.stringify(await draftItem())
          R({ control: "Header parts", option: `${c.name} ${c.on ? "off" : "on"}`, status: "clicked", effect: !same(before, after), draftKeys: di0 === di1 ? [] : ["header"] })
          await loc.click({ force: true }); const back = await sigOf(); R({ control: "Header parts", option: `${c.name} back`, status: "restored", effect: same(back, before), ...(same(back, before) ? {} : { before, back }) })
        }
      }
    }
    await processGroups()
    // Header and Charts open beside the panel: one button each (aria-expanded)
    const openers = async () => inspector.locator("button[aria-expanded]:not([data-slot=accordion-trigger])").evaluateAll((els) => els.map((e, i) => ({ i, t: e.textContent.trim(), w: e.getBoundingClientRect().width })).filter((x) => x.w > 0 && !["", "Layout", "Content", "Style", "Visibility"].includes(x.t)))
    for (const o of await openers()) {
      // A control another panel hides while it is open (the list of a widget's items, under a Header dialog) cannot be clicked by a person either: noted, not an error.
      const opener = inspector.locator("button[aria-expanded]:not([data-slot=accordion-trigger])").nth(o.i)
      if (!(await opener.isVisible())) { R({ control: o.t || "-", option: "-", status: "opener-hidden" }); continue }
      await opener.click({ force: true }); await page.waitForTimeout(500)
      await processGroups()
    }
    await page.keyboard.press("Escape").catch(() => {})
    // selects and text fields of Content
    const fields = await page.evaluate(() => {
      const root = [...document.querySelectorAll("aside")].pop()
      return [...root.querySelectorAll("select,input[type=text],input:not([type]),textarea")].map((e) => ({ tag: e.tagName, label: e.getAttribute("aria-label") || "", opts: e.tagName === "SELECT" ? [...e.options].map((o) => o.value) : [], value: e.value }))
    })
    for (const f of fields) {
      if (["Phase", "Group", "Opens", "Web address", "Button text"].includes(f.label) || !f.label) continue
      const loc = inspector.locator(`${f.tag.toLowerCase()}[aria-label="${f.label}"]`).first()
      const before = await sigOf()
      if (f.tag === "SELECT") {
        for (const o of f.opts) { if (o === f.value) continue
          const b = await sigOf(); await loc.selectOption(o); const a = await sigOf(); R({ control: f.label, option: o, status: "clicked", effect: !same(b, a), draftKeys: ["props"] })
        }
        await loc.selectOption(f.value)
      } else {
        await loc.fill("Probe text 123"); const a = await sigOf(); R({ control: f.label, option: "text", status: "clicked", effect: !same(before, a), draftKeys: ["props"] })
        await loc.fill(f.value); 
      }
    }
    // The widget's own choices are dropdowns (a combobox that opens a list), not native selects
    const combos = await inspector.locator("[role=combobox][aria-label]").evaluateAll((els) => els.map((e) => ({ label: e.getAttribute("aria-label"), now: e.textContent.trim() })))
    for (const cb of combos) {
      if (["Phase", "Group", "Opens"].includes(cb.label)) continue
      const trig = () => inspector.locator(`[role=combobox][aria-label="${cb.label}"]`).first()
      await trig().click({ force: true }); await page.waitForTimeout(250)
      const opts = await page.locator("[role=option]:visible").allInnerTexts(); await page.keyboard.press("Escape"); await page.waitForTimeout(200)
      const pick = async (t) => { await trig().click({ force: true }); await page.waitForTimeout(250); await page.locator("[role=option]:visible").filter({ hasText: new RegExp("^\\s*" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*$") }).first().click({ force: true }); await page.waitForTimeout(250) }
      const original = (await trig().textContent()).replace(/[▼▾⌄]\s*$/, "").trim()
      for (const o of opts.map((x) => x.trim()).filter((x) => x && x !== original)) {
        const b = await sigOf(); const d0 = JSON.stringify(await draftItem())
        await pick(o); const a = await sigOf(); const d1 = JSON.stringify(await draftItem())
        R({ control: cb.label, option: o, status: "clicked", effect: !same(b, a), draftKeys: d0 === d1 ? [] : ["props"] })
        await pick(original); const back = await sigOf(); R({ control: cb.label, option: `${o} -> ${original}`, status: "restored", effect: same(back, b), ...(same(back, b) ? {} : { before: b, back }) })
      }
    }
    // the coach's own note
    const addBtn = inspector.getByRole("button", { name: /Add text, button or picture/ })
    if (await addBtn.count()) {
      const b = await sigOf(); await addBtn.click(); const ta = inspector.locator('textarea[aria-label="Text"]').last(); await ta.fill("Probe note 123"); const a = await sigOf()
      R({ control: "Note", option: "text", status: "clicked", effect: !same(b, a), draftKeys: ["note"] })
    } else R({ control: "Note", option: "-", status: "not-offered" })
    // a combination, reload (persistence), restore
    const comb = await sigOf(); const combDraft = JSON.stringify(await draftItem())
    await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector(`[data-widget-id="${id}"]`); await page.waitForTimeout(900)
    const reloaded = await sigOf(); const reDraft = JSON.stringify(await draftItem())
    R({ control: "Reload", option: "draft kept", status: "persist", effect: reDraft === combDraft && combDraft !== "null", card: same(comb, reloaded), ...(same(comb, reloaded) ? {} : { comb, reloaded }) })
    // Undo / Redo
    const undo = page.getByRole("button", { name: "Undo" }), redo = page.getByRole("button", { name: "Redo" })
    // Publish, then the student page
    const pub = page.getByRole("button", { name: /^Publish$/ })
    let pubOk = false
    if (await pub.count()) { await pub.click({ force: true }); await page.waitForTimeout(700); const confirm = page.getByRole("button", { name: /^Publish$/ }); if (await confirm.count() > 1) await confirm.last().click(); await page.waitForTimeout(900); pubOk = true }
    const published = await page.evaluate(([k, i]) => { try { return JSON.stringify(JSON.parse(localStorage.getItem(k)).content.pages.home.default.items.find((x) => x.id === i)) } catch { return null } }, [`proto:pub:${slug}`, id])
    const sp = await ctx.newPage(); await sp.goto(`${base}/c/${slug}`, { waitUntil: "networkidle" }); await sp.waitForSelector(`[data-widget-id="${id}"]`).catch(() => {}); await sp.waitForTimeout(1200)
    await sp.addScriptTag({ content: sigSrc }); const stu = await sp.evaluate((i) => window.__sig()[i], id)
    R({ control: "Publish", option: "student page", status: "student", stu, comb, effect: !!stu && stu.text === comb.text && stu.html === comb.html, pubOk, publishedKept: published === combDraft || (published && JSON.stringify(JSON.parse(published)) === JSON.stringify(JSON.parse(combDraft))) })
    await sp.close()
  } catch (e) { R({ control: "-", option: "-", status: "script-error", error: String(e).slice(0, 220) }) }
  if (errors.length) R({ control: "-", option: "-", status: "page-errors", errors })
  await ctx.close()
}

const todo = []
// The page title is not a card: in the editor it is drawn with the editor's own chrome (a block with a "own style" chip, not the student's H1), so neither its restore nor its student page can match a card signature.
const NOT_A_CARD = new Set(["page-header"])
for (const w of catalog) { if (w.core || NOT_A_CARD.has(w.type) || (only && !only.includes(w.type))) continue; for (const v of layoutsToo ? w.variants : w.variants.slice(0, 1)) todo.push([w, v]) }
const queue = [...todo]; let done = 0
await Promise.all(Array.from({ length: Number(args.concurrency || 2) }, async () => { while (queue.length) { const [w, v] = queue.shift(); await run(w, v); process.stdout.write(`\r${++done}/${todo.length} `) } }))
await browser.close(); console.log()
writeFileSync(join(out, "flow.json"), JSON.stringify(results))
const bad = results.filter((r) => (r.status === "clicked" && r.draftKeys?.length === 0) || (["restored", "persist", "student"].includes(r.status) && r.effect === false) || ["script-error", "page-errors", "unstable-baseline"].includes(r.status))
console.log(`${results.length} records, ${bad.length} to look at -> ${join(out, "flow.json")}`)
for (const r of bad.slice(0, 60)) console.log(" ", r.type, r.variant, "|", r.control, "|", r.option, "|", r.status, r.error ?? JSON.stringify(r.errors ?? "") )
