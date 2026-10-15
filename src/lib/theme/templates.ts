import type { PageId, WidgetInstance } from "@/lib/widgets/layout"
import type { CoachTheme, TemplateId } from "./types"
import data from "./template-data.json"

/** A page as a template stores it: widgets without ids (they get ids per coach when used). */
export type TemplatePage = { items: Omit<WidgetInstance, "id">[] }

export type TemplateDef = {
  name: string
  blurb: string
  theme: CoachTheme
  /** Starting layouts: Home, and any module page that shouldn't start as just its title and tool. */
  pages: Partial<Record<PageId, TemplatePage>>
}

/**
 * Starting templates. Each is a complete theme plus starting page layouts; a
 * coach picks one and then changes whatever they like. They are deliberately
 * far apart.
 *
 * The data lives in template-data.json so the prototype's "Save as template"
 * (Design → More) can rewrite it from a design made in the editor; see
 * app/api/dev/templates/route.ts.
 */
export const TEMPLATES = data as unknown as Record<TemplateId, TemplateDef>

export const TEMPLATE_IDS = Object.keys(TEMPLATES) as TemplateId[]
