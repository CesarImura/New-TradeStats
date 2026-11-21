import { cn } from "@/lib/utils"

export type FileTone = "pdf" | "doc" | "sheet" | "media" | "other"
export type FileIconSize = "sm" | "md" | "lg"

/**
 * Every format the product knows, grouped by colour. `short` is the 3-letter label used at md when the extension is longer.
 * Sources: Downloads and lessons accept PDF, Office, CSV, images and video; indicators and templates come from trading platforms
 * (MetaTrader .ex4 .ex5 .mq4 .mq5 .mqh .set .tpl, NinjaTrader .zip export and .cs source, TradingView .pine, cTrader .algo .cbotset,
 * TradeStation .eld, Sierra Chart .scdll, AmiBroker .afl). Anything not listed still gets a grey page with its own extension.
 */
const EXT: Record<FileTone, string[]> = {
  pdf: ["pdf", "ppt", "pptx", "pps", "ppsx", "key", "odp"],
  doc: ["doc", "docx", "rtf", "txt", "md", "odt", "pages", "log"],
  sheet: ["xls", "xlsx", "xlsm", "xlsb", "csv", "tsv", "ods", "numbers"],
  media: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "avif", "bmp", "tif", "tiff", "mp4", "m4v", "mov", "webm", "mkv", "avi", "mp3", "wav", "m4a", "aac", "flac", "ogg"],
  other: ["zip", "rar", "7z", "tar", "gz", "ex4", "ex5", "mq4", "mq5", "mqh", "set", "tpl", "chr", "pine", "algo", "cbotset", "cs", "eld", "scdll", "afl", "json", "xml", "html", "js", "ts", "py", "ipynb", "sql"],
}
const TONE_OF: Record<string, FileTone> = Object.fromEntries((Object.keys(EXT) as FileTone[]).flatMap((t) => EXT[t].map((e) => [e, t])))
const SHORT: Record<string, string> = { docx: "DOC", xlsx: "XLS", xlsm: "XLS", xlsb: "XLS", pptx: "PPT", ppsx: "PPS", jpeg: "JPG", tiff: "TIF", webp: "WEB", webm: "WBM", html: "HTM", json: "JSN", cbotset: "SET", ipynb: "NB", scdll: "DLL", numbers: "NUM", pages: "PGS", avif: "AVF", flac: "FLC" }
/** Every extension the icon colours on purpose, for docs and tests. */
export const KNOWN_FILE_EXTENSIONS = Object.keys(TONE_OF)

/** Pulls the extension out of a file name or an extension ("report.final.PDF", ".pdf"). A name without a dot ("Makefile") and a trailing dot ("file.") have none; ".env" is the extension "env". */
export function getFileExtension(nameOrType: string): string {
  const s = nameOrType.trim().toLowerCase()
  const i = s.lastIndexOf(".")
  if (i === -1) return ""
  const ext = s.slice(i + 1)
  return /^[a-z0-9_+-]{1,12}$/.test(ext) ? ext : ""
}

/** Resolves a file name (or ".ext") to its colour group and the label shown at md (3 letters) and at lg and up (4). Unknown or missing types fall back to a grey FILE page. */
export function getFileType(nameOrType: string): { ext: string; label: string; short: string; tone: FileTone } {
  const ext = getFileExtension(nameOrType)
  const label = ext ? ext.slice(0, 4).toUpperCase() : "FILE"
  return { ext, label, short: ext ? (SHORT[ext] ?? ext.slice(0, 3).toUpperCase()) : "FILE", tone: TONE_OF[ext] ?? "other" }
}

/** Height in px (the page is 4:5, so width = 0.8 x height), the label bar height, its distance from the bottom and how many letters it shows (0 = only a colour mark, 64% wide). Same numbers as the Figma sizes sm, md and lg. */
const SIZE: Record<FileIconSize, { h: number; bar: number; bottom: number; chars: number }> = {
  sm: { h: 32, bar: 5, bottom: 5, chars: 0 },
  md: { h: 40, bar: 14, bottom: 6, chars: 3 },
  lg: { h: 48, bar: 16, bottom: 7, chars: 4 },
}

const BAR: Record<FileTone, string> = {
  pdf: "var(--admin-component-file-icon-bar-pdf)",
  doc: "var(--admin-component-file-icon-bar-doc)",
  sheet: "var(--admin-component-file-icon-bar-sheet)",
  media: "var(--admin-component-file-icon-bar-media)",
  other: "var(--admin-component-file-icon-bar-other)",
}
const LABEL = "var(--admin-component-file-icon-label)"
const STROKE = "var(--admin-component-file-icon-page-stroke)"

const PAGE_PATH = "M4 .5H20L31.5 12V36a3.5 3.5 0 0 1-3.5 3.5H4A3.5 3.5 0 0 1 .5 36V4A3.5 3.5 0 0 1 4 .5Z"
const FOLD_PATH = "M20.5 1V11.5H31"

/**
 * Admin / File icon (Figma 'Admin · Files'): an outlined page with a folded top-right corner and a label bar carrying the extension (radius 2, shifted 3px left of the page, padding 4 around the letters).
 * One look (outline); the colour of the pill comes from the type: PDF and slides red, Doc blue, Sheet green, Media amber, anything else grey.
 * The extension letters carry the meaning, not just the colour: md draws 3 letters, lg 4, sm only a colour strip (3/4 of the page width) (the file name beside it says the rest).
 * Decorative: the file name beside it is the accessible name. For an action, wrap it in a button or link that has its own label.
 * Pass `name` (a file name) or `type` (an extension); no extension, a trailing dot or a name with nothing usable falls back to a grey FILE page.
 */
export function FileIcon({ name, type, size = "md", className }: { name?: string; type?: string; size?: FileIconSize; className?: string }) {
  const { label, short, tone } = getFileType(type !== undefined ? `.${type.replace(/^\./, "")}` : name ?? "")
  const s = SIZE[size]
  const text = s.chars === 0 ? "" : s.chars === 3 ? short : label
  const pill = s.chars > 0
  return (
    <span aria-hidden data-file-icon={tone} data-size={size} className={cn("relative inline-block shrink-0", className)} style={{ width: +(s.h * 0.8).toFixed(1), height: s.h }}>
      <svg viewBox="0 0 32 40" className="absolute inset-0 size-full overflow-visible" fill="none">
        <path d={PAGE_PATH} stroke={STROKE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <path d={FOLD_PATH} stroke={STROKE} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <span
        className="absolute inline-grid place-items-center rounded-a-2xs"
        style={{ bottom: s.bottom, height: s.bar, left: pill ? -3 : -2, paddingInline: pill ? 4 : 0, width: pill ? undefined : `${Math.round(s.h * 0.8 * 0.75 * 10) / 10}px`, background: BAR[tone], color: LABEL, font: pill ? "500 11px/14px var(--admin-font-family-primary)" : undefined, whiteSpace: "nowrap" }}
      >
        {text}
      </span>
    </span>
  )
}
