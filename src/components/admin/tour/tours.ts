import { customCommunities, updateCommunity, type CustomCommunity } from "@/lib/data/communities"

/**
 * The Getting started tours (Figma section "sign up" 939:59751: Course 1014:8741…, Tier 1036:2805…, Payouts 1040:1192…,
 * Legal 1049:2788…). A tour is action driven: each step points at an element marked `data-tour="…"` and the step shown
 * is the LAST one whose target is on screen (`target` is a CSS selector, so a step can also say "this field, once named"
 * with an attribute). Doing the thing changes the screen, the next target appears, and the tour moves on by itself.
 */
export type TourId = "course" | "tier" | "payouts" | "legal"
export type Side = "bottom" | "right" | "left" | "top"

export type TourStep = {
  id: string
  /** CSS selector of the element to point at. */
  target: string
  /** The item of the progress panel this step belongs to (0 based). */
  part: number
  title: string
  body: string
  /** The line in accent under the text ("Click New course"). */
  hint: string
  side?: Side
  /** "Do it later" instead of "Skip". */
  later?: boolean
  /** The last step: the tour is done; its button goes back to Getting started. */
  final?: boolean
  /** What the pill says on this (final) step, if not the tour's done title. */
  pill?: string
}

export type Tour = {
  id: TourId
  /** Pill and panel title. */
  title: string
  /** Pill once done. */
  doneTitle: string
  /** "Your … is saved" on Getting started while paused. */
  saved: string
  /** The progress panel's items. */
  parts: string[]
  steps: TourStep[]
  /** Marks the Getting started item done. */
  complete: (slug: string) => void
  done: (c: CustomCommunity | undefined) => boolean
}

const setSetup = (slug: string, patch: NonNullable<CustomCommunity["setup"]>) => {
  const c = customCommunities().find((x) => x.slug === slug)
  if (c) updateCommunity(slug, { setup: { ...c.setup, ...patch } })
}

const t = (key: string) => `[data-tour="${key}"]`
/** No drawer open (one that is closing doesn't count). */
const NO_DRAWER = `body:not(:has([data-slot="sheet-content"]:not([data-ending-style]):not([data-closed])))`

