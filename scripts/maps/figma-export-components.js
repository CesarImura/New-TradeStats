// Rodar pelo MCP do Figma (use_figma, somente leitura) no arquivo XWHeEdjEiY6gWmrsg0vFIZ.
// Parte A (página Components): salvar o retorno em docs/maps/data/figma-components.tsv
const p = await figma.getNodeByIdAsync("283:9649"); await figma.setCurrentPageAsync(p)
const L = []
for (const s of p.children) {
  if (s.type !== "SECTION") continue
  for (const n of s.findAll((x) => x.type === "COMPONENT_SET" || (x.type === "COMPONENT" && x.parent.type !== "COMPONENT_SET"))) {
    let props = ""; try { props = Object.keys(n.componentPropertyDefinitions).map((k) => k.split("#")[0]).join(",") } catch {}
    L.push([n.id, n.name, s.name, n.type === "COMPONENT_SET" ? n.children.length : 1, props, n.description ? 1 : 0].join("|"))
  }
}
return L.join("\n")
// Parte B (uso, rodar numa chamada separada): para cada página 1466:2 e 286:8501, percorrer as seções, contar instâncias por família
// (getMainComponentAsync → set pai) e juntar os códigos de seção (A01…A15, E01…E05). Formato: id|admin|editor|seções → figma-component-usage.tsv
// Parte C (telas): seção|id|nome de cada filho de seção que não seja "Note ·" nem "Label ·" → figma-screens.tsv
