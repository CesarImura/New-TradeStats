
# Timeline step (Getting started) — decisão do Gustavo, 19/11, referência Figma 1753:107765

Os passos vão em ordem; só o primeiro não concluído é Current.

- **Done**: cartão com borda color-timeline #4ade80 a 40% e fundo +4% verde (variáveis component/timeline-step/border/done e bg/done), ícone verde, marcador verde com check.
- **Current**: borda color/border/default, marcador Step indicator State=Upcoming (anel cinza com número), Skip for now + botão primário.
- **Locked**: sem fundo, borda subtle, marcador State=Locked (anel tracejado 1.5 [3,3], sem fill, cadeado 12px color/icon/subtle a 36%), título secondary, descrição tertiary, ícone tertiary, botão Secondary disabled. Go live bloqueado usa Locked, com a linha de baixo invisível (ver Trilho).

## Trilho
- 2px. Verde sólido (success-fill) até o último Done; depois tracejado stroke 1 INSIDE, dash 4,4, color/border/default, cornerRadius 0.
- Só a ponta ao lado do marcador é arredondada nos trechos verdes (Line top: bottom 999; Line bottom: top 999).
- Gap marcador-linha 6; linhas top/bottom 28/28, marcador em y=34. Último passo (Go live): NÃO desligar Show Line (o marcador desce para o fim do trilho). Manter a Line bottom no layout com fill e stroke vazios (invisível), marcador centralizado como os outros. Se a instância mostrar 29/27 (layout velho), fixar as duas linhas em altura FIXED 28; layoutGrow/resize da instância não corrigem.

## Código
Rounded só na ponta do marcador; cadeado com text-a-icon-subtle. Ver docs/components.md.

## Armadilha (plugin Figma)
Mudar a State de um Step indicator/Timeline step dentro de um frame mantém overrides antigos: o número do marcador volta ao padrão '2' e fills do marcador ficam errados. Reaplicar Number Text (com a troca de fonte Inter) e conferir fills/strokes. Number Text de instância exige a fonte carregada, senão setProperties falha.
