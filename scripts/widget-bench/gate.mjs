#!/usr/bin/env node
/*
 * Regression gate for the widget bench: compares a run against a versioned baseline of KNOWN defects.
 * Bench infrastructure only: it reads results.json and never touches the product or the detector.
 *
 *   node scripts/widget-bench/gate.mjs run      --base http://localhost:3100 --out /tmp/gate-run   # runs the gate matrix with run.mjs
 *   node scripts/widget-bench/gate.mjs create   --results /tmp/gate-run/results.json              # first baseline; refuses to overwrite
 *   node scripts/widget-bench/gate.mjs check    --results /tmp/gate-run/results.json [--show new|known|fixed|all] [--enforce]
 *   node scripts/widget-bench/gate.mjs verify   --base http://localhost:3100 [--enforce]           # run + check
 *   node scripts/widget-bench/gate.mjs update   --results ... --yes [--accept-new] [--accept-counts] [--reason "text"]   # explicit baseline update
 *
 * Identity of a defect: cell (scenario, template, mode, density, Detail asked, viewport) + card (widget type, layout, width) + category.
 * Not part of the identity: coordinates, measured height, render order, element text, Drop count, dynamic data.
 * The count of occurrences per identity is kept for diagnosis; a change of count alone is "unclassified", it never blocks.
 *
 * update = only fixed defects need `--yes`. New defects need `--accept-new --yes` (never added by a generic --yes), changed counts need `--accept-counts --yes`,
 *          and an incomplete run (cell not executed, card not measured, cell not in the baseline) is refused: no defect is removed without a measurement.
 *          Nothing is written when it refuses. The history in baseline.json records each update: fixed, accepted new, counts, cells, occurrences before/after, `--reason`.
 * known  = in the baseline and in the run: does not block, stays in the report as known debt.
 * new    = in the run, not in the baseline (same cell): blocks.
 * fixed  = in the baseline, not in the run: never blocks; listed for review; the baseline is changed only by `update --yes`.
 *
 * Exit code: 0 pass or report-only, 1 new defects with --enforce, 2 baseline/results missing or invalid, 3 baseline cells not executed with --enforce.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { cellKey } from "./scenarios.mjs"

const HERE = dirname(fileURLToPath(import.meta.url))
const BASELINE_PATH = join(HERE, "baseline.json")
const VERSION = 1

/** The gate matrix: small and controlled. S0 control, S1/S5 known defects, S9 alternative configuration. Terminal dark compact 1440 (S9 pins Atelier + airy). */
export const MATRIX = { scenarios: ["S0", "S1", "S5", "S9"], viewports: [1440], templates: ["terminal"], modes: ["dark"], densities: ["compact"] }

const args = Object.fromEntries(process.argv.slice(3).reduce((a, x, i, all) => (x.startsWith("--") ? [...a, [x.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : "true"]] : a), []))
const cmd = process.argv[2]
const fail = (code, msg) => { console.error(msg); process.exit(code) }

const colsFor = (width) => (width >= 960 ? 3 : width >= 640 ? 2 : 1) // components/widgets/page-renderer.tsx

function readJson(path, what) {
  if (!path || !existsSync(path)) fail(2, `${what} not found: ${path || "(no path)"}`)
  try { return JSON.parse(readFileSync(path, "utf8")) } catch (e) { fail(2, `${what} is not valid JSON: ${path} (${e.message})`) }
}

/** results.json -> { cells: { [cellKey]: { context, cards[], warnings, findings: { "type|variant|width|kind": { count, w, h } } } } }. Only non-warn findings enter the identity. */
export function snapshot(results) {
  if (!results || !Array.isArray(results.results)) throw new Error("results.json has no `results` array")
  const cells = {}
  for (const r of results.results) {
    const c = r.cell
    if (!c || !Array.isArray(r.cards)) throw new Error("a result has no cell or cards")
    const widest = Math.max(0, ...r.cards.filter((x) => !x.missing && x.id.endsWith("|12")).map((x) => x.w))
    const entry = {
      context: { scenario: c.scenario || null, template: c.template, mode: c.mode, density: c.density, detail: c.detail, vw: c.vw, regime: `cols${colsFor(widest || c.vw)}` },
      cards: [], notRendered: r.notRendered || [], warnings: 0, findings: {},
    }
    for (const x of r.cards) {
      if (x.missing) continue
      entry.cards.push(x.id)
      for (const f of x.findings || []) {
        if (f.sev === "warn") { entry.warnings++; continue }
        const k = `${x.id}|${f.kind}`
        entry.findings[k] ||= { count: 0, w: Math.round(x.w), h: Math.round(x.h) }
        entry.findings[k].count++
      }
    }
    entry.cards.sort()
    cells[cellKey(c)] = entry
  }
  return cells
}

