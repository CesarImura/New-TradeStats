import { DEFAULT_WORDING, isPageId, pageIdOf, type Coach, type MenuId, type ModuleId } from "@/lib/data/coaches"
import type { ContentDraft, ThemeDraft } from "@/lib/prototype-store"
import { contrast } from "./contrast"
import { onColor } from "./derive"
import { TEMPLATES } from "./templates"
import type { CoachTheme, TemplateId } from "./types"
import { defaultCustomPage, defaultHome, defaultPage, normalizeLayout, templatePage, withCore, type PageId, type PageLayout } from "@/lib/widgets/layout"

/** The coach with their saved name, logo, words, menu and modules applied. */
export function resolveCoach(coach: Coach, c: ContentDraft = {}): Coach {
  // Menus saved before a module existed don't list it yet: add it at the end, switched off.
  const customPages = c.customPages ?? coach.customPages ?? []
  const menu = (c.menu ?? coach.menu).filter((m) => !isPageId(m) || customPages.some((p) => p.id === pageIdOf(m)))
  const all = Object.keys(DEFAULT_WORDING).filter((k) => !["home", "student", "students", "lesson"].includes(k)) as ModuleId[]
  return {
    ...coach,
    name: c.name || coach.name,
    tagline: c.tagline || coach.tagline,
    mark: c.mark || coach.mark,
    logo: c.logo ?? coach.logo,
    wording: { ...DEFAULT_WORDING, ...coach.wording, ...c.wording },
    menu: [...menu, ...all.filter((m) => !menu.includes(m)), ...customPages.map((p) => `page:${p.id}` as MenuId).filter((m) => !menu.includes(m))],
    customPages,
    modules: { ...Object.fromEntries(all.map((m) => [m, false])), ...coach.modules, ...c.modules } as Coach["modules"],
    pages: pagesOf(coach, c),
    join: c.join ?? coach.join,
    coursePage: c.coursePage ?? coach.coursePage,
  }
}

/** Saved page layouts, with Home taken from the older `home` field when pages.home isn't there yet. */
function pagesOf(coach: Coach, c: ContentDraft) {
  const pages = { ...coach.pages, ...c.pages }
  const home = c.pages?.home ?? c.home ?? coach.pages?.home ?? coach.home
  return home ? { ...pages, home } : pages
}

/**
 * The layout a student in this tier sees on a page: the tier's own layout,
 * the coach's default, or the starting one (the template's layout for that
 * page, else a module page's title and core widget on their own).
 */
export function pageLayout(
  coach: Coach,
  page: PageId,
  template: TemplateId,
  tier?: string,
  heightOf?: (w: { type: string; variant?: string }) => number,
): PageLayout {
  const layouts = coach.pages?.[page]
  const saved = (tier && layouts?.[tier]) || layouts?.default
  if (isPageId(page)) return saved ? normalizeLayout(saved, heightOf) : defaultCustomPage(pageIdOf(page))
  if (page === "home") return saved ? normalizeLayout(saved, heightOf) : defaultHome(template, coach)
  if (saved) return withCore(page, normalizeLayout(saved, heightOf))
  const start = templatePage(template, page, coach)
  return start ? withCore(page, start) : defaultPage(page)
}

/**
 * The theme a student actually sees: the template the coach is on, then the
 * coach's saved changes, then unpublished changes from the editor.
 * Switching template keeps the coach's brand colour.
 */
export function resolveTheme(coach: Coach, draft: ThemeDraft = {}): CoachTheme {
  const templateId = draft.template ?? coach.template
  const base = TEMPLATES[templateId].theme
  const keepBrand = templateId !== coach.template ? { primary: coach.overrides.primary ?? TEMPLATES[coach.template].theme.primary } : {}
  const layers: ThemeDraft[] = [templateId === coach.template ? coach.overrides : keepBrand, draft]
  const merged = layers.reduce<CoachTheme>(
    (acc, l) => ({
      ...acc,
      ...l,
      template: templateId,
      nav: { ...acc.nav, ...l.nav },
      fonts: { ...acc.fonts, ...l.fonts },
      // Single colours from the template palette editor (prototype); everything else stays the template's.
      palettes: { light: { ...acc.palettes.light, ...l.palettes?.light }, dark: { ...acc.palettes.dark, ...l.palettes?.dark } },
    }),
    base,
  )
  // The brand colour can come from one place and its text colour from another (a template switched in
  // the editor keeps the coach's colour, not the template's white or black on it). When the coach didn't
  // choose the text colour, it follows the brand colour so buttons always read.
  const chosen = layers.some((l) => l.primaryForeground !== undefined)
  if (!chosen && contrast(merged.primaryForeground, merged.primary) < 4.5) return { ...merged, primaryForeground: onColor(merged.primary) }
  return merged
}

