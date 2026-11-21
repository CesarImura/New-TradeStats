import type { FontId } from "@/lib/fonts"

/** Choices shared by the Design editor and the setup wizard. */
export const BRAND_COLORS = ["#cf4500", "#e11d48", "#6b3dff", "#3d5afe", "#0ea5e9", "#16a34a", "#1f5a45", "#0a0a0a"]
export const HIGHLIGHT_COLORS = ["#f8ff9e", "#ffd166", "#00d39a", "#c7d2fe", "#fecdd3", "#e9dcc3"]
export const FONT_PAIRS: { name: string; /** The fonts as the card names them (Figma Style · 04 Type). */ text: string; heading: FontId; body: FontId; label: FontId }[] = [
  { name: "Technical", text: "Archivo · Space Mono", heading: "archivo", body: "archivo", label: "space-mono" },
  { name: "Editorial", text: "Fraunces · Schibsted", heading: "fraunces", body: "schibsted", label: "schibsted" },
  { name: "Bold", text: "Familjen · Schibsted", heading: "familjen", body: "schibsted", label: "familjen" },
  { name: "Elegant", text: "Instrument Serif · Geist", heading: "instrument-serif", body: "geist", label: "geist-mono" },
  { name: "Desk", text: "Barlow · IBM Plex", heading: "barlow-condensed", body: "plex", label: "jetbrains-mono" },
  { name: "Gallery", text: "Gloock · Newsreader", heading: "gloock", body: "newsreader", label: "fragment-mono" },
  { name: "Characterful", text: "Familjen · Martian Mono", heading: "familjen", body: "schibsted", label: "martian-mono" },
  { name: "Neutral", text: "Geist", heading: "geist", body: "geist", label: "geist" },
]
