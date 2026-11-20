/**
 * What the coach is told about, and where. One list for both places that need it: the Settings page "Notifications" (the switches)
 * and the bell panel in the topbar (it hides what is switched off for the panel). Journal requests are not here: Journal is "Soon".
 *
 * Decided 20/11 from the notifications research (docs/notificacoes-pesquisa-2026-11-20.md):
 * - Some notices cannot be switched off (security, plan and invoices, what our payment partner needs): service messages.
 * - E-mail is on by default only for what needs action (a failed payment). Everything else starts in the bell only.
 * - The daily summary and our own product news start off; the news is a choice the coach makes (GDPR art. 7, ePrivacy art. 13).
 */
export type NoticeKind = "failed" | "sale" | "live" | "upload"

export type NoticeKindInfo = { id: NoticeKind; name: string; when: string; panel: boolean; email: boolean }

/** Switchable alerts. */
export const NOTICE_KINDS: NoticeKindInfo[] = [
  { id: "failed", name: "Payment failed", when: "A student's card was declined", panel: true, email: true },
  { id: "sale", name: "New sale", when: "Someone joins a plan or buys an offer", panel: true, email: false },
  { id: "live", name: "Livestream reminder", when: "One hour before you go live", panel: true, email: false },
  { id: "upload", name: "Upload finished", when: "A lesson video is ready to publish", panel: true, email: false },
]

/** Always on: the coach can read them here but not switch them off. */
export const REQUIRED_NOTICES: { id: string; name: string; when: string }[] = [
  { id: "security", name: "Security", when: "A new sign-in, or a change to your password or e-mail" },
  { id: "plan", name: "Plan and invoices", when: "Your Traderhub plan, its invoices and changes to the terms" },
  { id: "payouts", name: "Payouts", when: "Our payment partner needs a document or a check from you" },
]

export type NoticePrefs = {
  kinds: Partial<Record<NoticeKind, { panel?: boolean; email?: boolean }>>
  /** One e-mail each morning, only on days something happened. */
  daily: boolean
  /** Tips and new features from us. Off until the coach turns it on. */
  news: boolean
}

export const DEFAULT_NOTICE_PREFS: NoticePrefs = { kinds: {}, daily: false, news: false }

/** Is this kind shown in the bell panel? On unless the coach switched it off. */
export const panelOn = (prefs: NoticePrefs, kind: NoticeKind) => prefs.kinds[kind]?.panel ?? NOTICE_KINDS.find((k) => k.id === kind)!.panel
export const emailOn = (prefs: NoticePrefs, kind: NoticeKind) => prefs.kinds[kind]?.email ?? NOTICE_KINDS.find((k) => k.id === kind)!.email

/**
 * Where the coach's choices live. Not "notifications": the student profile already stores ITS switches under that key
 * (`<slug>:notifications`), and one overwrote the other (QA 20/11: after a student switch, the Admin shell broke).
 */
export const NOTICE_PREFS_KEY = "admin-notification-prefs"
/** Which notices the coach has read, so the bell remembers after a reload. */
export const NOTICE_READ_KEY = "admin-notification-read"

/** Anything stored (older versions, hand edits, another feature) comes back as a valid NoticePrefs. */
export function normalizePrefs(raw: unknown): NoticePrefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<NoticePrefs>
  const kinds: NoticePrefs["kinds"] = {}
  const given = r.kinds && typeof r.kinds === "object" ? (r.kinds as NoticePrefs["kinds"]) : {}
  for (const k of NOTICE_KINDS) {
    const v = given[k.id]
    if (v && typeof v === "object") kinds[k.id] = { panel: typeof v.panel === "boolean" ? v.panel : undefined, email: typeof v.email === "boolean" ? v.email : undefined }
  }
  return { kinds, daily: r.daily === true, news: r.news === true }
}
