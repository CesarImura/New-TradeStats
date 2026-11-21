
# Selection card — decisão do Gustavo, 19/11 (Figma 934:2287)

Valores medidos no teste do Gustavo (1763:108650), que valem mais que as imagens anteriores:
- **Default**: sem fill, stroke component/selection-card/border/default (branco 8%), anel do Radio Off em radio/default (14%).
- **Hover**: fill bg/hover 4%, stroke branco 40% (primitive/extra/ffffff-40), anel radio/hover branco 70% (primitive/extra/ffffff-70).
- **Active**: fill 4%, stroke color/control/on #cf4500, Control = Radio Checked=On com anel e ponto em radio/active (accent/strong #ff5500) e sem fill.
- **Disabled**: Default a 40%.

Estrutura: mídia, gap 8, bloco de texto com padding lateral 4, título e descrição a 2 (evita ilustração e texto cortados em cards de tamanhos diferentes).
Variáveis: 7 em component/selection-card/* mais as primitivas ffffff-40 e ffffff-70.

## Armadilhas
- Instâncias com Control trocado para On perdem o override da variante: reaplicar anel/ponto por instância. A troca de componente (Control Off→On) descarta overrides do nested da variante.
- O desenho do Gustavo pode não estar salvo no arquivo: medir cores pelas imagens. Screenshots dele no Figma saem em P3 (#ff5500 vira ~(240,89,30)).

- Mudar a estrutura do _Base deixa o layout antigo nas instâncias (título e descrição cortados). Correção: swapComponent para outra variante e voltar, depois reaplicar fills, strokes e anel.

## Código
`src/components/admin/design/fields/choice-cards.tsx` (`SelectionCard`), `src/app/admin-tokens.css`, verificação em scripts/selection-card.mjs, docs/components.md (seção Selection card).
