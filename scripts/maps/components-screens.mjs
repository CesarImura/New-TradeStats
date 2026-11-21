// Gera docs/maps/components.md e docs/maps/screens.md a partir dos dados exportados do Figma (docs/maps/data)
// e do código em src/. Rodar: node scripts/maps/components-screens.mjs
// Correspondência Figma → código:
//   "confirmado" = algum arquivo de src/ cita o nome exato do componente do Figma (ex.: "Admin / Page header");
//   "provável"   = existe um export com o nome derivado (AdminPageHeader / PageHeader) na pasta esperada;
//   "pendente"   = nada encontrado. Nada aqui é inventado: a coluna Evidência diz de onde veio.
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..")
const rows = (p) => fs.readFileSync(path.join(root, p), "utf8").split("\n").filter((l) => l && !l.startsWith("#")).map((l) => l.split("|"))
const files = []
;(function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?)$/.test(f)) files.push(p)
  }
})(path.join(root, "src"))
const text = new Map(files.map((f) => [path.relative(root, f), fs.readFileSync(f, "utf8")]))
const exportsOf = new Map()
for (const [f, t] of text) for (const m of t.matchAll(/export (?:function|const|class) ([A-Z][A-Za-z0-9]*)/g)) (exportsOf.get(m[1]) ?? exportsOf.set(m[1], []).get(m[1])).push(f)
const importers = (name, file) => [...text].filter(([f, t]) => f !== file && new RegExp(`\\b${name}\\b`).test(t)).length

const SECTION = {
  A01: ["Admin · 01 Onboarding", "/signup, /admin/[coach]/getting-started"], A02: ["Admin · 02 Overview", "/admin/[coach]"], A03: ["Admin · 03 Students", "/admin/[coach]/students"],
  A04: ["Admin · 04 Journal & feedback", "/admin/[coach]/journal (Coming soon)"], A05: ["Admin · 05 Content", "/admin/[coach]/content"], A06: ["Admin · 06 Downloads", "/admin/[coach]/downloads"],
  A07: ["Admin · 07 Calendar", "/admin/[coach]/calendar"], A08: ["Admin · 08 Livestreams", "/admin/[coach]/livestreams"], A09: ["Admin · 09 Charts", "/admin/[coach]/charts"],
  A10: ["Admin · 10 Community", "/admin/[coach]/community"], A11: ["Admin · 11 AI assistant", "/admin/[coach]/ai (Coming soon)"], A12: ["Admin · 12 Sales & payments", "/admin/[coach]/sales, /site/[coach]/offer/[id]"],
  A13: ["Admin · 13 Partners", "/admin/[coach]/partners"], A14: ["Admin · 14 Ranking", "/admin/[coach]/ranking"], A15: ["Admin · 15 Settings", "/admin/[coach]/settings?tab=…"],
  E01: ["Editor · 01 Menu", "/admin/[coach]/design"], E02: ["Editor · 02 Style", "/admin/[coach]/design"], E03: ["Editor · 03 Pages", "/admin/[coach]/design/pages"],
  E04: ["Editor · 04 Join", "/admin/[coach]/design (Join) e /site/[coach]/join"], E05: ["Editor · 05 Menus and dialogs", "/admin/[coach]/design"],
}
const DIR = { Admin: "src/components/admin/", Widget: "src/components/widgets/", Public: "src/components/public/", Terminal: "src/components/" }

const usage = new Map(rows("docs/maps/data/figma-component-usage.tsv").map(([id, a, e, s]) => [id, { a: +a, e: +e, s }]))
const comps = rows("docs/maps/data/figma-components.tsv").map(([id, name, section, variants, props, desc]) => {
  const [sys, ...rest] = name.split(" / ")
  const base = rest.join(" / ").startsWith("_Base ")
  const plain = rest.join(" ").replace(/^_Base /, "").replace(/[^A-Za-z0-9 ]/g, " ")
  const pascal = plain.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("")
  const cited = [...text].filter(([, t]) => t.includes(name.replace(/^(\w+) \/ _Base /, "$1 / "))).map(([f]) => f)
  const cands = [sys + pascal, pascal].flatMap((n) => (exportsOf.get(n) || []).filter((f) => f.startsWith(DIR[sys] || "src/")).map((f) => ({ n, f })))
  let code = "", status = "pendente", evidence = "nenhum export nem citação encontrada"
  if (cands.length) { code = `\`${cands[0].n}\` em \`${cands[0].f}\``; status = "provável"; evidence = "nome do export"; }
  if (cited.length) { status = "confirmado"; evidence = `citado em ${cited.slice(0, 2).map((f) => "`" + f + "`").join(", ")}${cited.length > 2 ? ` e mais ${cited.length - 2}` : ""}`; if (!code) code = "ver arquivos citados" }
  const u = usage.get(id) || { a: 0, e: 0, s: "" }
  const uses = cands.length ? importers(cands[0].n, cands[0].f) : 0
  return { id, name, section, variants: +variants, props, desc: desc === "1", base, code, status, evidence, uses, ...u }
})

