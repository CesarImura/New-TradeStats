"use client"

import { WIDGETS } from "@/components/widgets/registry"

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
    variants: w.variants.map((v) => ({ value: v.value, minW: v.minW, maxW: v.maxW })),
  }))
  return <pre id="bench-catalog">{JSON.stringify(catalog)}</pre>
}
