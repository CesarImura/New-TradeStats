// node flowdiff.mjs flow.json : for every failing restore/persist/student record, where the two raw signatures first differ (flow run with --raw true)
import { readFileSync } from "node:fs"
const r = JSON.parse(readFileSync(process.argv[2], "utf8"))
for (const x of r) {
  if (!["restored", "persist", "student"].includes(x.status) || x.effect !== false) continue
  const A = x.before ?? x.comb, B = x.back ?? x.reloaded ?? x.stu
  if (!A?.raw || !B?.raw) { console.log(x.type, x.control, "(no raw)"); continue }
  let i = 0; while (A.raw[i] === B.raw[i] && i < A.raw.length) i++
  console.log(`\n## ${x.type} ${x.variant} | ${x.control} | ${x.option.slice(0, 50)}\nA: ...${A.raw.slice(Math.max(0, i - 90), i + 160)}\nB: ...${B.raw.slice(Math.max(0, i - 90), i + 160)}`)
}
