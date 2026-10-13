import type { Coach } from "./coaches"

/**
 * Prototype-only: communities created through the setup wizard, and the
 * signed-up coach's account. Both live in localStorage, standing in for the
 * backend, so a new community opens at /c/[slug] and /admin/[slug] like the
 * demo ones.
 */

export type CourseDraft = { id: string; title: string; lessons: { id: string; title: string; minutes: number }[] }

export type CustomCommunity = Coach & {
  status: "setup" | "live"
  createdAt: string
  /** The address the coach picked; the community moves there when it's published. */
  address?: string
  /** What the setup wizard collected beyond the platform itself. */
  setup?: {
    courses?: CourseDraft[]
    payouts?: "connected" | "later"
    invited?: number
  }
}

export type Audience = "starting" | "small" | "growing" | "large"

/** Who signed up, what they answered, and where they are in onboarding. */
export type Account = {
  name: string
  email: string
  /** Pre-approved by us: skips the questions (route A). */
  approved: boolean
  verified: boolean
  answers?: { audience: Audience; tools: string[]; offers: string[] }
  /** A: pre-approved, B: setup call, C: wizard on their own. */
  route?: "A" | "B" | "C"
  call?: { date: string; time: string }
  /** The community the wizard is building. */
  setupSlug?: string
  step?: number
}

const KEY = "proto:communities"
const ACCOUNT = "proto:account"

const listeners = new Set<() => void>()
const cache = new Map<string, { raw: string | null; value: unknown }>()

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(key)
  } catch {}
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.value as T
  let value = fallback
  try {
    if (raw) value = JSON.parse(raw)
  } catch {}
  cache.set(key, { raw, value })
  return value
}

function write(key: string, value: unknown) {
  try {
    if (value == null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {}
  listeners.forEach((l) => l())
}

export function subscribe(cb: () => void) {
  listeners.add(cb)
  const onStorage = (e: StorageEvent) => (e.key === KEY || e.key === ACCOUNT) && cb()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(cb)
    window.removeEventListener("storage", onStorage)
  }
}

export const NONE: CustomCommunity[] = []

// ---------- communities

export function customCommunities(): CustomCommunity[] {
  if (typeof window === "undefined") return NONE
  return read(KEY, NONE)
}

export function saveCommunity(c: CustomCommunity) {
  const list = customCommunities()
  write(KEY, list.some((x) => x.slug === c.slug) ? list.map((x) => (x.slug === c.slug ? c : x)) : [...list, c])
}

export function updateCommunity(slug: string, patch: Partial<CustomCommunity>) {
  const c = customCommunities().find((x) => x.slug === slug)
  if (c) saveCommunity({ ...c, ...patch })
}

/** Moves a community to a new address, with its saved design. */
export function renameSlug(from: string, to: string) {
  if (from === to) return
  write(
    KEY,
    customCommunities().map((x) => (x.slug === from ? { ...x, slug: to } : x)),
  )
  for (const kind of ["pub", "draft", "history"]) {
    try {
      const v = localStorage.getItem(`proto:${kind}:${from}`)
      if (v) localStorage.setItem(`proto:${kind}:${to}`, v)
      localStorage.removeItem(`proto:${kind}:${from}`)
    } catch {}
  }
}

export function deleteCommunity(slug: string) {
  write(
    KEY,
    customCommunities().filter((x) => x.slug !== slug),
  )
  for (const kind of ["pub", "draft", "history"]) {
    try {
      localStorage.removeItem(`proto:${kind}:${slug}`)
    } catch {}
  }
}

/** An address from a name: "Momentum Lab!" → "momentum-lab". */
export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
}

// ---------- account

export function account(): Account | null {
  if (typeof window === "undefined") return null
  return read<Account | null>(ACCOUNT, null)
}

export function setAccount(patch: Partial<Account> | null) {
  if (patch === null) return write(ACCOUNT, null)
  const cur = account() ?? { name: "", email: "", approved: false, verified: false }
  write(ACCOUNT, { ...cur, ...patch })
}

/** Prototype stand-in for "we pre-approved this e-mail". */
export function isPreApproved(email: string) {
  return /@(approved|vip)\./i.test(email) || /\+vip@/i.test(email)
}
