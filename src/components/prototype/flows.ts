/**
 * Map of every screen and flow of the prototype: the Prototype controller (prototype-bar.tsx) and the start page
 * both read it, so a new screen is added once. Hrefs take the community slug. Figma frame names in `figma` help to
 * compare a screen with its design (Screens · Admin v2, Screens · Editor).
 */
export type ProtoScreen = { label: string; href: (slug: string) => string; figma?: string; soon?: boolean }
export type ProtoFlow = { id: string; label: string; screens: ProtoScreen[] }
export type ProtoArea = { id: "admin" | "editor" | "public" | "onboarding"; label: string; hint: string; flows: ProtoFlow[] }

const admin = (path = "", query = "") => (slug: string) => `/admin/${slug}${path}${query}`
const design = (query: string) => (slug: string) => `/admin/${slug}/design?${query}`
const site = (path = "") => (slug: string) => `/site/${slug}${path}`
const fixed = (path: string) => () => path

export const PROTO_AREAS: ProtoArea[] = [
  {
    id: "admin",
    label: "Admin",
    hint: "The coach's area, 15 flows",
    flows: [
      { id: "overview", label: "Overview", screens: [{ label: "Overview", href: admin(), figma: "Overview · 01" }, { label: "Getting started", href: admin("/getting-started"), figma: "Getting started · 01 Start" }] },
      { id: "students", label: "Students", screens: [{ label: "List", href: admin("/students"), figma: "Students · 01" }] },
      { id: "journal", label: "Journal & feedback", screens: [{ label: "Coming soon", href: admin("/journal"), figma: "Journal · 00", soon: true }] },
      { id: "content", label: "Content", screens: [{ label: "Courses", href: admin("/content"), figma: "Content · 01" }] },
      { id: "downloads", label: "Downloads", screens: [{ label: "Files", href: admin("/downloads"), figma: "Downloads · 01" }] },
      { id: "calendar", label: "Calendar", screens: [{ label: "Week", href: admin("/calendar"), figma: "Calendar · 01" }] },
      { id: "livestreams", label: "Livestreams", screens: [{ label: "Coming up", href: admin("/livestreams"), figma: "Livestreams · 01" }] },
      { id: "charts", label: "Charts", screens: [{ label: "Live chart", href: admin("/charts"), figma: "Charts · 01" }] },
      { id: "community", label: "Community", screens: [{ label: "Announcements", href: admin("/community"), figma: "Community · 01" }] },
      { id: "ai", label: "AI assistant", screens: [{ label: "Coming soon", href: admin("/ai"), figma: "AI assistant · 00", soon: true }] },
      {
        id: "sales",
        label: "Sales & payments",
        screens: [
          ["Overview", "overview"],
          ["Tiers & prices", "tiers"],
          ["Groups", "groups"],
          ["Access", "access"],
          ["Sales page", "page"],
          ["Coupons", "coupons"],
          ["Transactions", "transactions"],
          ["Payouts", "payouts"],
        ].map(([label, tab]) => ({ label: label!, href: admin("/sales", `?tab=${tab}`) })),
      },
      { id: "partners", label: "Partners", screens: [{ label: "Offers", href: admin("/partners"), figma: "Partners · 01" }] },
      { id: "ranking", label: "Ranking", screens: [{ label: "Leaderboard", href: admin("/ranking"), figma: "Ranking · 01" }] },
      {
        id: "settings",
        label: "Settings",
        screens: [
          ["General", "general"],
          ["Web address", "domain"],
          ["E-mails", "email"],
          ["Legal pages", "legal"],
          ["Onboarding questions", "onboarding"],
          ["Home in the first week", "firstweek"],
          ["Invoices and VAT", "tax"],
          ["Team and roles", "team"],
          ["Plan and invoices", "plan"],
        ].map(([label, tab]) => ({ label: label!, href: admin("/settings", `?tab=${tab}`) })),
      },
      { id: "tours", label: "Guided tours", screens: ["course", "tier", "payouts", "legal", "editor"].map((t) => ({ label: `Tour · ${t}`, href: admin(t === "course" ? "/content" : t === "tier" ? "/sales" : t === "payouts" ? "/sales" : t === "legal" ? "/settings" : "/design", t === "tier" ? "?tab=tiers&tour=tier" : t === "payouts" ? "?tab=payouts&tour=payouts" : t === "legal" ? "?tab=legal&tour=legal" : `?tour=${t}`) })) },
      { id: "kit", label: "Component kit", screens: [{ label: "Admin kit", href: admin("/kit") }] },
    ],
  },
  {
    id: "editor",
    label: "Editor",
    hint: "Design: the student platform",
    flows: [
      {
        id: "style",
        label: "Style",
        screens: [
          ["Brand", "brand"],
          ["Theme", "look"],
          ["Layout", "layout"],
          ["Type", "type"],
          ["Background", "shape"],
        ].map(([label, step]) => ({ label: label!, href: design(`step=${step}`), figma: `Style · ${label}` })),
      },
      {
        id: "pages",
        label: "Pages",
        screens: [
          { label: "Pages", href: design("step=pages"), figma: "Pages · 01" },
          { label: "All widgets", href: design("step=pages&scope=all"), figma: "Pages · 03" },
          { label: "Menu", href: design("step=menu"), figma: "Menu · 01" },
          { label: "Course page", href: design("step=course"), figma: "Pages panel · 03" },
        ],
      },
      {
        id: "join",
        label: "Join",
        screens: [
          ["Log in", "login"],
          ["Sign up", "signup"],
          ["Subscribe", "subscribe"],
        ].map(([label, screen]) => ({ label: label!, href: design(`step=join&screen=${screen}`), figma: `Join · ${label}` })),
      },
    ],
  },
  {
    id: "public",
    label: "Before joining",
    hint: "What a visitor sees",
    flows: [
      {
        id: "site",
        label: "Public pages",
        screens: [
          { label: "Sales page", href: site() },
          { label: "Checkout", href: site("/checkout") },
          { label: "Log in", href: site("/login") },
          { label: "Free join", href: site("/join") },
          { label: "Invite", href: site("/invite") },
          { label: "Waiting list", href: site("/waitlist") },
        ],
      },
      {
        id: "student",
        label: "Student side",
        screens: [
          { label: "Home", href: (s) => `/c/${s}` },
          { label: "Courses", href: (s) => `/c/${s}/courses` },
          { label: "Calendar", href: (s) => `/c/${s}/calendar` },
          { label: "Community", href: (s) => `/c/${s}/community` },
        ],
      },
    ],
  },
  {
    id: "onboarding",
    label: "New coach",
    hint: "Sign up and first setup",
    flows: [
      {
        id: "signup",
        label: "Sign up",
        screens: [
          ["Log in", "/signup"],
          ["Create account", "/signup/create"],
          ["Verify code", "/signup/verify"],
          ["About you", "/signup/about"],
          ["Name and language", "/signup/name"],
          ["First setup (Design)", "/setup"],
        ].map(([label, path]) => ({ label: label!, href: fixed(path!) })),
      },
    ],
  },
]

/** Community used by the start page quick links: Kairo FX, the coach the Figma screens show. */
export const PROTO_DEFAULT_SLUG = "kairo"
