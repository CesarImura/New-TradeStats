/**
 * Suggests brand colours from an uploaded logo: samples the image, groups
 * similar pixels, skips near-white, near-black and transparent ones, and
 * returns the most used colours, most colourful first.
 */
export async function colorsFromLogo(dataUrl: string, count = 3): Promise<string[]> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  if (!ctx) return []
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
    if (a < 128) continue
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max > 240 && min > 240) continue // white
    if (max < 20) continue // black
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`
    const hit = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
    buckets.set(key, { n: hit.n + 1, r: hit.r + r, g: hit.g + g, b: hit.b + b })
  }

  const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0")
  return [...buckets.values()]
    .filter((b) => b.n > 8)
    .map((b) => {
      const r = b.r / b.n, g = b.g / b.n, bl = b.b / b.n
      const sat = (Math.max(r, g, bl) - Math.min(r, g, bl)) / 255
      return { color: `#${hex(r)}${hex(g)}${hex(bl)}`, score: b.n * (0.3 + sat) }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((c) => c.color)
}
