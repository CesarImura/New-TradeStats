/**
 * The coach's tab icon when they haven't uploaded a logo: their mark on their
 * brand colour, as an SVG data URL. Students never see our icon (Customization
 * principles: nothing of ours visible on the coach's platform).
 */
export function markIcon(mark: string, background: string, color: string) {
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
  const size = mark.length > 1 ? 26 : 36
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${esc(background)}"/><text x="32" y="33" dominant-baseline="central" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="600" font-size="${size}" fill="${esc(color)}">${esc(mark.slice(0, 2))}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}
