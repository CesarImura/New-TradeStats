
# Regra do botão principal nos formulários (Gustavo, 19/11)

Vale para todo formulário do Admin e do Editor. Modelo de comportamento correto: "Enter the 6-digit code" (Verify).

1. **Figma × código:** no Figma o botão principal fica em Default. No código ele fica desabilitado (opacidade 40%, sem clique) até todo campo obrigatório estar preenchido e válido.
2. **Obrigatório** = texto sem espaços sobrando, formato/tamanho mínimo (e-mail com ponto, link https, IBAN), escolha feita, termos marcados, arquivo enviado.
3. **Erro** só aparece quando há algo digitado e inválido (e-mail e nome curto, após sair do campo). Campo vazio nunca mostra erro. O padrão antigo "tried" (erro só ao clicar) está retirado.
4. **Edição de dados existentes:** Salvar só ativa se algo mudou e é válido.
5. **Etapa só de perguntas opcionais:** Continue ativa com 1+ resposta; Skip (hierarchy "text") fica sempre ativo. Etapa informativa mantém Continue aberto.
6. Enter em formulário incompleto não faz nada; estados de espera ("Checking…") também desabilitam o botão.

## Como verificar
- Rodar scripts/forms-rule.mjs (Playwright) em 1440, 768 e 390 px.
- Testar vazio, parcial, completo, inválido e só espaços.
- Botões que só abrem algo ou concluem (Done, Publish, Upload, Open studio) não são formulário.
- Seção Formulários em docs/components.md.

## Armadilha
Não "corrigir" o Figma para desabilitado nem o código para sempre ativo: a diferença Figma Default × código desabilitado é intencional.
