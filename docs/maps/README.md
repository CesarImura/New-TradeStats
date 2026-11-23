# Mapas Figma × código

Fonte oficial para "onde está" e "quem usa". Os três mapas são gerados; não editar à mão.

| Arquivo | Responde | Gerado por | Dados de entrada |
|---|---|---|---|
| `components.md` | Onde está o componente no Figma e no código, variantes, propriedades, em quais seções aparece, quantos arquivos importam | `node scripts/maps/components-screens.mjs` | `data/figma-components.tsv`, `data/figma-component-usage.tsv`, código em `src/` |
| `screens.md` | Todas as telas do Admin e do Editor com ID, tipo (passo, estado, ramo), rota e onde o código cita a tela | o mesmo script | `data/figma-screens.tsv`, `src/components/prototype/flows.ts` |
| `tokens.md` | Cada variável do Figma (Admin e Terminal) com o token do código, valor, usos e status | `node scripts/maps/tokens.mjs` | `data/figma-admin-variables.tsv`, `data/figma-terminal-variables.tsv`, `data/figma-unused-variables.txt`, `src/app/admin-tokens.css` |
| `CHANGELOG.md` | O que mudou de nome ou de lugar, com IDs | à mão, uma linha por mudança | — |

## Atualizar
1. Exportar do Figma com o MCP (`use_figma`, só leitura) os dados que mudaram: `scripts/maps/figma-export-variables.js` (variáveis) e o script de componentes/telas descrito no topo de `scripts/maps/components-screens.mjs`. Salvar o retorno em `docs/maps/data/` no mesmo formato.
2. Rodar os geradores e conferir à mão uma amostra (3 a 5 linhas) contra o Figma e o código.
3. Registrar renomes e movimentos no `CHANGELOG.md`.

## Limites conhecidos
- A correspondência Figma → código é "confirmado" só quando um arquivo cita o nome exato do Figma; "provável" vem do nome do export; o resto fica "pendente". Para confirmar um componente, cite o nome do Figma no comentário do arquivo.
- Contagens de uso incluem instâncias aninhadas e dependem da data do export.
- O mapa antigo `~/Projetos/TradeHub/docs/figma-component-map-2026-11-17.md` é histórico.
