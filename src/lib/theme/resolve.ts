import { DEFAULT_WORDING, type Coach, type ModuleId } from "@/lib/data/coaches"
import type { ContentDraft, ThemeDraft } from "@/lib/prototype-store"
import { TEMPLATES } from "./templates"
import type { CoachTheme, TemplateId } from "./types"
import { defaultHome, defaultPage, normalizeLayout, withCore, type PageId, type PageLayout } from "@/lib/widgets/layout"

/** The coach with their saved name, logo, words, menu and modules applied. */
export function resolveCoach(coach: Coach, c: ContentDraft = {}): Coach {
  // Menus saved before a module existed don't list it yet: add it at the end, switched off.
  const menu = c.menu ?? coach.menu
  const all = Object.keys(DEFAULT_WORDING).filter((k) => !["home", "student", "students", "lesson"].includes(k)) as ModuleId[]
  return {
    ...coach,
    name: c.name || coach.name,
    mark: c.mark || coach.mark,
    logo: c.logo ?? coach.logo,
    wording: { ...DEFAULT_WORDING, ...coach.wording, ...c.wording },
    menu: [...menu, ...all.filter((m) => !menu.includes(m))],
    modules: { ...Object.fromEntries(all.map((m) => [m, false])), ...coach.modules, ...c.modules } as Coach["modules"],
    pages: pagesOf(coach, c),
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
 * the coach's default, or the starting one (the template's Home, or a module
 * page's core widget on its own).
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
  if (page === "home") return saved ? normalizeLayout(saved, heightOf) : defaultHome(template, coach)
  return saved ? withCore(page, normalizeLayout(saved, heightOf)) : defaultPage(page)
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
  return layers.reduce<CoachTheme>(
    (acc, l) => ({
      ...acc,
      ...l,
      template: templateId,
      nav: { ...acc.nav, ...l.nav },
      fonts: { ...acc.fonts, ...l.fonts },
      palettes: acc.palettes,
    }),
    base,
  )
}

