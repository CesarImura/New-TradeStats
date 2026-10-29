import {
  Archivo,
  Barlow_Condensed,
  DM_Sans,
  Familjen_Grotesk,
  Fragment_Mono,
  Fraunces,
  Geist,
  Geist_Mono,
  Gloock,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Instrument_Serif,
  JetBrains_Mono,
  Manrope,
  Martian_Mono,
  Newsreader,
  Schibsted_Grotesk,
  Sora,
  Space_Mono,
} from "next/font/google"

// The coach's font library. Every face is loaded once and exposed as a CSS
// variable; a coach theme only points at the variable it wants.
const geist = Geist({ subsets: ["latin"], variable: "--ff-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--ff-geist-mono" })
const archivo = Archivo({ subsets: ["latin"], variable: "--ff-archivo" })
// IBM Plex is a coach font choice. Our own UI (admin, sign-up, wizard, launcher) uses Geist.
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--ff-plex" })
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-plex-mono" })
const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--ff-space-mono" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--ff-fraunces" })
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--ff-dm-sans" })
const sora = Sora({ subsets: ["latin"], variable: "--ff-sora" })
const manrope = Manrope({ subsets: ["latin"], variable: "--ff-manrope" })
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--ff-instrument-serif" })
// Faces with more character, so two coaches don't share the same default sans (Geist, DM Sans, Manrope, Sora).
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--ff-schibsted" })
const familjen = Familjen_Grotesk({ subsets: ["latin"], variable: "--ff-familjen" })
const barlowCondensed = Barlow_Condensed({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-barlow-condensed" })
const newsreader = Newsreader({ subsets: ["latin"], variable: "--ff-newsreader" })
const gloock = Gloock({ subsets: ["latin"], weight: "400", variable: "--ff-gloock" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--ff-jetbrains-mono" })
const martianMono = Martian_Mono({ subsets: ["latin"], variable: "--ff-martian-mono" })
const fragmentMono = Fragment_Mono({ subsets: ["latin"], weight: "400", variable: "--ff-fragment-mono" })

export const fontVariables = [
  geist, geistMono, plex, plexMono, archivo, spaceMono, fraunces, dmSans, sora, manrope, instrumentSerif,
  schibsted, familjen, barlowCondensed, newsreader, gloock, jetbrainsMono, martianMono, fragmentMono,
].map((f) => f.variable).join(" ")

export const FONT_LIBRARY = {
  geist: { label: "Geist", css: "var(--ff-geist), system-ui, sans-serif", kind: "sans" },
  plex: { label: "IBM Plex Sans", css: "var(--ff-plex), system-ui, sans-serif", kind: "sans" },
  archivo: { label: "Archivo", css: "var(--ff-archivo), 'Helvetica Neue', Arial, sans-serif", kind: "sans" },
  "dm-sans": { label: "DM Sans", css: "var(--ff-dm-sans), system-ui, sans-serif", kind: "sans" },
  sora: { label: "Sora", css: "var(--ff-sora), system-ui, sans-serif", kind: "sans" },
  manrope: { label: "Manrope", css: "var(--ff-manrope), system-ui, sans-serif", kind: "sans" },
  schibsted: { label: "Schibsted Grotesk", css: "var(--ff-schibsted), system-ui, sans-serif", kind: "sans" },
  familjen: { label: "Familjen Grotesk", css: "var(--ff-familjen), system-ui, sans-serif", kind: "sans" },
  "barlow-condensed": { label: "Barlow Condensed", css: "var(--ff-barlow-condensed), 'Arial Narrow', sans-serif", kind: "sans" },
  fraunces: { label: "Fraunces", css: "var(--ff-fraunces), Georgia, serif", kind: "serif" },
  "instrument-serif": { label: "Instrument Serif", css: "var(--ff-instrument-serif), Georgia, serif", kind: "serif" },
  newsreader: { label: "Newsreader", css: "var(--ff-newsreader), Georgia, serif", kind: "serif" },
  gloock: { label: "Gloock", css: "var(--ff-gloock), Georgia, serif", kind: "serif" },
  "space-mono": { label: "Space Mono", css: "var(--ff-space-mono), ui-monospace, monospace", kind: "mono" },
  "plex-mono": { label: "IBM Plex Mono", css: "var(--ff-plex-mono), ui-monospace, monospace", kind: "mono" },
  "geist-mono": { label: "Geist Mono", css: "var(--ff-geist-mono), ui-monospace, monospace", kind: "mono" },
  "jetbrains-mono": { label: "JetBrains Mono", css: "var(--ff-jetbrains-mono), ui-monospace, monospace", kind: "mono" },
  "martian-mono": { label: "Martian Mono", css: "var(--ff-martian-mono), ui-monospace, monospace", kind: "mono" },
  "fragment-mono": { label: "Fragment Mono", css: "var(--ff-fragment-mono), ui-monospace, monospace", kind: "mono" },
} as const

export type FontId = keyof typeof FONT_LIBRARY
