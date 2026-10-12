import {
  Archivo,
  DM_Sans,
  Fraunces,
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Manrope,
  Sora,
  Space_Mono,
} from "next/font/google"

// The coach's font library. Every face is loaded once and exposed as a CSS
// variable; a coach theme only points at the variable it wants.
const geist = Geist({ subsets: ["latin"], variable: "--ff-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--ff-geist-mono" })
const archivo = Archivo({ subsets: ["latin"], variable: "--ff-archivo" })
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ff-space-mono" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--ff-fraunces" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--ff-dm-sans" })
const sora = Sora({ subsets: ["latin"], variable: "--ff-sora" })
const manrope = Manrope({ subsets: ["latin"], variable: "--ff-manrope" })
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--ff-instrument-serif" })

export const fontVariables = [
  geist, geistMono, archivo, spaceMono, fraunces, dmSans, sora, manrope, instrumentSerif,
].map((f) => f.variable).join(" ")

export const FONT_LIBRARY = {
  geist: { label: "Geist", css: "var(--ff-geist), system-ui, sans-serif", kind: "sans" },
  archivo: { label: "Archivo", css: "var(--ff-archivo), 'Helvetica Neue', Arial, sans-serif", kind: "sans" },
  "dm-sans": { label: "DM Sans", css: "var(--ff-dm-sans), system-ui, sans-serif", kind: "sans" },
  sora: { label: "Sora", css: "var(--ff-sora), system-ui, sans-serif", kind: "sans" },
  manrope: { label: "Manrope", css: "var(--ff-manrope), system-ui, sans-serif", kind: "sans" },
  fraunces: { label: "Fraunces", css: "var(--ff-fraunces), Georgia, serif", kind: "serif" },
  "instrument-serif": { label: "Instrument Serif", css: "var(--ff-instrument-serif), Georgia, serif", kind: "serif" },
  "space-mono": { label: "Space Mono", css: "var(--ff-space-mono), ui-monospace, monospace", kind: "mono" },
  "geist-mono": { label: "Geist Mono", css: "var(--ff-geist-mono), ui-monospace, monospace", kind: "mono" },
} as const

export type FontId = keyof typeof FONT_LIBRARY
