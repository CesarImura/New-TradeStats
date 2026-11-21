// Varre textos de interface (strings e texto JSX) em src/ atrás de marcas de texto genérico ou com cara de IA.
// Uso: node scripts/maps/copy-scan.mjs [--all]  (lista file:linha | padrão | texto). Não altera nada.
import fs from "node:fs"; import path from "node:path"
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..")
const P = [
  ["successfully", /\bsuccessfully\b/i], ["oops", /\b(oops|whoops|uh oh|oh no)\b/i], ["something went wrong", /something went wrong/i],
  ["please (rotina)", /\bplease\b/i], ["let's", /\blet'?s\b/i], ["hype", /\b(seamless(ly)?|effortless(ly)?|supercharge|elevate|boost your|level up|take your .* to the next level|game.?chang|unleash|empower|revolutioni[sz]e|cutting.edge|world.class)\b/i],
  ["unlock (figurado)", /\bunlock (your|the full|all)\b/i], ["journey", /\bjourney\b/i], ["powerful", /\bpowerful\b/i], ["in one place", /\b(all )?in one place\b/i],
  ["simply/easily/just", /\b(simply|easily|in just|with ease)\b/i], ["exclamação", /[a-z]!(\s|"|$)/i], ["are you sure", /are you sure/i], ["click here", /click here/i],
  ["learn more solto", /^learn more\.?$/i], ["em dash em frase", /\w — \w/], ["ai words", /\b(delve|robust|streamline|crucial|pivotal|vibrant|tapestry|meticulous|showcase)\b/i],
  ["all set / ready to", /\b(you'?re all set|ready to (go|get started))\b/i], ["congrats", /\b(congrat\w*|awesome|great job|well done|woohoo|hooray)\b/i],
]
const out = []
;(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.tsx?$/.test(f)) scan(p) } })(path.join(root, "src"))
function scan(file) {
  const src = fs.readFileSync(file, "utf8").split("\n")
  src.forEach((line, i) => {
    const t = line.trim(); if (t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) return
    const texts = [...line.matchAll(/"([^"\n]{3,})"|'([^'\n]{3,})'|`([^`\n]{3,})`|>([^<>{}\n]{3,})</g)].map((m) => m[1] || m[2] || m[3] || m[4]).filter((s) => /[a-z]{3,} [a-z]/i.test(s) && !/^[a-z-]+( [a-z0-9:/[\].-]+)+$/.test(s))
    for (const s of texts) for (const [name, re] of P) if (re.test(s)) out.push(`${path.relative(root, file)}:${i + 1} | ${name} | ${s.slice(0, 140)}`)
  })
}
console.log(out.length + " ocorrências"); console.log(out.join("\n"))
