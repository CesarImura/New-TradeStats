import type { CoachTheme } from "@/lib/theme/types"

/**
 * The screens people pass through to join: log in, sign up, subscribe. The coach edits them in Design → Join:
 * the words and layout of each screen, and one look shared by all of them that never touches the platform itself.
 */

export type JoinScreenId = "login" | "signup" | "subscribe"

export const JOIN_SCREENS: { id: JoinScreenId; label: string; hint: string; route: string }[] = [
  { id: "login", label: "Log in", hint: "Where members come back", route: "login" },
  { id: "signup", label: "Sign up", hint: "Where a free member joins", route: "join" },
  { id: "subscribe", label: "Subscribe", hint: "Where a plan is bought", route: "checkout" },
]

/** The pages that take the Join look: the three above, plus the invite and waiting-list pages that sit beside them. */
const JOIN_ROUTES = ["login", "join", "invite", "checkout", "waitlist", "welcome"]
export const isJoinPath = (path: string, base: string) => JOIN_ROUTES.some((r) => path === `${base}/${r}` || path.startsWith(`${base}/${r}/`))

export type JoinCopy = {
  title?: string
  subtitle?: string
  /** The main button (Log in, Sign up). */
  button?: string
  /** Centered: one card. Split: a picture beside it. */
  layout?: "center" | "split"
  /** An uploaded picture (data URL) for the Split layout. */
  sideImage?: string
  /** Show "Continue with Discord". */
  discord?: boolean
}

/** What the Join look can change. Colour, corners, card and background: the smallest set that gives these screens an identity. */
export type JoinLook = Partial<Pick<CoachTheme, "background" | "bgImage" | "bgDim" | "bgBlur" | "bgAngle" | "primary" | "primaryForeground" | "radius" | "cardSurface">>

export type JoinDraft = {
  /** Missing: the screens follow the platform's look. Present (even empty): the coach made their own. */
  look?: JoinLook
  screens?: Partial<Record<JoinScreenId, JoinCopy>>
}

/** The platform theme with the Join look on top, for the Join screens only. */
export const joinTheme = (theme: CoachTheme, look: JoinLook): CoachTheme => ({ ...theme, ...look })
