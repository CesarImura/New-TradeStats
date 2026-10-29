"use client"

/**
 * Uploaded pictures for the prototype: read a file as a data URL and scale it
 * down so what lands in localStorage stays small. Every step rejects with a
 * message the coach can read (unreadable file, not an image, too large), so
 * callers can show it in a toast instead of hanging or failing silently.
 */

/** SVG and GIF are kept as they are (scaling would lose vectors or animation), so they get a size limit instead. */
export const MAX_KEPT_BYTES = 300 * 1024

export function readAsDataUrl(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader()
    r.onload = () => (typeof r.result === "string" ? res(r.result) : rej(new Error("Couldn't read this file.")))
    r.onerror = () => rej(new Error("Couldn't read this file."))
    r.readAsDataURL(file)
  })
}

/**
 * A picture as a data URL, at most `max` px on its longest side (or its width, with `side: "width"`).
 * The formats in `keep` (SVG and GIF by default) are returned unchanged, up to MAX_KEPT_BYTES.
 */
export async function pictureFrom(
  source: File | string,
  { max, side = "long", type = "image/jpeg", quality = 0.85, keep = ["svg", "gif"] }: { max: number; side?: "long" | "width"; type?: string; quality?: number; keep?: string[] },
) {
  const url = typeof source === "string" ? source : await readAsDataUrl(source)
  if (!url.startsWith("data:image/")) throw new Error("This file isn't a picture. Use a PNG, JPG, WebP, SVG or GIF.")
  if (keep.some((f) => url.startsWith(`data:image/${f}`))) {
    // A data URL is base64: about 4 characters per 3 bytes.
    if (url.length * 0.75 > MAX_KEPT_BYTES) throw new Error(`This picture is too large. ${keep.map((f) => f.toUpperCase()).join(" and ")} files can be up to ${MAX_KEPT_BYTES / 1024} KB.`)
    return url
  }
  const img = new Image()
  img.src = url
  try {
    await img.decode()
  } catch {
    throw new Error("Couldn't open this picture. Try another file.")
  }
  const s = Math.min(1, max / (side === "width" ? img.width : Math.max(img.width, img.height)))
  const c = document.createElement("canvas")
  c.width = Math.round(img.width * s)
  c.height = Math.round(img.height * s)
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height)
  return c.toDataURL(type, quality)
}
