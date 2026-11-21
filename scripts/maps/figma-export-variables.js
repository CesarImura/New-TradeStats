// Rodar pelo MCP do Figma (use_figma, somente leitura) no arquivo XWHeEdjEiY6gWmrsg0vFIZ e salvar o retorno em
// docs/maps/data/figma-admin-variables.tsv e figma-terminal-variables.tsv. Depois: node scripts/maps/tokens.mjs
// Parte 1 (Admin): nome|code syntax sem o prefixo --admin-
const vars = await figma.variables.getLocalVariablesAsync()
const byId = new Map(vars.map((v) => [v.id, v]))
const cols = await figma.variables.getLocalVariableCollectionsAsync()
const admin = cols.find((c) => c.name === "Admin")
const terminal = cols.find((c) => c.name === "Terminal")
const fmt = (v) => {
  if (v && v.type === "VARIABLE_ALIAS") return "→" + (byId.get(v.id) || { name: "?" }).name
  if (v && typeof v === "object" && "r" in v) return "#" + [v.r, v.g, v.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("") + (v.a < 1 ? " " + Math.round(v.a * 100) + "%" : "")
  return String(v)
}
const adminTsv = vars.filter((v) => v.variableCollectionId === admin.id).map((v) => v.name + "|" + (v.codeSyntax.WEB || "").replace(/^var\(--admin-|\)$/g, "")).join("\n")
const m0 = terminal.modes[0].modeId
const terminalTsv = vars.filter((v) => v.variableCollectionId === terminal.id).map((v) => [v.name, v.resolvedType[0], (v.codeSyntax.WEB || "").replace(/^var\(|\)$/g, ""), fmt(v.valuesByMode[m0])].join("|")).join("\n")
return { adminTsv, terminalTsv }
// A lista de variáveis sem uso (figma-unused-variables.txt) vem da varredura em scripts/maps/figma-unused-variables.js.