let commit = "?"
try { commit = execSync("git rev-parse --short HEAD", { cwd: root }).toString().trim() } catch {}
const head = (title) => [`# ${title}`, "", `Gerado por \`scripts/maps/components-screens.mjs\` em ${new Date().toISOString().slice(0, 10)}, commit ${commit}. Figma: arquivo XWHeEdjEiY6gWmrsg0vFIZ, dados exportados em 21/11/2026 pelo MCP (pasta \`docs/maps/data\`). Não editar à mão: atualizar os dados e rodar de novo. Mudanças ficam em \`docs/maps/CHANGELOG.md\`.`, ""]

// ---- components.md
const c = head("Mapa de componentes (Figma × código)")
const tally = comps.reduce((a, x) => ((a[x.status] = (a[x.status] || 0) + 1), a), {})
c.push(`${comps.length} famílias na página Components (283:9649). Correspondência com o código: ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(" · ")}. Componentes \`_Base\` são a estrutura interna do público e normalmente não têm export próprio.`, "")
c.push("Seções: A01 a A15 = fluxos do Admin (Screens · Admin), E01 a E05 = grupos do Editor. Contagens incluem instâncias aninhadas. **Sem uso** = 0 instâncias nas telas oficiais (não apagar sem ok; ver status no mapa).", "")
c.push("Como consultar: procure pelo nome do Figma, pelo ID ou pelo arquivo. Telas que usam uma seção: `docs/maps/screens.md`. Tokens: `docs/maps/tokens.md`.", "")
for (const sec of [...new Set(comps.map((x) => x.section))]) {
  c.push(`## ${sec}`, "", "| Figma (ID) | Variantes | Propriedades | Uso Admin / Editor | Seções | Código | Status | Evidência | Importado por |", "|---|---|---|---|---|---|---|---|---|")
  for (const x of comps.filter((y) => y.section === sec)) c.push(`| ${x.name} (\`${x.id}\`)${x.desc ? "" : " ⚠ sem descrição"} | ${x.variants} | ${x.props.replace(/,/g, ", ") || "—"} | ${x.a} / ${x.e}${x.a + x.e === 0 ? " · **sem uso**" : ""} | ${x.s || "—"} | ${x.code || "—"} | ${x.status} | ${x.evidence} | ${x.uses ? x.uses + " arquivos" : "—"} |`)
  c.push("")
}
fs.writeFileSync(path.join(root, "docs/maps/components.md"), c.join("\n") + "\n")

// ---- screens.md
const flows = fs.readFileSync(path.join(root, "src/components/prototype/flows.ts"), "utf8")
const figmaRefs = [...flows.matchAll(/figma: "([^"]+)"/g)].map((m) => m[1])
const screens = rows("docs/maps/data/figma-screens.tsv").map(([sec, id, name]) => {
  const m = name.match(/· (\d{2})([a-z]?)\b/)
  const kind = !m ? "—" : / · 00 Flow map$/.test(name) ? "mapa do fluxo" : m[2] ? (/^Tour · Course · 0[45][ab]|04c/.test(name) && /(Folder|Links|No videos|Open your first|Add your first)/.test(name) ? "ramo" : "estado ou variante") : "passo"
  const inCode = [...text].filter(([, t]) => t.includes(name)).map(([f]) => f)
  const proto = figmaRefs.filter((r) => name.startsWith(r))
  return { sec, id, name, kind, inCode, proto }
})
const s = head("Mapa de telas (Figma × rotas)")
s.push(`${screens.length} telas: ${screens.filter((x) => x.sec.startsWith("A")).length} no Admin e ${screens.filter((x) => x.sec.startsWith("E")).length} no Editor. Toda tela tem uma nota \`Note · <nome>\` 40 px abaixo, em português. Convenção de nomes e disposição: skill \`tradehub-figma\` e \`docs/maps/README.md\`.`, "")
s.push("Tipo: **mapa do fluxo** = `00 Flow map`, primeira coluna de cada seção; **passo** = número sem letra; **estado ou variante** = número + letra (b, c…) empilhado na coluna da base; **ramo** = caminhos paralelos (a, b, c), cada um na sua linha com `Label · Branch`. Link para abrir: `https://www.figma.com/design/XWHeEdjEiY6gWmrsg0vFIZ/Tradehub?node-id=<ID com - no lugar de :>`.", "")
for (const [code, [title, route]] of Object.entries(SECTION)) {
  const list = screens.filter((x) => x.sec === code)
  if (!list.length) continue
  s.push(`## ${title}`, "", `Rota no protótipo: \`${route}\`.`, "", "| ID | Tela | Tipo | Citada no código | Controlador do protótipo |", "|---|---|---|---|---|")
  for (const x of list) s.push(`| \`${x.id}\` | ${x.name} | ${x.kind} | ${x.inCode.length ? x.inCode.map((f) => "`" + f + "`").join(", ") : "—"} | ${x.proto.length ? "sim" : "—"} |`)
  s.push("")
}
s.push("## Lacunas conhecidas", "", "- Course tour: o passo `open-course` (\"Open your course\", `src/components/admin/tour/tours.ts`) não tem tela no Figma (Code-only).", "- Telas do aluno (sino, Also by e-mail) não ficam neste arquivo.", "")
fs.writeFileSync(path.join(root, "docs/maps/screens.md"), s.join("\n") + "\n")
console.log("components.md:", comps.length, tally, "| screens.md:", screens.length)
