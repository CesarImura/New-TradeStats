// The customizations the Design editor really offers a widget, as patches to its WidgetInstance (src/lib/widgets/layout.ts).
// One list per bench item (type|layout|width). `offered`: whether the inspector offers it for this layout (widget-caps.ts and the
// registry's settings), so a run can say: offered and no effect (defect), or not offered and it has one ("effect not offered").
// `ref`: compare with another alteration of the same item instead of the plain widget (a part of the header is judged against the
// same title style, a field that waits for More against More).
const PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC"
export const PROBE_TEXT = "Probe text 123"

export function alterationsFor(w, v, width) {
  const caps = v.caps
  const A = []
  const add = (name, patch, offered, ref, solo) => A.push({ name, patch, offered, ref, ...(solo ? { solo: true } : {}) })
  // layout: Shows (Detail)
  add("detail:compact", { detail: "compact" }, caps.shows.includes("compact"))
  add("detail:detailed", { detail: "detailed" }, caps.shows.includes("detailed"))
  // Style: Stand out
  add("emphasis:quiet", { emphasis: "quiet" }, caps.standOut.includes("quiet"))
  // solo: only one Star per page (oneStar in layout.ts), so Star is tried on one card at a time
  add("emphasis:star", { emphasis: "star" }, caps.standOut.includes("star"), undefined, true)
  // Card, Background
  for (const s of ["raised", "grey", "outline", "blended"]) add(`surface:${s}`, { style: { surface: s } }, true)
  for (const t of ["brand", "highlight"]) add(`tone:${t}`, { style: { tone: t } }, true)
  add("image:preset", { style: { image: "preset:" + "AUTO" } }, w.parts.image)
  // Header: title style and parts
  for (const f of ["top", "label", "caption", "tag", "path"]) add(`headerForm:${f}`, { style: { headerForm: f } }, caps.titleStyle)
  add("header:icon off", { style: { headerForm: "top" }, header: { icon: false } }, caps.header && caps.titleStyle, "headerForm:top")
  add("header:icon on", { style: { headerForm: "top" }, header: { icon: true } }, caps.header && caps.titleStyle, "headerForm:top")
  add("header:title off", { header: { title: false } }, caps.header && caps.title)
  add("header:description on", { detail: "detailed", header: { description: true } }, caps.header && caps.shows.includes("detailed"), "detail:detailed")
  add("header:description off", { detail: "detailed", header: { description: false } }, caps.header && caps.shows.includes("detailed"), "detail:detailed")
  add("header:value off", { header: { value: false } }, caps.header && caps.value)
  add("header:value on", { header: { value: true } }, caps.header && caps.value)
  // Charts and Main number
  for (const c of ["ticks", "solid", "thin", "blocks", "dots"]) add(`chart:${c}`, { style: { chartStyle: c } }, caps.chart)
  for (const f of ["plain", "marked", "display", "mono"]) add(`figure:${f}`, { style: { figureStyle: f } }, caps.figure)
  // the coach's own text, button and picture
  add("note:text", { note: { text: PROBE_TEXT } }, caps.note)
  add("note:button", { note: { text: PROBE_TEXT, button: "Probe button", target: "url", url: "https://example.com" } }, caps.note)
  add("note:image", { note: { text: PROBE_TEXT, image: PX } }, caps.note)
  // the widget's own fields (registry settings), as the inspector lists them
  const variant = v.value
  for (const s of w.settings) {
    const forLayout = !s.variants || s.variants.includes(variant)
    const needsMore = !!s.more?.includes(variant)
    const base = needsMore ? { detail: "detailed" } : {}
    const ref = needsMore ? "detail:detailed" : undefined
    // `when`: the other setting has to hold its value for this one to be offered (it is set in the same patch, and so is the baseline of the ref)
    let when = {}
    if (s.when) {
      const o = w.settings.find((x) => x.key === s.when.key)
      when = { [s.when.key]: s.when.value }
      if (o && !(o.options?.[0] === s.when.value)) { /* set explicitly below */ }
    }
    const offered = forLayout
    const mk = (props) => ({ ...base, props: { ...when, ...props } })
    const rf = s.when && (needsMore ? undefined : undefined)
    if (s.type === "toggle") {
      add(`setting:${s.key}=${!s.defaultOn}`, mk({ [s.key]: !s.defaultOn }), offered, s.when ? `setting-when:${s.key}` : ref)
    } else if (s.type === "select") {
      for (const o of s.options.slice(1)) add(`setting:${s.key}=${o}`, mk({ [s.key]: o }), offered, s.when ? `setting-when:${s.key}` : ref)
    } else if (s.type === "text" || s.type === "textarea") {
      add(`setting:${s.key}="${PROBE_TEXT}"`, mk({ [s.key]: PROBE_TEXT }), offered, s.when ? `setting-when:${s.key}` : ref)
    } else if (s.type === "image") {
      add(`setting:${s.key}=picture`, mk({ [s.key]: PX }), offered, s.when ? `setting-when:${s.key}` : ref)
    }
    if (s.when) A.push({ name: `setting-when:${s.key}`, patch: { ...base, props: { ...when } }, offered: false, ref, internal: true })
  }
  return A
}

export const itemWidth = (w, v) => {
  const WIDTHS = [4, 8, 12]
  const page = (x) => (x >= 12 ? 12 : x >= 8 ? 8 : 4)
  const ok = WIDTHS.filter((x) => x >= v.minW && x <= v.maxW)
  const list = ok.length ? ok : [WIDTHS.reduce((a, b) => (Math.abs(b - v.minW) < Math.abs(a - v.minW) ? b : a))]
  const d = page(w.defaultW)
  return list.includes(d) ? d : list.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a))
}

// merge a patch onto an item (style / header / note / props are merged one level)
export const applyPatch = (item, patch) => {
  const out = { ...item }
  for (const [k, val] of Object.entries(patch)) out[k] = val && typeof val === "object" && !Array.isArray(val) ? { ...(item[k] || {}), ...val } : val
  return out
}
