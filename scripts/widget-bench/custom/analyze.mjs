#!/usr/bin/env node
// Reads probe results.json: per card and customization, offered by the inspector or not, and whether the card changed.
//   node analyze.mjs results.json [--md out.md]
import { readFileSync, writeFileSync } from "node:fs"
const file = process.argv[2]
const mdOut = process.argv.includes("--md") ? process.argv[process.argv.indexOf("--md") + 1] : null
const data = JSON.parse(readFileSync(file, "utf8"))
const same = (a, b) => a && b && a.html === b.html && a.style === b.style && a.h === b.h
const rows = []
for (const [key, cell] of Object.entries(data.results)) {
  const base1 = cell.passes[-1]?.sig, base2 = cell.passes[-2]?.sig
  if (!base1 || !base2) { console.log(`${key}: baseline missing`); continue }
  // where each alteration landed: name -> sig, per item
  const byItem = {}
  for (const [p, pass] of Object.entries(cell.passes)) {
    if (p < 0 || !pass.sig) continue
    pass.alts.forEach((name, idx) => { if (name) (byItem[data.items[idx].id] ??= {})[name] = pass.sig[data.items[idx].id] })
  }
  for (const it of data.items) {
    const stable = same(base1[it.id], base2[it.id])
    for (const a of it.alts) {
      if (a.internal) continue
      const s = byItem[it.id]?.[a.name] ?? cell.solo?.[it.id]?.[a.name]
      const ref = a.ref ? byItem[it.id]?.[a.ref] : base1[it.id]
      if (!s || !ref) { rows.push({ key, id: it.id, name: a.name, offered: a.offered, status: "missing" }); continue }
      rows.push({ key, id: it.id, name: a.name, offered: a.offered, ref: a.ref, status: !stable ? "unstable" : same(s, ref) ? "none" : "changed" })
    }
  }
}
// "x on" / "x off", and the values of one choice (a card surface, a title style, a chart or number style) that may equal the theme's own: one customization (a part may already be on, or off, by default): it has an effect if any of them changes the card
const groups = new Map()
for (const r of rows) { const g = `${r.key}|${r.id}|${r.name.replace(/ (on|off)$/, "").replace(/^(surface|headerForm|chart|figure):.*$/, "$1")}`; (groups.get(g) ?? groups.set(g, []).get(g)).push(r) }
for (const g of groups.values()) if (g.length > 1 && g.some((r) => r.status === "changed")) for (const r of g) if (r.status === "none") r.status = "paired"
export const _rows = rows
const sum = (f) => rows.filter(f).length
console.log(`cards×customizations: ${rows.length}`)
console.log(`offered & changed (ok): ${sum((r) => r.offered && r.status === "changed")}`)
console.log(`offered & NO effect: ${sum((r) => r.offered && r.status === "none")}`)
console.log(`not offered & changed (effect not offered): ${sum((r) => !r.offered && r.status === "changed")}`)
console.log(`not offered & no effect (ok): ${sum((r) => !r.offered && r.status === "none")}`)
console.log(`pair partner changed (ok): ${sum((r) => r.status === "paired")}`)
console.log(`unstable: ${sum((r) => r.status === "unstable")}, missing: ${sum((r) => r.status === "missing")}`)
const fmt = (r) => `${r.key} ${r.id} :: ${r.name}${r.ref ? ` (vs ${r.ref})` : ""}`
const noEffect = rows.filter((r) => r.offered && r.status === "none")
const notOffered = rows.filter((r) => !r.offered && r.status === "changed")
if (mdOut) {
  writeFileSync(mdOut, `# Probe ${file}\n\n## Offered, no effect (${noEffect.length})\n${noEffect.map((r) => "- " + fmt(r)).join("\n")}\n\n## Not offered, has effect (${notOffered.length})\n${notOffered.map((r) => "- " + fmt(r)).join("\n")}\n\n## Unstable\n${rows.filter((r) => r.status === "unstable").map((r) => "- " + fmt(r)).join("\n")}\n`)
  console.log("wrote", mdOut)
} else {
  console.log("\nOFFERED, NO EFFECT:"); noEffect.forEach((r) => console.log("  " + fmt(r)))
  console.log("\nNOT OFFERED, HAS EFFECT:"); notOffered.forEach((r) => console.log("  " + fmt(r)))
}