function loadBaseline(path) {
  const b = readJson(path, "baseline")
  if (b.version !== VERSION || !b.cells || typeof b.cells !== "object" || !b.matrix) fail(2, `baseline invalid: expected version ${VERSION} with matrix and cells (${path})`)
  for (const [k, c] of Object.entries(b.cells)) if (!c.context || !Array.isArray(c.cards) || typeof c.findings !== "object") fail(2, `baseline invalid: cell ${k} lacks context, cards or findings`)
  return b
}

const split = (key) => { const p = key.split("|"); return { type: p[0], layout: p[1], width: p[2], kind: p[3] } }
const totals = (cells) => {
  const t = { cards: 0, identities: 0, occurrences: 0, widgetTypes: new Set() }
  for (const c of Object.values(cells)) {
    t.cards += c.cards.length
    for (const [k, f] of Object.entries(c.findings)) { t.identities++; t.occurrences += f.count; t.widgetTypes.add(split(k).type) }
  }
  return { cards: t.cards, findingIdentities: t.identities, occurrences: t.occurrences, widgetTypes: t.widgetTypes.size }
}

/** Compares a run to the baseline. */
export function compare(baseline, current) {
  const out = { new: [], known: [], fixed: [], unclassified: [], notExecuted: [], cellsCompared: 0 }
  for (const [ck, b] of Object.entries(baseline.cells)) {
    const c = current[ck]
    if (!c) { out.notExecuted.push(ck); continue }
    out.cellsCompared++
    const known = new Set(b.cards)
    const now = new Set(c.cards)
    const item = (key, extra = {}) => ({ cell: ck, context: b.context, ...split(key), key, ...extra })
    for (const [key, f] of Object.entries(c.findings)) {
      const id = key.split("|").slice(0, 3).join("|")
      if (b.findings[key]) {
        out.known.push(item(key, { count: f.count, baselineCount: b.findings[key].count }))
        if (f.count !== b.findings[key].count) out.unclassified.push(item(key, { class: "count", count: f.count, baselineCount: b.findings[key].count, why: `occurrences ${b.findings[key].count} -> ${f.count} (same identity)` }))
      } else out.new.push(item(key, { count: f.count, why: known.has(id) ? "card existed without this category" : "card not in the baseline" }))
    }
    for (const [key, f] of Object.entries(b.findings)) {
      if (c.findings[key]) continue
      const id = key.split("|").slice(0, 3).join("|")
      if (now.has(id)) out.fixed.push(item(key, { baselineCount: f.count }))
      else out.unclassified.push(item(key, { class: "unmeasured", why: "card not rendered/measured in this run (not counted as fixed)" }))
    }
    for (const id of b.cards) if (!now.has(id) && !Object.keys(b.findings).some((k) => k.startsWith(id + "|"))) out.unclassified.push({ cell: ck, class: "unmeasured", why: `card ${id} (no known defect) not measured in this run` })
  }
  for (const ck of Object.keys(current)) if (!baseline.cells[ck]) out.unclassified.push({ cell: ck, class: "cell", why: "cell not in the baseline" })
  return out
}

