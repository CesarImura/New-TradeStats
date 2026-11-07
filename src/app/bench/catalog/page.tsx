"use client"

import { capsOf } from "@/components/admin/design/panels/widget-caps"
import { WIDGETS, styleParts } from "@/components/widgets/registry"

/**
 * Widget bench (scripts/widget-bench): lists every registered widget with its layouts and the widths each allows, so the
 * bench can lay all of them out. Empty unless the build was made with NEXT_PUBLIC_WIDGET_BENCH=1, so a normal build
 * exposes nothing.
 */
export default function BenchCatalog() {
  if (process.env.NEXT_PUBLIC_WIDGET_BENCH !== "1") return null
  const catalog = WIDGETS.map((w) => ({
    type: w.type,
    name: w.name,
    core: !!w.core,
    module: w.module ?? null,
    defaultW: w.defaultW,
    variants: w.variants.map((v) => ({ value: v.value, minW: v.minW, maxW: v.maxW, caps: capsOf(w.type, v.value) })),
    parts: styleParts(w.type),
    // The widget's own fields as the inspector offers them (custom-fix probes: scripts/widget-bench/custom).
    settings: (w.settings ?? []).map((s) => ({ key: s.key, label: s.label, type: s.type, options: s.type === "select" ? s.options.map((o) => o.value) : undefined, defaultOn: s.type === "toggle" ? !!s.defaultOn : undefined, variants: s.variants, more: s.more, when: s.when })),
  }))
  return <pre id="bench-catalog">{JSON.stringify(catalog)}</pre>
}
