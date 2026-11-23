
# Tabs com thumb deslizante (TradeHub)

Componente único: `src/components/admin/ui/slide-thumb.tsx`. Não crie outro thumb; migre para este.

## Comportamento
- Thumb desliza entre itens (não pula). Mola: stiffness 520, damping 34, mass 0.45.
- Camada de rótulo invertido dentro do thumb (cor do texto muda junto com o deslize).
- Interrompível: trocar de tab no meio da animação continua da posição atual.
- prefers-reduced-motion: troca instantânea, sem mola.
- Teclado: roving tabindex, setas, Home e End.
- Tabs sublinhadas (underline) usam uma barra deslizante, não thumb.

## Onde é usado
Tabs do Admin, Dark/Light, grupos segmented, segmented do Editor, Style tabs (Brand/Theme/Layout/Type/Background), Timeframe dos Charts.

## Exceção
`AdminSegmented` (células separadas com borda) fica de fora de propósito.

## Regra
Não altere o design (cores, tamanhos, bordas); apenas a animação.

## Verificação
`scripts/tabs-motion.mjs`: 16 telas × 1440/768/390 (160 checagens, 0 falhas esperado). Rode também tsc e eslint.

## Conteúdo das abas (troca de painel)
- Usar `TabPanel` (`src/components/admin/ui/tab-panel.tsx`) com `value` e `order`; nunca `{tab==="x" && ...}` solto. Abas que precisam de altura igual usam `TabStackPane`.
- Entrada 300 ms (fade + 12 px vindo do lado da aba); saída 110 ms fora do fluxo; a altura é animada e liberada no fim, com timer de segurança de 900 ms.
- reduced motion mantém a MESMA marcação (senão dá hydration error) e só zera as durações.
- Já aplicado em Sales, Tiers, Community, Partners, Ranking, Charts, Journal, Calendar, aula, drawer do aluno e Overview. Regras em docs/components.md ("Troca de conteúdo das abas").
- Teste: `scripts/tab-content-motion.mjs` contra `next start` (BASE=...); `next dev` pode servir HTML velho e acusar hydration falso.

## Não verificado ainda
Tabs com muitos itens e rolagem horizontal; Editor com zoom. O seletor Screen size do Editor não troca em 768/390 (comportamento do app).