export const TOURS: Record<TourId, Tour> = {
  course: {
    id: "course",
    title: "Add your first course",
    doneTitle: "Course added",
    saved: "Your course is saved.",
    parts: ["Start a new course", "Name your course", "Choose your videos", "Add your first lesson", "Finish the lesson"],
    complete: (slug) => setSetup(slug, { firstCourse: true }),
    done: (c) => !!c?.setup?.firstCourse,
    steps: [
      { id: "new", target: t("course-new"), part: 0, title: "Start your first course", body: "Your first course starts here. We’ll guide you one step at a time.", hint: "Click New course" },
      { id: "name", target: t("course-title"), part: 1, side: "right", title: "Name your course", body: "Pick a short name your students will see. Description and cover are optional.", hint: "Type a name, then click Continue" },
      { id: "access", target: t("course-access"), part: 1, side: "right", title: "Who can watch it?", body: "Keep All tiers for now. You’ll set up your tiers right after this course.", hint: "Click Continue" },
      { id: "method", target: `${t("course-method")}:not([data-picked])`, part: 2, side: "right", title: "Where are your videos?", body: "On your computer: Upload a folder.\nOn YouTube, Vimeo or Loom: Import links.\nNot ready yet: Start blank.", hint: "Pick one to continue" },
      { id: "folder", target: t("course-folder"), part: 2, side: "right", title: "Check your lessons", body: "Each folder became a module and each video a lesson. Files that aren’t videos are skipped.", hint: "Click Upload and create" },
      { id: "folder-drop", target: `${t("course-folder-drop")}[data-picked]`, part: 2, side: "right", title: "Drop your folder", body: "Each subfolder becomes a module and each video a lesson.", hint: "Drop the folder or click to choose it" },
      { id: "links", target: `${t("course-links")}[data-picked]`, part: 2, side: "right", title: "Paste your links", body: "Copy the link of each video and paste it here. We’ll turn each one into a lesson.", hint: "Paste, then click Import and create" },
      { id: "blank", target: `${t("course-blank")}[data-picked]`, part: 2, side: "right", title: "Start without videos", body: "We’ll create the course now. You’ll add the first video on the next screen.", hint: "Click Create course" },
      { id: "open-course", target: t("course-card"), part: 3, title: "Open your course", body: "Your course is saved. Open it to add the first lesson.", hint: "Click your course" },
      { id: "add-lesson", target: t("course-add-lesson"), part: 3, side: "right", title: "Add your first lesson", body: "Each lesson is one video. Your course needs at least one to go live.", hint: "Click Add lesson" },
      { id: "open-lesson", target: t("course-first-lesson"), part: 3, side: "right", title: "Open your first lesson", body: "Your videos keep uploading in the background. Let’s finish the first lesson.", hint: "Click the first lesson" },
      { id: "video", target: t("lesson-video"), part: 3, side: "left", later: true, title: "Add the video", body: "Drop the video file or click to choose it. No video yet? Click Do it later and we’ll keep your place.", hint: "Drop your video here" },
      { id: "lesson-name", target: `[data-tour="lesson"]:not(:has([data-tour="lesson-video"])) ${t("lesson-title")}:is(:not([data-named]), :focus-within)`, part: 4, side: "left", title: "Name the lesson", body: "Use a short, clear name. Students see it in the course list.", hint: "Type the lesson name" },
      { id: "visibility", target: `[data-tour="lesson"]:not(:has([data-tour="lesson-video"])):has([data-named]:not(:focus-within)) ${t("lesson-visibility")}[data-state="hidden"]`, part: 4, title: "Show it to students", body: "New lessons start hidden. Change Visibility to Visible when it’s ready.", hint: "Click Visibility" },
      { id: "done", target: `${t("lesson-visibility")}[data-state="visible"]`, part: 4, final: true, title: "Your first lesson is ready", body: "Your course stays a draft until you go live. You can add more lessons anytime.", hint: "" },
    ],
  },
  tier: {
    id: "tier",
    title: "Create your first tier",
    doneTitle: "Tier added",
    saved: "Your tier is saved.",
    parts: ["Start a new tier", "Name and price", "What it unlocks"],
    complete: (slug) => setSetup(slug, { firstTier: true }),
    done: (c) => !!c?.setup?.firstTier,
    steps: [
      { id: "new", target: t("tier-new"), part: 0, title: "Create your first tier", body: "Start with one. You can add more tiers anytime.", hint: "Click New tier" },
      { id: "plan", target: t("tier-plan"), part: 1, side: "left", title: "Name it and set a price", body: "Type a name and a monthly price. Students see both on your sales page.", hint: "Then click Sales page" },
      { id: "page", target: t("tier-page"), part: 2, side: "left", title: "Choose what it unlocks", body: "Your first course is already checked. Add a line or two for your sales page.", hint: "Click Save tier" },
      { id: "done", target: `${NO_DRAWER} ${t("tier-card")}[data-ready]`, part: 2, final: true, title: "Your first tier is ready", body: "Next, connect payouts so students can pay you.", hint: "" },
    ],
  },
  payouts: {
    id: "payouts",
    title: "Connect payouts",
    doneTitle: "Payouts connected",
    saved: "What you entered is saved.",
    parts: ["You are", "Bank account", "Identity check"],
    complete: (slug) => setSetup(slug, { payouts: "connected" }),
    done: (c) => c?.setup?.payouts === "connected",
    steps: [
      { id: "start", target: t("payouts-start"), part: 0, title: "Connect payouts", body: "This is how the money from your sales reaches you. Three short steps, about 5 minutes.", hint: "Click Start" },
      { id: "next", target: t("payouts-next"), part: 1, title: "Pick up where you left off", body: "What you entered is saved. Carry on with the next step.", hint: "Click Continue" },
      { id: "you", target: t("payouts-you"), part: 0, side: "left", title: "Tell us who gets paid", body: "Pick person or company and your country. Use your name exactly as on your ID.", hint: "Then click Continue" },
      { id: "bank", target: t("payouts-bank"), part: 1, side: "left", title: "Add your bank account", body: "Your money arrives here every Monday. The account must be in your name.", hint: "Then click Save" },
      { id: "id", target: t("payouts-id"), part: 2, side: "left", title: "Check your identity", body: "Our payment partner checks your ID once. It usually takes a few minutes.", hint: "Upload it, then click Submit" },
      { id: "review", target: `${NO_DRAWER} ${t("payouts-connected")}[data-state="review"]`, part: 2, final: true, pill: "ID in review", title: "We’re checking your ID", body: "Usually a few minutes, sometimes up to 2 days. Keep setting up; we’ll e-mail you when it’s done.", hint: "" },
      { id: "done", target: `${NO_DRAWER} ${t("payouts-connected")}[data-state="connected"]`, part: 2, final: true, title: "Payouts are connected", body: "You’ll get paid every Monday. Next, add your legal pages.", hint: "" },
    ],
  },
  legal: {
    id: "legal",
    title: "Add your legal pages",
    doneTitle: "Legal pages added",
    saved: "What you entered is saved.",
    parts: ["Start with the imprint", "Fill in your imprint", "Check the templates"],
    complete: (slug) => setSetup(slug, { legal: true }),
    done: (c) => !!c?.setup?.legal,
    steps: [
      { id: "start", target: t("legal-imprint-setup"), part: 0, title: "Add your legal pages", body: "Students see them in your footer and at checkout. Start with the imprint. We have templates for the rest.", hint: "Click Set up next to Imprint" },
      { id: "next", target: t("legal-next"), part: 2, title: "Check the templates", body: "Privacy policy, terms and risk disclaimer come pre-filled with your details. Read each one and change what doesn’t fit.", hint: "Click Set up" },
      { id: "imprint", target: t("legal-imprint"), part: 1, side: "left", title: "Fill in your imprint", body: "The law asks who runs the platform and how to reach you.", hint: "Then click Save" },
      { id: "template", target: t("legal-template"), part: 2, side: "left", title: "Check the templates", body: "Privacy policy, terms and risk disclaimer come pre-filled with your details. Read each one and change what doesn’t fit.", hint: "Then click Use this text" },
      { id: "done", target: `${NO_DRAWER} ${t("legal-table")}[data-complete]`, part: 2, final: true, title: "Your legal pages are ready", body: "Students find them in your footer and at checkout. One step left: go live.", hint: "" },
    ],
  },
}

export const isTourId = (v: string | null): v is TourId => !!v && v in TOURS

/** What the admin remembers about the tour in progress (per platform). */
export type TourState = { id: TourId; started: boolean; panel: boolean; done?: boolean; /** The furthest step reached, for "Paused at …". */ at?: string; /** The page it was on, so Resume goes back there. */ path?: string } | null
export const tourKey = (slug: string) => `${slug}:tour`
