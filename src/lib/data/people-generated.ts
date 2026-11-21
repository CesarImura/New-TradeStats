import type { Student } from "./people"

/**
 * The rest of the roster: Kairo FX has 201 students in the Figma (142 Inner Circle, 38 Trading Desk, 9 1:1 VIP, 12 free).
 * The ten written by hand stay in people.ts; this fills the list up to that count, the same on every load (seeded, no Math.random).
 */
const FIRST = ["Lena", "Tomas", "Aiko", "Mateo", "Sofia", "Jonas", "Priya", "Luca", "Ines", "Marek", "Yuki", "Noah", "Elena", "Omar", "Clara", "Felix", "Nadia", "Ravi", "Hana", "Diego", "Freya", "Kasper", "Leila", "Viktor", "Maya", "Ivan", "Zoe", "Anton", "Rosa", "Theo"]
const LAST = ["Ito", "Berg", "Silva", "Novak", "Rossi", "Haas", "Costa", "Weber", "Lund", "Duarte", "Kim", "Moreno", "Petrov", "Nair", "Bauer", "Santos", "Frey", "Olsen", "Koch", "Ricci", "Tanaka", "Lopez", "Meyer", "Horvat", "Dalla", "Ernst", "Vogel", "Reyes", "Aydin", "Brandt"]
const COUNTRY = ["DE", "FR", "ES", "IT", "NL", "PT", "PL", "SE", "CH", "AT", "BE", "IE", "GB", "FI", "DK"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const LAST_ACTIVE = ["today", "today", "today", "yesterday", "2 d ago", "3 d ago", "5 d ago", "1 w ago", "2 w ago"]

const rng = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

export function generatedStudents(existing: Student[], total = 201): Student[] {
  const want: Record<string, number> = { core: 142, desk: 38, vip: 9, free: 12 }
  for (const s of existing) if (want[s.tier] !== undefined) want[s.tier] = Math.max(0, want[s.tier] - 1)
  const tiers = Object.entries(want).flatMap(([t, n]) => Array.from({ length: n }, () => t))
  const r = rng(20251112)
  // Shuffle the tiers so the list does not read as blocks.
  for (let i = tiers.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[tiers[i], tiers[j]] = [tiers[j]!, tiers[i]!]
  }
  const used = new Set(existing.map((s) => s.name))
  const out: Student[] = []
  const count = Math.max(0, total - existing.length)
  // Kairo's counts in Figma (Students 01): 3 payment issues, 7 at risk and 12 invited in all. The written students already hold
  // 1 payment issue, 3 at risk and 2 invited, so the generated ones add 2, 4 and 10; the rest are fine. Placed by the seed, not at random.
  const roles: ("payment" | "risk" | "invited" | "ok")[] = [...Array(2).fill("payment"), ...Array(4).fill("risk"), ...Array(10).fill("invited"), ...Array(Math.max(0, count - 16)).fill("ok")]
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[roles[i], roles[j]] = [roles[j]!, roles[i]!]
  }
  // Figma Students 01 says 86 active this week (activeDays 10 or more of 14): with the 8 written ones that is 78 of the fine ones, spread by a stride.
  let fine = 0
  for (let i = 0; out.length < count; i++) {
    const name = `${FIRST[(i * 7 + Math.floor(r() * 3)) % FIRST.length]} ${LAST[(i * 11 + Math.floor(r() * 5)) % LAST.length]}`
    if (used.has(name)) continue
    used.add(name)
    const tier = tiers[out.length] ?? "core"
    const role = roles[out.length] ?? "ok"
    const health: Student["health"] = role === "payment" ? "red" : role === "ok" ? "green" : "amber"
    const reasonFor = role === "risk" ? ["Rules kept below 70%", "Stuck in Module 2", "Skipped three lives", "No activity for 2 weeks"] : []
    const invitedDays = 3 + Math.floor(r() * 9)
    const okIdx = role === "ok" ? fine++ : -1
    const active = okIdx >= 0 && (okIdx * 37) % Math.max(1, count - 16) < 78
    // Figma says 14 joined this month (Oct 13 to Nov 12): 4 written ones plus 10 of these.
    const recentJoin = okIdx >= 0 && (okIdx * 53) % Math.max(1, count - 16) < 10
    const monthsAgo = 2 + Math.floor(r() * 9)
    const joinedMonth = Math.max(0, 10 - monthsAgo)
    const [first, last] = name.split(" ")
    out.push({
      id: `s${existing.length + out.length + 1}`,
      name,
      initials: `${first![0]}${last![0]}`,
      email: `${first!.toLowerCase()}.${last!.toLowerCase()}@mail.com`,
      tier,
      progress: role === "invited" ? Math.floor(r() * 9) : Math.round(5 + r() * 90),
      lastActive: role === "invited" ? "never" : role === "payment" || role === "risk" ? LAST_ACTIVE[6 + Math.floor(r() * 3)]! : LAST_ACTIVE[Math.floor(r() * 6)]!,
      activeDays: role === "invited" ? 0 : role === "payment" || role === "risk" ? Math.floor(r() * 4) : active ? 10 + Math.floor(r() * 4) : 4 + Math.floor(r() * 6),
      health,
      reason: role === "payment" ? "Payment failed" : role === "invited" ? `Invited ${invitedDays} days ago, hasn't joined` : reasonFor.length ? reasonFor[Math.floor(r() * reasonFor.length)] : undefined,
      joined: role === "invited" ? `invited ${Math.max(1, 12 - invitedDays)} Nov` : recentJoin ? `${1 + Math.floor(r() * 12)} Nov 2025` : `${1 + Math.floor(r() * 27)} ${MONTHS[joinedMonth]} 2025`,
      paid: tier === "free" ? 0 : Math.round((tier === "vip" ? 390 : tier === "desk" ? 129 : 49) * (1 + r() * 9)),
      broker: role === "invited" ? false : r() > 0.5,
      discord: r() > 0.35,
      country: COUNTRY[Math.floor(r() * COUNTRY.length)]!,
      trades30: Math.floor(r() * 45),
      rules: Math.round(55 + r() * 40),
      notes: [],
      history: [{ when: "Mon 10 Nov", text: tier === "free" ? "Joined the free community" : "Renewed" }],
    })
  }
  return out
}
