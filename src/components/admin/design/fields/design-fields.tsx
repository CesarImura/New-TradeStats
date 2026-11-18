"use client"
import { cn } from "@/lib/utils"
import { TradingColoursField } from "./trading-colours"
import { ImportSiteField, LogoField, ModeField, NameField, PrimaryField, HighlightField, TemplateField } from "./brand-fields"
import { FontsField, HeadingWeightField, LabelsField } from "./type-fields"
import { BackgroundField, BordersField, ButtonsField, ChartStyleField, CornersField, DensityField, HeaderFormField, ShadowsField, WidgetFinishField } from "./shape-fields"
import { LayoutWidgetsField, MenuItemsField, MenuRow, NavFillField, NavFrameField, NavImageField, NavLayoutField, NavLogoField, NavMarkerField, NavSearchField, NavSignOutField, NavStyleField, WordingField } from "./menu-fields"

/**
 * Every Design setting, defined once by id. The left panel (Brand kit, Menu
 * and words), the style inspector and click-to-edit all render settings from
 * here, so a setting looks and behaves the same wherever it shows up. The ids
 * are the `fields` that src/lib/design-pick.ts maps preview parts to.
 */

export { DesignProvider, useDesign, move, MODULE_NAMES, type DesignCtx } from "./design-context"

/** One setting by id. Menu items are `menu-<module>` (and `menu-home`). */
export function DesignField({ id }: { id: string }) {
  const F = FIELDS[id]
  if (F) return <F />
  return id.startsWith("menu-") ? <MenuRow id={id.slice(5)} /> : null
}

/** A titled block of settings in a panel. */
export function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-4 border-b px-4 pt-3 pb-5 last:border-b-0", className)}>
      <h3 className="t-mono-label-s text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

const FIELDS: Record<string, () => React.ReactNode> = {
  template: TemplateField,
  "import-site": ImportSiteField,
  name: NameField,
  logo: LogoField,
  primary: PrimaryField,
  highlight: HighlightField,
  trading: TradingColoursField,
  mode: ModeField,
  fonts: FontsField,
  "heading-weight": HeadingWeightField,
  labels: LabelsField,
  corners: CornersField,
  buttons: ButtonsField,
  shadows: ShadowsField,
  borders: BordersField,
  density: DensityField,
  background: BackgroundField,
  "chart-style": ChartStyleField,
  "header-form": HeaderFormField,
  "widget-finish": WidgetFinishField,
  "nav-layout": NavLayoutField,
  "layout-widgets": LayoutWidgetsField,
  "nav-style": NavStyleField,
  "nav-logo": NavLogoField,
  "nav-frame": NavFrameField,
  "nav-fill": NavFillField,
  "nav-marker": NavMarkerField,
  "nav-search": NavSearchField,
  "nav-image": NavImageField,
  "nav-signout": NavSignOutField,
  "menu-items": MenuItemsField,
  wording: WordingField,
}
