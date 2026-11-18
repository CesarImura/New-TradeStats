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
  for (let i = 0; out.length < count; i++) {
    const name = `${FIRST[(i * 7 + Math.floor(r() * 3)) % FIRST.length]} ${LAST[(i * 11 + Math.floor(r() * 5)) % LAST.length]}`
    if (used.has(name)) continue
    used.add(name)
    const tier = tiers[out.length] ?? "core"
    const roll = r()
    const health = roll < 0.03 ? "red" : roll < 0.08 ? "amber" : "green"
    const reasonFor = { red: ["Payment failed", "Broke loss limit", "No activity for 2 weeks"], amber: ["Rules kept below 70%", "Stuck in Module 2", "Skipped three lives"], green: [] as string[] }[health]
    const monthsAgo = 1 + Math.floor(r() * 9)
    const joinedMonth = Math.max(0, 10 - monthsAgo)
    const [first, last] = name.split(" ")
    out.push({
      id: `s${existing.length + out.length + 1}`,
      name,
      initials: `${first![0]}${last![0]}`,
      email: `${first!.toLowerCase()}.${last!.toLowerCase()}@mail.com`,
      tier,
      progress: Math.round(5 + r() * 90),
      lastActive: health === "red" ? LAST_ACTIVE[6 + Math.floor(r() * 3)]! : LAST_ACTIVE[Math.floor(r() * 6)]!,
      activeDays: health === "red" ? Math.floor(r() * 4) : 4 + Math.floor(r() * 10),
      health,
      reason: reasonFor.length ? reasonFor[Math.floor(r() * reasonFor.length)] : undefined,
      joined: `${1 + Math.floor(r() * 27)} ${MONTHS[joinedMonth]} 2025`,
      paid: tier === "free" ? 0 : Math.round((tier === "vip" ? 390 : tier === "desk" ? 129 : 49) * (1 + r() * 9)),
      broker: r() > 0.5,
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
