import type { Coach } from "@/lib/data/coaches"
import type { ContentDraft, ThemeDraft } from "@/lib/prototype-store"
import { TEMPLATES } from "./templates"
import type { CoachTheme, TemplateId } from "./types"
import { defaultHome, type PageLayout } from "@/lib/widgets/layout"

/** The coach with their saved name, logo, words, menu and modules applied. */
export function resolveCoach(coach: Coach, c: ContentDraft = {}): Coach {
  return {
    ...coach,
    name: c.name || coach.name,
    mark: c.mark || coach.mark,
    logo: c.logo ?? coach.logo,
    wording: { ...coach.wording, ...c.wording },
    menu: c.menu ?? coach.menu,
    modules: { ...coach.modules, ...c.modules },
    home: c.home ?? coach.home,
  }
}

/** The Home a student in this tier sees: the tier's own layout, the coach's default, or the template's. */
export function homeLayout(coach: Coach, template: TemplateId, tier?: string): PageLayout {
  return (tier && coach.home?.[tier]) || coach.home?.default || defaultHome(template, coach)
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
