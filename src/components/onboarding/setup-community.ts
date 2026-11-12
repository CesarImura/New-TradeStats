import { LOOKS } from "@/components/admin/design/looks"
import { COACHES, DEFAULT_WORDING } from "@/lib/data/coaches"
import { customCommunities, saveCommunity, setAccount, slugify, type Account } from "@/lib/data/communities"
import { EMPTY, mergeOverrides, setDraft } from "@/lib/prototype-store"
import { suggestedModules, suggestedTemplate } from "./suggest"

/** Words that can't be a platform address. */
const RESERVED = ["admin", "app", "www", "help", "api", "login", "signup", "setup", "tradestats", "traderhub"]

/** An address someone else already uses (a demo coach, another community made on this browser, or a reserved word). */
export function addressTaken(address: string, ownSlug?: string) {
  return RESERVED.includes(address) || COACHES.some((c) => c.slug === address) || customCommunities().some((c) => c.slug !== ownSlug && (c.slug === address || c.address === address))
}

/** The address suggested from the platform name; a number is added when it is taken ("lio-trading-floor-2"). */
export function suggestAddress(name: string, ownSlug?: string) {
  const base = slugify(name) || "my-platform"
  if (!addressTaken(base, ownSlug)) return base
  for (let n = 2; n < 100; n++) if (!addressTaken(`${base}-${n}`, ownSlug)) return `${base}-${n}`
  return `${base}-${Date.now().toString(36).slice(-4)}`
}

/**
 * Sign up · 05 makes the coach's platform: a draft (status "setup") at the suggested address, on the look and modules
 * that fit their answers. The Getting started page takes it from there; nothing is public until Go live.
 */
export function createCommunity({ name, coachName, language, account }: { name: string; coachName: string; language: string; account: Account | null }) {
  const slug = suggestAddress(name)
  const template = suggestedTemplate(account?.answers)
  saveCommunity({
    slug,
    org: account?.name || coachName,
    name,
    coachName,
    mark: (name.trim()[0] || coachName.trim()[0] || "T").toUpperCase(),
    tagline: "",
    template,
    overrides: {},
    wording: DEFAULT_WORDING,
    modules: suggestedModules(account?.answers),
    menu: ["courses", "calendar", "charts", "journal", "community", "ai", "ranking", "downloads", "partners"],
    tiers: [],
    status: "setup",
    createdAt: new Date().toISOString(),
    address: slug,
    setup: { language },
  })
  // Start on the look that fits, as picking it in Design would.
  const look = LOOKS.find((l) => l.template === template)
  if (look) setDraft(slug, mergeOverrides(EMPTY, { theme: { template: look.template, ...look.set } }))
  setAccount({ setupSlug: slug, step: undefined })
  return slug
}
