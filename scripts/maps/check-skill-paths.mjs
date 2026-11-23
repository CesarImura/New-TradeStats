// Confere se todo caminho de arquivo citado nas skills de docs/skills existe no repositório ou em ~/Projetos/TradeHub.
// Uso: node scripts/maps/check-skill-paths.mjs  (sai com código 1 se algum caminho não existir)
import fs from "node:fs"; import path from "node:path"; import os from "node:os"
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..")
const hub = path.join(os.homedir(), "Projetos/TradeHub")
const files = []
;(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f.endsWith(".md")) files.push(p) } })(path.join(root, "docs/skills"))
let bad = 0, n = 0
for (const f of files) {
  const t = fs.readFileSync(f, "utf8")
  for (const m of t.matchAll(/`((?:src|scripts|docs|public)\/[A-Za-z0-9_./\[\]-]+?)`/g)) {
    const p = m[1].replace(/[.,]$/, "")
    if (/[*<]|-$/.test(p)) continue
    n++
    if (!fs.existsSync(path.join(root, p)) && !fs.existsSync(path.join(hub, p))) { bad++; console.log("FALTA", path.relative(root, f), p) }
  }
  for (const m of t.matchAll(/`references\/([a-z0-9-]+\.md)`/g)) { n++; if (!fs.existsSync(path.join(path.dirname(f), "references", m[1]))) { bad++; console.log("FALTA", path.relative(root, f), m[0]) } }
}
console.log(`${files.length} arquivos, ${n} caminhos, ${bad} faltando`)
process.exit(bad ? 1 : 0)
