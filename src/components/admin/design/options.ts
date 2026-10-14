import type { FontId } from "@/lib/fonts"

/** Choices shared by the Design editor and the setup wizard. */
export const BRAND_COLORS = ["#ff5500", "#e11d48", "#6b3dff", "#3d5afe", "#0ea5e9", "#16a34a", "#1f5a45", "#0a0a0a"]
export const HIGHLIGHT_COLORS = ["#f8ff9e", "#ffd166", "#00d39a", "#c7d2fe", "#fecdd3", "#e9dcc3"]
export const FONT_PAIRS: { name: string; heading: FontId; body: FontId; label: FontId }[] = [
  { name: "Technical", heading: "archivo", body: "archivo", label: "space-mono" },
  { name: "Editorial", heading: "fraunces", body: "dm-sans", label: "dm-sans" },
  { name: "Bold", heading: "sora", body: "manrope", label: "sora" },
  { name: "Elegant", heading: "instrument-serif", body: "geist", label: "geist-mono" },
  { name: "Neutral", heading: "geist", body: "geist", label: "geist" },
]
