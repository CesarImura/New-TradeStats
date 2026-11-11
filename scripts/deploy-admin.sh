#!/usr/bin/env bash
# Deploy seguro do Admin novo (Admin v2) para https://tradehub-prototype.vercel.app
#
# Existe porque, em 11/11/2026, o Admin foi publicado errado três vezes seguidas
# (branch sem o Admin novo, projeto Vercel errado, build com cache velho e CSS sem tokens).
# Este script recusa publicar se qualquer checagem falhar e confere o resultado depois.
#
# Uso:
#   scripts/deploy-admin.sh --check-only   só roda as checagens de antes do deploy
#   scripts/deploy-admin.sh                checagens + deploy de produção + conferência
#
# Rode de dentro da pasta (worktree) da branch mac-admin-v2. Nunca de New-TradeStats.
set -euo pipefail

EXPECT_BRANCH="mac-admin-v2"
EXPECT_PROJECT="tradehub-prototype"
HOST="https://tradehub-prototype.vercel.app"
MIN_TOKENS=200
MIN_UI_FILES=20

fail() { echo "ERRO: $*" >&2; exit 1; }
ok() { echo "ok: $*"; }

cd "$(git rev-parse --show-toplevel)" || fail "não está dentro de um repositório git"

# 1. Branch certa
branch="$(git branch --show-current)"
[ "$branch" = "$EXPECT_BRANCH" ] || fail "branch é '$branch', precisa ser '$EXPECT_BRANCH' (o Admin novo mora nela)"
ok "branch $branch"

# 2. O kit do Admin novo existe nesta pasta
ui_files="$(find src/components/admin/ui -type f 2>/dev/null | wc -l | tr -d ' ')"
[ "$ui_files" -ge "$MIN_UI_FILES" ] || fail "src/components/admin/ui tem $ui_files arquivos (esperado >= $MIN_UI_FILES): esta pasta não é o Admin novo"
ok "kit do Admin novo ($ui_files arquivos em components/admin/ui)"

# 3. Os tokens do Admin existem e são importados
[ -f src/app/admin-tokens.css ] || fail "src/app/admin-tokens.css não existe"
grep -q 'admin-tokens.css' src/app/globals.css || fail "globals.css não importa admin-tokens.css"
ok "admin-tokens.css importado em globals.css"

# 4. A pasta está ligada ao projeto de produção, não a outro
[ -f .vercel/project.json ] || fail ".vercel/project.json não existe: copie o de New-TradeStats/.vercel (projeto $EXPECT_PROJECT) antes de publicar; sem ele a Vercel cria um projeto novo"
grep -q "\"projectName\":\"$EXPECT_PROJECT\"" .vercel/project.json || fail ".vercel/project.json não aponta para $EXPECT_PROJECT: $(cat .vercel/project.json)"
ok "projeto Vercel $EXPECT_PROJECT"

# 4b. Avisa (não bloqueia) se há mudanças não commitadas: elas também vão no deploy
if [ -n "$(git status --porcelain)" ]; then
  echo "AVISO: há mudanças não commitadas, que vão junto no deploy:" >&2
  git status --short >&2
fi

if [ "${1:-}" = "--check-only" ]; then
  echo "Checagens de antes do deploy: todas passaram."
  exit 0
fi

# 5. Deploy sem cache de build (o cache do Admin antigo já gerou CSS sem tokens)
vercel deploy --prod --yes --force

# 6. Conferência depois do deploy: o CSS de produção tem os tokens e as rotas respondem
echo "Conferindo produção..."
sleep 5
css_urls="$( (curl -s "$HOST/admin/northline" | grep -o '/_next/static/[^"]*\.css' || true) | sort -u)"
[ -n "$css_urls" ] || fail "não achei o CSS em $HOST/admin/northline"
tokens=0
for u in $css_urls; do
  # grep sai com 1 quando não acha nada (um CSS sem tokens é normal): não pode derrubar o script
  n="$( (curl -s "$HOST$u" | grep -o -- '--admin-[a-z0-9-]*:' || true) | sort -u | wc -l | tr -d ' ')"
  if [ "$n" -gt "$tokens" ]; then tokens="$n"; fi
done
[ "$tokens" -ge "$MIN_TOKENS" ] || fail "o CSS de produção tem só $tokens tokens --admin-* (esperado >= $MIN_TOKENS): o Admin está SEM ESTILO. Rode o deploy de novo."
ok "CSS de produção com $tokens tokens --admin-*"
for p in "" /students /sales /design; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$HOST/admin/northline$p")"
  [ "$code" = "200" ] || fail "$HOST/admin/northline$p respondeu $code"
done
ok "rotas do Admin respondem 200"
echo "Deploy conferido: $HOST"
