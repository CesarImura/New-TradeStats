// node summarize.mjs results.json : counts per template/kind of offered-no-effect, not-offered-effect, unstable
import { readFileSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
const f = process.argv[2]
const data = JSON.parse(readFileSync(f, "utf8"))
const same = (a, b) => a && b && a.html === b.html && a.style === b.style && a.h === b.h
const rows = []
for (const [key, cell] of Object.entries(data.results)) {
  const b1 = cell.passes[-1]?.sig, b2 = cell.passes[-2]?.sig
  const by = {}
  for (const [p, pass] of Object.entries(cell.passes)) { if (p < 0 || !pass.sig) continue; pass.alts.forEach((n, i) => { if (n) (by[data.items[i].id] ??= {})[n] = pass.sig[data.items[i].id] }) }
  for (const it of data.items) {
    const stable = same(b1[it.id], b2[it.id])
    for (const a of it.alts) {
      if (a.internal) continue
      const s = cell.solo?.[it.id]?.[a.name] ?? by[it.id]?.[a.name], ref = a.ref ? by[it.id]?.[a.ref] : b1[it.id]
      rows.push({ key, id: it.id, name: a.name, offered: a.offered, ref: a.ref, stable, changed: !same(s, ref) })
    }
  }
}
const G = (r) => r.name.replace(/ (on|off)$/, "").replace(/^(surface|headerForm|chart|figure):.*$/, "$1")
const groups = new Map()
for (const r of rows) { const g = `${r.key}|${r.id}|${G(r)}`; (groups.get(g) ?? groups.set(g, []).get(g)).push(r) }
const out = []
for (const [g, rs] of groups) { const any = rs.some((r) => r.changed); out.push({ g, key: rs[0].key, id: rs[0].id, kind: G(rs[0]), offered: rs[0].offered, stable: rs.every((r) => r.stable), effect: any, names: rs.map((r) => r.name) }) }
writeFileSync(f.replace("results.json", "groups.json"), JSON.stringify(out))
const count = {}
for (const o of out) { const k = `${o.key.split("|")[0]} ${o.kind.split("=")[0]}`; const c = (count[k] ??= { ok: 0, noeff: 0, notoff_eff: 0, unstable: 0 }); if (!o.stable) c.unstable++; else if (o.offered && o.effect) c.ok++; else if (o.offered) c.noeff++; else if (o.effect) c.notoff_eff++ }
console.table(count)
