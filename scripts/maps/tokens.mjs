// Gera docs/maps/tokens.md: variáveis do Figma (Admin e Terminal) × tokens do código, com status de uso nos dois lados.
// Entradas: docs/maps/data/figma-*-variables.tsv e figma-unused-variables.txt (exportados do Figma pelo MCP,
// ver scripts/maps/figma-export-variables.js) e o código em src/. Rodar: node scripts/maps/tokens.mjs
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..")
const read = (p) => fs.readFileSync(path.join(root, p), "utf8")
const lines = (p) => read(p).split("\n").filter((l) => l && !l.startsWith("#"))

const files = []
;(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(f)) files.push(p)
  }
})(path.join(root, "src"))
const tokensCss = path.join(root, "src/app/admin-tokens.css")
const corpus = files.filter((f) => f !== tokensCss).map((f) => fs.readFileSync(f, "utf8")).join("\n")
const css = fs.readFileSync(tokensCss, "utf8")
const count = (re) => (corpus.match(re) || []).length
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const unused = new Set(lines("docs/maps/data/figma-unused-variables.txt"))

// ---- Admin
const def = {}
for (const m of css.matchAll(/^\s*--admin-([a-z0-9-]+):\s*([^;]+);/gm)) def[m[1]] = m[2].trim()
const twMap = {} // admin name -> tailwind short names (bg-a-panel...)
for (const m of css.matchAll(/^\s*--(color|radius|font|blur)-(a-[a-z0-9-]+):\s*var\(--admin-([a-z0-9-]+)\)/gm)) (twMap[m[3]] ??= []).push(m[2])
const utilUse = (short) => count(new RegExp(`[-:](${esc(short)})(?![a-z0-9-])`, "g"))
const admin = lines("docs/maps/data/figma-admin-variables.tsv").map((l) => {
  const [name, cs] = l.split("|")
  const inCss = cs in def
  const direct = count(new RegExp(`--admin-${esc(cs)}(?![a-z0-9-])`, "g"))
  const viaTw = (twMap[cs] || []).reduce((s, t) => s + utilUse(t), 0)
  const viaAlias = Object.entries(def).filter(([, v]) => v.includes(`--admin-${cs})`)).map(([k]) => k)
  const figmaUsed = !unused.has(`Admin:${name}`)
  const codeUsed = direct + viaTw > 0 || viaAlias.length > 0
  const status = !inCss ? "sem token no código" : figmaUsed && codeUsed ? "em uso" : !figmaUsed && !codeUsed ? "sem uso (Figma e código)" : !figmaUsed ? "sem uso no Figma" : "sem uso direto no código"
  return { name, cs, value: def[cs] ?? "—", tw: (twMap[cs] || []).join(", "), direct, viaTw, alias: viaAlias.length, status }
})
const figmaAdmin = new Set(admin.map((a) => a.cs))
const codeOnly = Object.keys(def).filter((k) => !figmaAdmin.has(k))

// ---- Terminal
const term = lines("docs/maps/data/figma-terminal-variables.tsv").map((l) => {
  const [name, type, cs, val] = l.split("|")
  const used = count(new RegExp(`${esc(cs)}(?![a-z0-9-])`, "g"))
  const figmaUsed = !unused.has(`Terminal:${name}`)
  return { name, type, cs, val, used, status: figmaUsed ? (used ? "em uso" : "sem uso direto no código") : used ? "sem uso no Figma" : "sem uso (Figma e código)" }
})

let commit = "?"
try { commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim() } catch {}
const tally = (rows) => Object.entries(rows.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {})).map(([k, v]) => `${k}: ${v}`).join(" · ")
const out = []
out.push("# Mapa de tokens (Figma × código)", "")
out.push(`Gerado por \`scripts/maps/tokens.mjs\` em ${new Date().toISOString().slice(0, 10)}, commit ${commit}. Figma: arquivo XWHeEdjEiY6gWmrsg0vFIZ, exportado em 21/11/2026 (pasta \`docs/maps/data\`). Não editar à mão: atualizar os dados e rodar de novo.`, "")
out.push("Como ler: **medido** = contagem de ocorrências no código (`--admin-…` direto, utilitário Tailwind `bg-a-…`/`rounded-a-…` e alias dentro de `admin-tokens.css`) e lista de variáveis sem uso no Figma (varredura de nós ligados, inclusive aliases). **Inferido**: nada nesta tabela; status = combinação das duas medições.", "")
out.push("Regras: coleção **Terminal não se mexe** (temas e widgets do aluno; 'sem uso no Figma' não é 'sem uso no código'). Editor usa a coleção **Admin** (sem terceira coleção). A coleção Admin tem um modo só, `Admin` (o modo Dark legado foi removido em 21/11/2026).", "")
out.push("## Admin", "", `${admin.length} variáveis no Figma. ${tally(admin)}.`, "")
out.push(`Tokens só no código (não estão na coleção do Figma): ${codeOnly.length ? codeOnly.map((c) => "`--admin-" + c + "`").join(", ") : "nenhum"}.`, "")
out.push("| Figma | Código | Valor no código (modo Admin) | Tailwind | Usos diretos | Usos Tailwind | Aliases | Status |", "|---|---|---|---|---|---|---|---|")
for (const a of admin) out.push(`| ${a.name} | \`--admin-${a.cs}\` | \`${a.value.replace(/\|/g, "\\|")}\` | ${a.tw} | ${a.direct} | ${a.viaTw} | ${a.alias} | ${a.status} |`)
out.push("", "## Terminal", "", `${term.length} variáveis no Figma (modos Dark, Light, Atelier, Pulse; valor abaixo = Dark). ${tally(term)}.`, "")
out.push("| Figma | Code syntax | Tipo | Valor ou alias (Dark) | Usos no código | Status |", "|---|---|---|---|---|---|")
for (const t of term) out.push(`| ${t.name} | \`${t.cs}\` | ${t.type} | ${t.val} | ${t.used} | ${t.status} |`)
fs.writeFileSync(path.join(root, "docs/maps/tokens.md"), out.join("\n") + "\n")
console.log("tokens.md:", admin.length, "Admin,", term.length, "Terminal;", tally(admin), "|", tally(term), "| code-only:", codeOnly.join(","))
