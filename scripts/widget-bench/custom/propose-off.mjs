#!/usr/bin/env node
// Which inspector options a layout offers that change nothing (in every template probed), and which it hides that do change it.
//   node propose-off.mjs <groups.json> [<groups.json> ...]   (the star run's groups.json can be one of them: Star is read from the last file that has it)
import { readFileSync } from "node:fs"
const KIND = { "detail:compact": "less", "detail:detailed": "more", "emphasis:quiet": "quiet", "emphasis:star": "star", headerForm: "title-style", "header:title": "title", "header:value": "value", "header:icon": "icon", "header:description": "description", chart: "chart", figure: "figure", "note:text": "note", "note:button": "note", "note:image": "note" }
const per = {} // id -> kind -> {tpl: {offered, effect}}
for (const f of process.argv.slice(2)) for (const g of JSON.parse(readFileSync(f, "utf8"))) {
  if (!g.stable) continue
  const k = KIND[g.kind]; if (!k) continue
  const tpl = g.key.split("|")[0]
  ;((per[g.id] ??= {})[k] ??= {})[tpl] = { offered: g.offered, effect: g.effect }
}
const add = {}, remove = {}
for (const [id, kinds] of Object.entries(per)) for (const [k, t] of Object.entries(kinds)) {
  const v = Object.values(t)
  if (id.startsWith("page-header")) continue
  if (v.every((x) => x.offered && !x.effect)) (add[id] ??= []).push(k)
  if (v.every((x) => !x.offered && x.effect)) (remove[id] ??= []).push(k)
}
console.log("OFFERED, CHANGES NOTHING (add to OFF):"); for (const [id, k] of Object.entries(add)) console.log("  ", id, k.join(","))
console.log("HIDDEN, BUT CHANGES THE CARD (take out of OFF):"); for (const [id, k] of Object.entries(remove)) console.log("  ", id, k.join(","))