function report(baseline, current, diff, { enforce, show }) {
  const bt = totals(baseline.cells)
  const ct = totals(current)
  const verdict = diff.new.length ? (enforce ? "FAIL" : "FAIL (report-only: exit code 0)") : diff.notExecuted.length ? (enforce ? "INCOMPLETE" : "INCOMPLETE (report-only)") : enforce ? "PASS" : "PASS (report-only)"
  const L = []
  const row = (d) => `- ${d.cell} | ${d.type} ${d.layout} ${d.width} cols | ${d.kind}${d.count != null ? ` | x${d.count}` : ""}${d.baselineCount != null && d.count == null ? ` | was x${d.baselineCount}` : ""}${d.why ? ` | ${d.why}` : ""}`
  L.push(`# Widget bench gate: ${verdict}`, "")
  L.push(`Mode: ${enforce ? "blocking (--enforce)" : "report-only"}. Baseline created ${baseline.created}, matrix ${JSON.stringify(baseline.matrix)}.`, "")
  L.push("| | Baseline | This run |", "|---|---|---|")
  L.push(`| Cells | ${Object.keys(baseline.cells).length} | ${Object.keys(current).length} (compared ${diff.cellsCompared}) |`)
  L.push(`| Cards analysed | ${bt.cards} | ${ct.cards} |`)
  L.push(`| Findings (card x category) | ${bt.findingIdentities} | ${ct.findingIdentities} |`)
  L.push(`| Occurrences | ${bt.occurrences} | ${ct.occurrences} |`)
  L.push(`| Widget types with a finding | ${bt.widgetTypes} | ${ct.widgetTypes} |`, "")
  L.push(`**New: ${diff.new.length}** (blocks) | **Known: ${diff.known.length}** (debt) | **Fixed: ${diff.fixed.length}** (improvement, review, update the baseline explicitly) | **Unclassified: ${diff.unclassified.length}** | **Cells not executed: ${diff.notExecuted.length}**`, "")
  const sect = (title, arr, key) => { if (show === "all" || show === key) { L.push(`## ${title} (${arr.length})`); L.push(...(arr.length ? arr.map(row) : ["- none"]), "") } }
  sect("New defects", diff.new, "new")
  sect("Known defects", diff.known, "known")
  sect("Fixed defects", diff.fixed, "fixed")
  if (show === "all" || show === "new") { L.push(`## Unclassified differences (${diff.unclassified.length})`); L.push(...(diff.unclassified.length ? diff.unclassified.map((d) => (d.type ? row(d) : `- ${d.cell} | ${d.why}`)) : ["- none"]), "") }
  L.push(`## Cells not executed (${diff.notExecuted.length})`, ...(diff.notExecuted.length ? diff.notExecuted.map((k) => `- ${k}`) : ["- none"]), "")
  return { text: L.join("\n"), verdict }
}

function runBench(out) {
  const a = ["--base", args.base || "http://localhost:3100", "--scenarios", MATRIX.scenarios.join(","), "--viewports", MATRIX.viewports.join(","), "--templates", MATRIX.templates.join(","), "--modes", MATRIX.modes.join(","), "--densities", MATRIX.densities.join(","), "--out", out]
  const r = spawnSync(process.execPath, [join(HERE, "run.mjs"), ...a], { stdio: "inherit" })
  if (r.status !== 0) fail(2, `run.mjs failed (exit ${r.status})`)
  return join(out, "results.json")
}

function check(resultsPath) {
  const baseline = loadBaseline(resolve(args.baseline || BASELINE_PATH))
  let current
  try { current = snapshot(readJson(resultsPath, "results")) } catch (e) { fail(2, `results invalid: ${e.message}`) }
  const diff = compare(baseline, current)
  const enforce = args.enforce === "true"
  const { text, verdict } = report(baseline, current, diff, { enforce, show: args.show || "all" })
  console.log(text)
  if (args["report-dir"]) {
    mkdirSync(args["report-dir"], { recursive: true })
    writeFileSync(join(args["report-dir"], "gate-report.md"), text)
    writeFileSync(join(args["report-dir"], "gate-report.json"), JSON.stringify({ verdict, enforce, ...diff }, null, 2))
  }
  if (enforce && diff.new.length) process.exit(1)
  if (enforce && diff.notExecuted.length) process.exit(3)
}

function write(path, results, history) {
  const cells = snapshot(readJson(results, "results"))
  const b = { version: VERSION, created: new Date().toISOString(), matrix: MATRIX, note: "Known defects of the widget bench. Identity = cell + type|layout|width + category. Changed only by `gate.mjs update --yes`.", history, cells }
  writeFileSync(path, JSON.stringify(b, null, 1) + "\n")
  return b
}

