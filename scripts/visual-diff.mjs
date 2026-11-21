// Captura e compara telas por pixel para provar que uma mudança não alterou o visual.
// Uso: node scripts/visual-diff.mjs capture <pasta>   e depois   node scripts/visual-diff.mjs compare <antes> <depois>
// BASE (padrão http://localhost:3000), ROUTES (lista separada por vírgula) e WIDTHS (padrão 390,768,1440) por variável de ambiente.
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
const require = createRequire(import.meta.url)
const { chromium } = require("playwright-core")
const sharp = require("sharp")

const [, , mode, a, b] = process.argv
const BASE = process.env.BASE || "http://localhost:3000"
const WIDTHS = (process.env.WIDTHS || "390,768,1440").split(",").map(Number)
const ROUTES = (process.env.ROUTES || "/,/signup,/admin/kairo,/admin/kairo/students,/admin/kairo/content,/admin/kairo/downloads,/admin/kairo/calendar,/admin/kairo/livestreams,/admin/kairo/charts,/admin/kairo/community,/admin/kairo/sales,/admin/kairo/sales?tab=affiliates,/admin/kairo/partners,/admin/kairo/ranking,/admin/kairo/settings,/admin/kairo/getting-started,/admin/kairo/journal,/admin/kairo/ai,/admin/kairo/design,/c/kairo,/c/kairo/courses,/site/kairo").split(",")
const slug = (r, w) => `${w}${r.replace(/[^a-z0-9]+/gi, "_")}.png`
const STILL = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"

if (mode === "capture") {
  fs.mkdirSync(a, { recursive: true })
  const browser = await chromium.launch()
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" })
    const page = await ctx.newPage()
    for (const r of ROUTES) {
      await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {})
      await page.addStyleTag({ content: STILL }).catch(() => {})
      await page.waitForTimeout(600)
      await page.screenshot({ path: path.join(a, slug(r, w)), fullPage: true })
    }
    await ctx.close()
  }
  await browser.close()
  console.log("capturado em", a)
} else if (mode === "compare") {
  let total = 0, diffs = 0
  for (const f of fs.readdirSync(a).filter((x) => x.endsWith(".png"))) {
    total++
    const pb = path.join(b, f)
    if (!fs.existsSync(pb)) { console.log("FALTA", f); diffs++; continue }
    const [ia, ib] = await Promise.all([sharp(path.join(a, f)).raw().toBuffer({ resolveWithObject: true }), sharp(pb).raw().toBuffer({ resolveWithObject: true })])
    if (ia.info.width !== ib.info.width || ia.info.height !== ib.info.height) { console.log("TAMANHO", f, `${ia.info.width}x${ia.info.height} → ${ib.info.width}x${ib.info.height}`); diffs++; continue }
    let n = 0
    for (let i = 0; i < ia.data.length; i += ia.info.channels) if (Math.abs(ia.data[i] - ib.data[i]) + Math.abs(ia.data[i + 1] - ib.data[i + 1]) + Math.abs(ia.data[i + 2] - ib.data[i + 2]) > 24) n++
    if (n) { console.log("DIF", f, n, "px"); diffs++ }
  }
  console.log(`${total} capturas, ${diffs} com diferença`)
}
