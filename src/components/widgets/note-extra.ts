import type { WidgetNote } from "@/lib/widgets/layout"

/**
 * The height a coach's note adds to a card (parts/anatomy.tsx, Note): worked out from the note and the card's outer
 * width alone, so the three-column page can give the card that room before anything is measured.
 *
 * The note is `pt-4` over a `gap-2` column: an optional picture (aspect-video, at most 10rem, so 160 px on any card of
 * this page), then one row with the text (`line-clamp-2`, 20 px lines) and the button (28 px) that wraps under the
 * text when they don't fit side by side (the text's basis is 10rem). Measured on the bench (Etapa 0): text 36 px,
 * text and button or button alone 44, two lines of text 56, wrapped button 92, with a picture 204; the same at every
 * theme and density.
 */
const PAD_TOP = 16
const GAP = 8
const LINE = 20
const BUTTON = 28
const IMAGE = 160
const INSET = 32
const TEXT_BASIS = 160
const ROW_GAP_X = 12
/** Px per character of the 13 px body text, and of the button's label (plus its padding), a little wide so a line count is never short. */
const CHAR = 6.5
const BUTTON_CHAR = 7
const BUTTON_PAD = 26

/** Layouts that draw no note (the whole card is the coach's picture, a button, a banner strip…): they get no room for it. Measured: the note changes none of their heights. */
export const NOTE_IGNORED = new Set([
  "announcement|line", "announcement|media", "banner|slim", "book-call|split", "button|filled", "button|outline", "button|row",
  "coach-profile|compact", "coach-profile|media", "community-feed|line", "continue-lesson|card", "continue-lesson|media", "countdown|line",
  "discord|banner", "drawdown|hero", "embed|page", "embed|row", "embed|video", "faq|row", "first-week|ring", "hero|featured", "hero|image",
  "hero|split", "hero|video", "image|caption", "image|cover", "image|side", "journal-pnl|hero", "latest-downloads|row", "links|row",
  "my-rank|hero", "next-live|split", "partner-links|chips", "rules-followed|hero", "upgrade|banner", "upgrade|split",
])

/** The px a note takes in a card `width` px wide (0 when the layout draws none or the note is empty). */
export function noteExtraPx(note: WidgetNote | undefined, width: number): number {
  if (!note) return 0
  const text = note.text?.trim() ?? ""
  const label = note.button?.trim() ?? ""
  const image = Boolean(note.image)
  if (!image && !text && !label) return 0
  const avail = Math.max(0, width - INSET)
  let row = 0
  if (text || label) {
    const button = label ? Math.min(avail, label.length * BUTTON_CHAR + BUTTON_PAD) : 0
    const wrapped = Boolean(text && label) && TEXT_BASIS + ROW_GAP_X + button > avail
    const room = text && label && !wrapped ? avail - button - ROW_GAP_X : avail
    const lines = text ? Math.min(2, Math.max(1, Math.ceil((text.length * CHAR) / Math.max(1, room)))) : 0
    row = wrapped ? lines * LINE + GAP + BUTTON : Math.max(lines * LINE, label ? BUTTON : 0)
  }
  return PAD_TOP + (image ? IMAGE + (row ? GAP : 0) : 0) + row
}
