import { DEFAULT_WORDING, type Coach, type ModuleId } from "@/lib/data/coaches"
import type { ContentDraft, ThemeDraft } from "@/lib/prototype-store"
import { TEMPLATES } from "./templates"
import type { CoachTheme, TemplateId } from "./types"
import { defaultHome, normalizeLayout, type PageLayout } from "@/lib/widgets/layout"

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
    home: c.home ?? coach.home,
  }
}

/** The Home a student in this tier sees: the tier's own layout, the coach's default, or the template's. */
export function homeLayout(coach: Coach, template: TemplateId, tier?: string, heightOf?: (w: { type: string; variant?: string }) => number): PageLayout {
  const saved = (tier && coach.home?.[tier]) || coach.home?.default
  return saved ? normalizeLayout(saved, heightOf) : defaultHome(template, coach)
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

