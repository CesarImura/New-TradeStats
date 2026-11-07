#!/usr/bin/env node
/*
 * npm run bench: builds an isolated copy of the app with the bench catalog on, serves it, runs the matrix, stops the server.
 *
 *   npm run bench                                  the smoke layer (36 cells)
 *   npm run bench -- --layer full                  everything (324 cells)
 *   npm run bench -- --layer smoke --only watchlist --out /tmp/bench
 *
 * Everything after `--` goes to run.mjs. Needs: Node 20+, rsync, and a Chromium for playwright-core (see README).
 * It never builds in this folder: next build and next dev would write the same .next.
 */
import { spawn, spawnSync } from "node:child_process"
import { mkdtempSync, existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import net from "node:net"

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, "../..")
const args = process.argv.slice(2)
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined }

const free = () => new Promise((ok, fail) => { const s = net.createServer(); s.listen(0, () => { const { port } = s.address(); s.close(() => ok(port)) }); s.on("error", fail) })
const port = Number(flag("--port")) || (await free())
const dest = flag("--copy") ? resolve(flag("--copy")) : mkdtempSync(join(tmpdir(), "widget-bench-app-"))
const out = flag("--out") ? resolve(flag("--out")) : join(tmpdir(), `widget-bench-${Date.now()}`)

// the browser: playwright-core does not download one; say how, rather than fail in the middle of a run
const probe = spawnSync(process.execPath, ["-e", "import('playwright-core').then(async ({chromium})=>{const p=chromium.executablePath();process.exit(require('fs').existsSync(p)?0:3)})"], { cwd: root, stdio: "ignore" })
if (probe.status === 3) { console.error("No Chromium for playwright-core. Download it once with:\n  npx playwright-core install chromium"); process.exit(2) }

console.log(`copy ${dest}, port ${port}; building (about a minute)…`)
const serve = spawnSync("bash", [join(here, "serve-copy.sh"), dest, String(port)], { cwd: root, stdio: "inherit" })
if (serve.status !== 0) process.exit(serve.status || 1)

const stop = () => spawnSync("bash", ["-c", `lsof -ti tcp:${port} | xargs kill 2>/dev/null; true`])
const ready = async () => { for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${port}/bench/catalog`)).ok) return true } catch {} await new Promise((r) => setTimeout(r, 1000)) } return false }
if (!(await ready())) { stop(); console.error("The copy did not start; see", join(dest, "start.log")); process.exit(1) }

const passthrough = args.filter((a, i) => !["--copy", "--out", "--port"].includes(a) && !["--copy", "--out", "--port"].includes(args[i - 1]))
const run = spawn(process.execPath, [join(here, "run.mjs"), "--base", `http://localhost:${port}`, "--out", out, ...passthrough], { cwd: root, stdio: "inherit" })
run.on("exit", (code) => { stop(); if (!flag("--copy") && existsSync(dest) && !args.includes("--keep")) spawnSync("rm", ["-rf", dest]); process.exit(code ?? 1) })
process.on("SIGINT", () => { stop(); process.exit(130) })
