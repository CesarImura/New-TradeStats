/*
 * Scenarios for the widget bench: named combinations of settings a coach can make, laid over every cell of the matrix.
 *
 * A scenario is plain data in the shape the prototype itself saves (lib/widgets/layout.ts, lib/theme/types.ts), not a
 * second configuration model:
 *
 *   theme   partial CoachTheme: merged over the cell's { template, mode, density }. template, mode and density may be
 *           named here too: the scenario then pins that axis (several cells that end up the same are run once).
 *   item    partial WidgetInstance: merged over every card. `note` (WidgetNote), `emphasis`, `detail` and `props` are the
 *           fields the bench uses. `detail` wins over the cell's Detail axis (a scenario about Detailed is not run at Compact).
 *   props   { [widget type]: props } for widgets that take them; merged over the item's props (the bench's own, such as
 *           the Featured hero's play: "manual", stay).
 *   data    `?data=` of the student page: "empty" | "inactive" | "finished" (the product's dataModeOf).
 *
 * Nothing is replaced as a whole: objects are merged key by key (arrays and scalars are replaced), so what a scenario
 * does not name keeps its value. The result depends only on the inputs (no randomness, keys in a fixed order).
 *
 * To add a scenario, add an entry to SCENARIOS. run.mjs: --scenarios S1,S5 (or "all"); without the flag no scenario is applied.
 */

const SHORT_NOTE = { text: "Review before the live.", button: "Open", target: "courses" }
const LONG_NOTE = {
  text: "This is a deliberately long note a coach might write. It runs over several sentences so that we can see how every layout wraps, clips or grows. Nothing here is meant to be short.",
  button: "A very long button label here",
  target: "courses",
}

export const SCENARIOS = {
  S0: { name: "Default" },
  S1: { name: "Short note", item: { note: SHORT_NOTE } },
  S2: { name: "Long note", item: { note: LONG_NOTE } },
  S3: { name: "Header Top", theme: { headerForm: "top" } },
  S4: { name: "Figure Display", theme: { figureStyle: "display" } },
  S5: { name: "Note + Top + Display", theme: { headerForm: "top", figureStyle: "display" }, item: { note: SHORT_NOTE } },
  S6: { name: "Detailed", item: { detail: "detailed" } },
  S7: { name: "Star + Detailed + long note", item: { emphasis: "star", detail: "detailed", note: LONG_NOTE } },
  S8: { name: "Empty", data: "empty" },
  S9: { name: "Atelier Airy", theme: { template: "atelier", density: "airy", headerForm: "top", figureStyle: "display" }, item: { detail: "detailed", note: SHORT_NOTE } },
}

const isPlain = (v) => v !== null && typeof v === "object" && !Array.isArray(v)

/** `over` laid on `base`, key by key: objects merge, arrays and scalars replace, undefined leaves the base alone. Neither input is changed. */
export function merge(base, over) {
  if (!isPlain(base) || !isPlain(over)) return over === undefined ? base : over
  const out = { ...base }
  for (const key of Object.keys(over)) {
    if (over[key] === undefined) continue
    out[key] = isPlain(out[key]) && isPlain(over[key]) ? merge(out[key], over[key]) : isPlain(over[key]) ? merge({}, over[key]) : over[key]
  }
  return out
}

const DETAILS = ["compact", "standard", "detailed"]
const EMPHASES = ["quiet", "accent", "star"]
const DATA_MODES = ["empty", "inactive", "finished"]
const TOP = new Set(["theme", "item", "props", "data", "name"])

/** Checks a scenario against the shapes the product accepts, so a typo fails loudly instead of testing nothing. */
export function check(id, s) {
  const bad = (m) => { throw new Error(`scenario ${id}: ${m}`) }
  for (const k of Object.keys(s)) if (!TOP.has(k)) bad(`unknown key "${k}" (use ${[...TOP].join(", ")})`)
  if (s.item?.detail !== undefined && !DETAILS.includes(s.item.detail)) bad(`item.detail "${s.item.detail}" is not one of ${DETAILS.join(", ")}`)
  if (s.item?.emphasis !== undefined && !EMPHASES.includes(s.item.emphasis)) bad(`item.emphasis "${s.item.emphasis}" is not one of ${EMPHASES.join(", ")}`)
  if (s.data !== undefined && !DATA_MODES.includes(s.data)) bad(`data "${s.data}" is not one of ${DATA_MODES.join(", ")}`)
  for (const k of Object.keys(s.item || {})) if (!["note", "emphasis", "detail", "props", "header", "style", "show", "hideOnPhone"].includes(k)) bad(`item.${k} is not a field the scenario may set`)
  return s
}

/** The scenarios named by `--scenarios` ("S1,S5" or "all"), in the order given; `null` when none was asked for (the bench as it was). */
export function pick(arg) {
  if (!arg) return [null]
  const ids = arg === "all" ? Object.keys(SCENARIOS) : String(arg).split(",").filter(Boolean)
  return ids.map((id) => {
    if (!SCENARIOS[id]) throw new Error(`unknown scenario "${id}"; use ${Object.keys(SCENARIOS).join(", ")} or all`)
    return { id, ...check(id, SCENARIOS[id]) }
  })
}

/** The cell with the scenario's template, mode and density pinned, and its Detail where the scenario sets one. */
export function cellFor(cell, scenario) {
  if (!scenario) return cell
  const t = scenario.theme || {}
  return {
    ...cell,
    template: t.template ?? cell.template,
    mode: t.mode ?? cell.mode,
    density: t.density ?? cell.density,
    detail: scenario.item?.detail ?? cell.detail,
    scenario: scenario.id,
  }
}

/** A stable key for a cell, scenario included, to run each distinct cell once. */
export const cellKey = (c) => `${c.scenario || ""}|${c.vw}|${c.template}|${c.mode}|${c.density}|${c.detail}`

/** `?data=…` for the scenario's data state, or "". */
export const queryFor = (scenario) => (scenario?.data ? `?data=${scenario.data}` : "")

/**
 * What the bench saves as `proto:pub:<slug>` for one cell: the same shape the editor publishes
 * ({ theme, content: { modules, pages: { home: { default: { items } } } } }).
 * `items` are the bench's cards ({ id, type, variant, w, props? }); each gets the cell's Detail, its place, and the scenario's item overrides.
 */
export function buildPayload({ cell, items, modules, scenario }) {
  const theme = merge({ template: cell.template, mode: cell.mode, density: cell.density }, scenario?.theme)
  const layoutItems = items.map((it, i) => {
    const own = scenario?.props?.[it.type]
    let item = { ...it, detail: cell.detail, x: 0, y: i, h: 4 }
    if (scenario?.item) item = merge(item, scenario.item)
    if (own) item = merge(item, { props: own })
    return item
  })
  return { theme, content: { modules, pages: { home: { default: { items: layoutItems, free: false } } } } }
}
