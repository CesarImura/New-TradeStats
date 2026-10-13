import { COACHES, type Coach } from "./coaches"

// Who is signed in. In the real product this comes from the session.

export type AdminRole = "Owner" | "Assistant coach" | "Moderator" | "Operator"

/** A team member who works in several workspaces, e.g. an operator or an agency. */
export const DEMO_ADMIN = {
  name: "Lionel Lüthi",
  initials: "LL",
  email: "lionel@northline.example",
  memberships: [
    { slug: "northline", role: "Owner" as AdminRole, lastOpened: "now" },
    { slug: "northline-options", role: "Owner" as AdminRole, lastOpened: "yesterday" },
    { slug: "kairo", role: "Operator" as AdminRole, lastOpened: "3 days ago" },
    { slug: "sophia", role: "Assistant coach" as AdminRole, lastOpened: "last week" },
  ],
}

/** A trader who is a member of more than one community. */
export const DEMO_STUDENT_COMMUNITIES = ["northline", "northline-options", "kairo"]

/** Pass the communities made with the setup wizard; the signed-in admin owns those. */
export function adminWorkspaces(created: Coach[] = []) {
  const demo = DEMO_ADMIN.memberships
    .map((m) => ({ ...m, coach: COACHES.find((c) => c.slug === m.slug) as Coach }))
    .filter((m) => m.coach)
  const own = created.map((coach) => ({ slug: coach.slug, role: "Owner" as AdminRole, lastOpened: "new", coach }))
  return [...own, ...demo]
}

/** Workspaces grouped by business, in the order the admin sees them. */
export function adminWorkspacesByOrg(created: Coach[] = []) {
  const groups = new Map<string, ReturnType<typeof adminWorkspaces>>()
  for (const w of adminWorkspaces(created)) groups.set(w.coach.org, [...(groups.get(w.coach.org) ?? []), w])
  return [...groups.entries()].map(([org, items]) => ({ org, items }))
}
