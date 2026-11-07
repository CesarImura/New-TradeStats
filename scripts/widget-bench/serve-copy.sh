#!/usr/bin/env bash
# Builds an isolated copy of the app with the bench catalog switched on and serves it. Never builds in the shared folder
# (next build and next dev would write the same .next).
#   scripts/widget-bench/serve-copy.sh <dest-dir> <port> [sed-expression ...]
# Extra arguments are sed -E expressions applied to every .tsx under src/components/widgets in the COPY, to try a change
# (for example 's/@\[24rem\]/@[26rem]/g') without touching the project. PRE_BUILD="shell command" runs inside the copy
# before the build (for example to restore a file from git and check that the bench catches the old defect).
set -euo pipefail
APP="$(cd "$(dirname "$0")/../.." && pwd)"
DEST="${1:?destination folder}"; PORT="${2:?port}"; shift 2 || true
mkdir -p "$DEST"
rsync -a --delete --exclude node_modules --exclude .next --exclude .git "$APP"/ "$DEST"/
[ -e "$DEST/node_modules" ] || cp -Rc "$APP/node_modules" "$DEST/node_modules"
for expr in "$@"; do find "$DEST/src/components/widgets" -name '*.tsx' -exec sed -i '' -E "$expr" {} +; done
cd "$DEST"
[ -z "${PRE_BUILD:-}" ] || eval "$PRE_BUILD"
NEXT_PUBLIC_WIDGET_BENCH=1 npx next build > "$DEST/build.log" 2>&1 || { tail -20 "$DEST/build.log"; exit 1; }
lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 && { echo "port $PORT is busy"; exit 1; }
nohup npx next start -p "$PORT" > "$DEST/start.log" 2>&1 &
echo "serving $DEST on http://localhost:$PORT (pid $!)"
