#!/usr/bin/env bash
# One safe dev server for New-TradeStats on port 3000.
#   scripts/dev-server.sh status    who is on 3000, and does it answer?
#   scripts/dev-server.sh restart   stop THIS project's server, wait until it is really gone, reset the manifests, start one server
#   scripts/dev-server.sh restart --clean   same, but wipe the whole .next (slower; close every browser tab first)
#   scripts/dev-server.sh start     start one server if the port is free
# Never run `next build` or `rm -rf .next` in this folder while a server is up: both write the same .next.
# For a build or a test copy, use another folder and another port (e.g. 3100).
# Paste it as:  bash ~/Projetos/TradeHub/New-TradeStats/scripts/dev-server.sh restart
set -uo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3000}"
LOG="${TMPDIR:-/tmp}/tradehub-dev-$PORT.log"

owner() { lsof -nP -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null | head -1 || true; }
cwd_of() { lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; }
code() { curl -s -o /dev/null -w "%{http_code}" -m 15 "http://localhost:$PORT/admin/northline" || true; }
# Is the server listening at all? Asks for the favicon, which compiles no page (the page probe above is only for status).
alive() { [ "$(curl -s -o /dev/null -w "%{http_code}" -m 5 "http://localhost:$PORT/favicon.ico" || true)" != "000" ]; }
# Every process that belongs to this folder's dev server: next dev, next-server, turbopack workers.
ours() {
  pgrep -f "$APP/(node_modules|\.next)" 2>/dev/null || true
  # next-server (the process holding the port) has no path in its name: find it by its folder
  local p; p="$(owner)"
  if [ -n "$p" ] && [ "$(cwd_of "$p")" = "$APP" ]; then echo "$p"; fi
}

status() {
  local pid; pid="$(owner)"
  if [ -z "$pid" ]; then echo "port $PORT is free"; return 1; fi
  echo "port $PORT: pid $pid, folder $(cwd_of "$pid"), answers $(code)"
}

stop_ours() {
  local pid; pid="$(owner)"
  if [ -n "$pid" ] && [ "$(cwd_of "$pid")" != "$APP" ]; then
    echo "port $PORT is used by another folder ($(cwd_of "$pid")). Not touching it." >&2; exit 1
  fi
  if [ -z "$(ours)" ]; then echo "1/4 no server of this folder is running"; return 0; fi
  echo "1/4 stopping the server ($(ours | sort -u | tr '\n' ' '))..."
  ours | sort -u | xargs kill 2>/dev/null || true
  # Turbopack saves its cache after SIGTERM, which can take over a minute: the port frees long before .next is safe to delete.
  for i in $(seq 1 150); do
    [ -z "$(ours)" ] && { echo "    stopped after ${i}s"; return 0; }
    [ $((i % 10)) -eq 0 ] && echo "    still saving its cache... ${i}s"
    sleep 1
  done
  echo "    did not stop in 150s: forcing it"
  ours | sort -u | xargs kill -9 2>/dev/null || true
  sleep 2
  [ -z "$(ours)" ] || { echo "could not stop pids: $(ours | sort -u | tr '\n' ' ')" >&2; exit 1; }
}

# Why .next is KEPT by default: with a cold .next every route compiles for the first time at once when the browser tabs
# reload, two writers overlap on .next/dev/prerender-manifest.json and it ends up corrupt (reproduced: four concurrent cold
# requests = every route answers 500; the same requests on a kept .next are fine). Only the manifests are removed: Next
# rebuilds them on start. `restart --clean` wipes everything; then close every localhost:$PORT tab first.
fix_manifests() {
  echo "2/4 resetting the manifests (the compiled routes in .next are kept)"
  rm -f "$APP"/.next/dev/{prerender-manifest,routes-manifest,build-manifest,fallback-build-manifest}.json
  echo "    done"
}

clear_next() {
  echo "2/4 clearing the whole .next (close every localhost:$PORT tab first)"
  for _ in 1 2 3 4 5; do
    rm -rf "$APP/.next" 2>/dev/null
    [ -e "$APP/.next" ] || { echo "    cleared"; return 0; }
    sleep 2
  done
  echo ".next is still not empty; something is writing to it (see: lsof +D $APP/.next)" >&2; exit 1
}

# The first compile of a route rewrites .next/dev/prerender-manifest.json. When many routes compile at once (the Design
# "Pages" canvas opens nine student pages together) two writes overlap and leave the file corrupt: every route then answers 500.
# So the routes are visited one at a time, once, before anyone else asks for them.
warm_up() {
  echo "    warming up the routes one by one (do not open the Design > Pages canvas until this ends)"
  local p
  for p in /admin/northline /admin/northline/design /c/northline /c/northline/calendar?preview=draft /c/northline/courses?preview=draft \
    /c/northline/journal?preview=draft /c/northline/charts?preview=draft /c/northline/community?preview=draft /c/northline/ai?preview=draft /site/northline/login; do
    curl -s -o /dev/null -m 120 "http://localhost:$PORT$p" || true
  done
  if node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$APP/.next/dev/prerender-manifest.json" 2>/dev/null; then
    echo "    warm-up done, manifest is valid"
  else
    echo "    WARNING: .next/dev/prerender-manifest.json is corrupt. Run restart again." >&2
  fi
}

start() {
  if [ -n "$(owner)" ]; then echo "3/4 port $PORT already in use:"; status; exit 1; fi
  echo "3/4 starting the server (log: $LOG)..."
  ( cd "$APP" && nohup npm run dev > "$LOG" 2>&1 & )
  for i in $(seq 1 90); do
    if alive; then echo "4/4 up after ${i}s"; warm_up; status; return 0; fi
    [ $((i % 5)) -eq 0 ] && echo "    waiting... ${i}s"
    sleep 1
  done
  echo "did not answer in 90s; see $LOG" >&2; exit 1
}

case "${1:-status}" in
  status) status ;;
  start) start ;;
  restart) stop_ours; if [ "${2:-}" = "--clean" ]; then clear_next; else fix_manifests; fi; start ;;
  *) echo "usage: $0 status|start|restart" >&2; exit 2 ;;
esac