if (cmd === "run") console.log(`results: ${runBench(resolve(args.out || join(process.env.TMPDIR || "/tmp", `widget-gate-${Date.now()}`)))}`)
else if (cmd === "verify") check(runBench(resolve(args.out || join(process.env.TMPDIR || "/tmp", `widget-gate-${Date.now()}`))))
else if (cmd === "check") check(args.results)
else if (cmd === "create") {
  const p = resolve(args.baseline || BASELINE_PATH)
  if (existsSync(p)) fail(2, `${p} exists; the baseline is never replaced by create (use update --yes after reviewing the report)`)
  const b = write(p, args.results, [{ at: new Date().toISOString(), action: "create" }])
  console.log(`baseline created: ${p} (${Object.keys(b.cells).length} cells, ${totals(b.cells).findingIdentities} findings)`)
} else if (cmd === "update") {
  const p = resolve(args.baseline || BASELINE_PATH)
  const old = loadBaseline(p)
  let cur
  try { cur = snapshot(readJson(args.results, "results")) } catch (e) { fail(2, `results invalid: ${e.message}`) }
  const diff = compare(old, cur)
  const acceptNew = args["accept-new"] === "true"
  const acceptCounts = args["accept-counts"] === "true"
  const confirmed = args.yes === "true"
  const line = (d) => `  - ${d.cell} | ${d.type} ${d.layout} ${d.width} cols | ${d.kind}${d.count != null ? ` x${d.count}` : ""}${d.baselineCount != null ? ` (baseline x${d.baselineCount})` : ""}`
  const refuse = (msg) => { console.error(`baseline NOT updated: ${msg}`); process.exit(2) }
  const counts = diff.unclassified.filter((d) => d.class === "count")
  const blocking = diff.unclassified.filter((d) => d.class !== "count")
  // Case C: no evidence of a fix without a measurement. Nothing is written.
  if (diff.notExecuted.length || blocking.length) {
    console.error(`Incomplete run: ${diff.notExecuted.length} baseline cells not executed, ${blocking.length} unclassified (cards/cells not measured).`)
    for (const k of diff.notExecuted) console.error(`  - cell not executed: ${k}`)
    for (const d of blocking) console.error(d.type ? `${line(d)} | ${d.why}` : `  - ${d.cell} | ${d.why}`)
    refuse("an update never removes or replaces defects without a measurement; run the whole matrix and try again")
  }
  const total = diff.fixed.length + diff.new.length + counts.length
  if (!total) { console.log("baseline unchanged: no fixed, new or changed defects in this run"); process.exit(0) }
  console.log(`Plan: ${diff.fixed.length} fixed removed, ${diff.new.length} new accepted, ${counts.length} occurrence counts changed.`)
  if (diff.fixed.length) { console.log("Fixed (removed from the baseline):"); diff.fixed.forEach((d) => console.log(line(d))) }
  if (diff.new.length) { console.log("NEW defects (regressions unless you accept them):"); diff.new.forEach((d) => console.log(line(d))) }
  if (counts.length) { console.log("Occurrence counts changed:"); counts.forEach((d) => console.log(line(d))) }
  if (diff.new.length && !acceptNew) refuse("the run has NEW defects; they are not added by a generic --yes. Fix them, or accept them explicitly with --accept-new --yes")
  if (acceptNew && !diff.new.length) refuse("--accept-new given but the run has no new defects")
  if (counts.length && !acceptCounts) refuse("occurrence counts changed; review them and accept with --accept-counts --yes")
  if (!confirmed) refuse("add --yes to confirm")
  const cellsChanged = [...new Set([...diff.fixed, ...diff.new, ...counts].map((d) => d.cell))].sort()
  const occ = (cells) => Object.values(cells).reduce((n, c) => n + Object.values(c.findings).reduce((m, f) => m + f.count, 0), 0)
  const entry = {
    at: new Date().toISOString(), action: "update", ...(args.reason && args.reason !== "true" ? { reason: args.reason } : {}),
    cellsChanged, fixed: diff.fixed.map((d) => d.cell + "#" + d.key), acceptedNew: diff.new.map((d) => d.cell + "#" + d.key),
    countsChanged: counts.map((d) => ({ finding: d.cell + "#" + d.key, from: d.baselineCount, to: d.count })), occurrences: { before: occ(old.cells), after: occ(cur) },
  }
  const b = write(p, args.results, [...(old.history || []), entry])
  console.log(`baseline updated: -${entry.fixed.length} fixed, +${entry.acceptedNew.length} accepted new, ${entry.countsChanged.length} counts, ${Object.keys(b.cells).length} cells`)
} else fail(2, "usage: gate.mjs run|create|check|verify|update (see the header of this file and the README)")
