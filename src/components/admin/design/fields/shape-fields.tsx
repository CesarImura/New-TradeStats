"use client"
import { useDesign } from "./design-context"
import { Switch } from "@/components/ui/switch"
import { chartStyleOf, headerFormOf, widgetFinishOf } from "@/lib/theme/types"
import { BackgroundControl } from "./background-control"
import { Field, Segmented, SliderField } from "./controls"

/* ---------- Shape, depth, spacing ---------- */

export function CornersField() {
  const { theme, change } = useDesign()
  return (
    <SliderField
      id="corners"
      label="Corners"
      value={theme.radius}
      min={0}
      max={24}
      unit="px"
      format={(r) => `${r <= 3 ? "Sharp" : r >= 16 ? "Very round" : "Round"} · ${r}px`}
      onChange={(radius) => change({ theme: { radius } }, "radius")}
    />
  )
}

export function ButtonsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="buttons" label="Buttons">
      <Segmented
        label="Button shape"
        value={theme.buttonShape}
        onChange={(buttonShape) => change({ theme: { buttonShape } }, "buttons")}
        options={[
          { value: "square", label: <span className="h-2 w-4 rounded-a-2xs bg-a-text-2" aria-label="Square" /> },
          { value: "rounded", label: <span className="h-2 w-4 rounded-a-xs bg-a-text-2" aria-label="Rounded" /> },
          { value: "pill", label: <span className="h-2 w-4 rounded-full bg-a-text-2" aria-label="Pill" /> },
        ]}
      />
    </Field>
  )
}

export function ShadowsField() {
  const { theme, change } = useDesign()
  return (
    <Field id="shadows" label="Shadows">
      <Segmented
        label="Shadows"
        value={theme.shadow}
        onChange={(shadow) => change({ theme: { shadow } }, "shadow")}
        options={[
          { value: "none", label: "None" },
          { value: "soft", label: "Soft" },
          { value: "strong", label: "Strong" },
        ]}
      />
    </Field>
  )
}

export function BordersField() {
  const { theme, change } = useDesign()
  return (
    <label data-field="borders" className="flex items-center justify-between gap-3 t-caption-medium text-a-text-2">
      Outline on cards
      <Switch checked={theme.borders} onCheckedChange={(borders) => change({ theme: { borders } }, "borders")} />
    </label>
  )
}

export function DensityField() {
  const { theme, change } = useDesign()
  return (
    <Field id="density" label="Spacing">
      <Segmented
        label="Spacing"
        value={theme.density}
        onChange={(density) => change({ theme: { density } }, "density")}
        options={[
          { value: "compact", label: "Compact" },
          { value: "comfortable", label: "Comfortable" },
          { value: "airy", label: "Airy" },
        ]}
      />
    </Field>
  )
}

export function ChartStyleField() {
  const { theme, change } = useDesign()
  return (
    <Field id="chart-style" label="Bars and gauges" hint={{ ticks: "Segments, like an instrument", solid: "One filled bar", thin: "A fine line", blocks: "A few thick blocks", dots: "A row of small squares" }[chartStyleOf(theme)]}>
      <Segmented
        label="Bars and gauges"
        value={chartStyleOf(theme)}
        onChange={(chartStyle) => change({ theme: { chartStyle } }, "chart-style")}
        options={[{ value: "ticks", label: "Ticks" }, { value: "solid", label: "Solid" }, { value: "thin", label: "Thin" }, { value: "blocks", label: "Blocks" }, { value: "dots", label: "Dots" }]}
      />
    </Field>
  )
}

export function WidgetFinishField() {
  const { theme, change } = useDesign()
  return (
    <Field id="widget-finish" label="Finish" hint={{ none: "Nothing extra", corners: "Small brackets on each widget's corners", grid: "A field of small crosses behind the widgets" }[widgetFinishOf(theme)]}>
      <Segmented
        label="Finish"
        value={widgetFinishOf(theme)}
        onChange={(widgetFinish) => change({ theme: { widgetFinish } }, "widget-finish")}
        options={[{ value: "none", label: "None" }, { value: "corners", label: "Corners" }, { value: "grid", label: "Grid" }]}
      />
    </Field>
  )
}

export function HeaderFormField() {
  const { theme, change } = useDesign()
  return (
    <Field id="header-form" label="Widget names" hint={{ top: "Icon, name and value on top", label: "A small label line, no icon", caption: "Under the content, like a caption", tag: "The icon in a tile, the name in a pill", path: "Section / name, a fine line under it" }[headerFormOf(theme)]}>
      <Segmented
        label="Widget names"
        value={headerFormOf(theme)}
        onChange={(headerForm) => change({ theme: { headerForm } }, "header-form")}
        options={[{ value: "top", label: "Top" }, { value: "label", label: "Label" }, { value: "caption", label: "Caption" }, { value: "tag", label: "Tag" }, { value: "path", label: "Path" }]}
      />
    </Field>
  )
}

export function BackgroundField() {
  const { theme, change } = useDesign()
  return (
    <div data-field="background">
      <BackgroundControl theme={theme} onChange={(patch, key) => change({ theme: patch }, key)} />
    </div>
  )
}
