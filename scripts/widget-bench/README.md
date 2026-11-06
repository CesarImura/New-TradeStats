# Widget bench

Lays out **every registered widget, every layout and every width it allows** on the student Home of a running copy of the app,
across viewports, templates, light/dark, densities and Detail levels, and measures each card in a real browser. It finds
overflow, cut content, text clipped without "…", unexpected scroll and overlap, and keeps a composition signature so two runs
can be compared (for example before and after a breakpoint change).

There are no other automated tests in the app. The bench drives a real browser with `playwright-core`, a devDependency of the
project (`npm install` brings it). It does not download a browser: do that once, separately.

## Prerequisites

- Node 20 or later and `npm install` done (this installs `playwright-core`).
- A Chromium for it, downloaded once: `npx playwright-core install chromium` (about 150 MB, kept in Playwright's own cache, outside
  the project; set `PLAYWRIGHT_BROWSERS_PATH` to put it elsewhere).
- **macOS.** `serve-copy.sh`, which `npm run bench` runs, uses two macOS (BSD) commands: `cp -Rc` (an APFS clone of `node_modules`, run
  on every bench) and `sed -i ''` (only when you pass `sed` expressions to try a change). **Running the bench end to end on Linux is not
  supported yet**; the scripts are not portable as they stand.
- `rsync` and `lsof` (both ship with macOS). Nothing outside the project is read.

## Run it

```bash
npm run bench                                   # the smoke layer: 36 cells, a few minutes
npm run bench -- --layer full                   # everything: 324 cells, about 20 minutes
npm run bench -- --layer smoke --only watchlist --out /tmp/bench   # anything after -- goes to run.mjs
```

`npm run bench` builds an isolated copy of the app in a temporary folder (never in this one: `next build` and `next dev` write the
same `.next`), serves it on a free port, runs the matrix, stops the server and prints where `results.json` and `summary.md` are.

The same steps by hand, for a copy you want to keep or to try a change:

```bash
scripts/widget-bench/serve-copy.sh /tmp/bench-copy 3100
node scripts/widget-bench/run.mjs --base http://localhost:3100 --layer smoke --out /tmp/bench-smoke
# a change tried without touching the project: a copy with a sed applied, then compare
scripts/widget-bench/serve-copy.sh /tmp/bench-try 3101 's/@\[24rem\]/@[26rem]/g'
node scripts/widget-bench/run.mjs --base http://localhost:3101 --layer smoke --out /tmp/bench-try-out
node scripts/widget-bench/compare.mjs /tmp/bench-smoke/results.json /tmp/bench-try-out/results.json --out /tmp/cmp.md
```

`/bench/catalog` (`src/app/bench/catalog/page.tsx`) lists the registry for the runner. It renders nothing unless the build was
made with `NEXT_PUBLIC_WIDGET_BENCH=1`, which `serve-copy.sh` sets, so a normal build exposes nothing.

## Matrix and layers

Viewports 320, 390, 768, 1000, 1100, 1440 (320 is the narrowest phone; a card is 288 px there). Templates terminal, atelier, pulse (default densities compact, airy, comfortable).
Modes dark, light. Densities compact, comfortable, airy. Detail compact, standard, detailed. 354 cards per cell (51 widgets).

| layer | cells | covers | leaves out |
|---|---|---|---|
| `smoke` | 36 | 5 viewports × 3 templates × dark/light, each template's own density, Standard | other densities, Compact, Detailed |
| `density` | 108 | smoke + the other two densities | Compact, Detailed |
| `detail` | 108 | smoke + Compact and Detailed | other densities |
| `full` | 324 | everything | nothing |

A run takes about 4 s per cell with 3 workers (`full`, 324 cells, ≈ 20 min). Filters: `--viewports`, `--templates`, `--modes`, `--densities`,
`--details`, `--only widget,widget`. `--shelf-cards N` shows N cards of the coach's own on every Shelf (up to 12). `--shots N` saves screenshots of cards with defects, `--shot-ids id,id` of chosen cards.
The summary names what the layer leaves out and which widgets are not laid out: the page title and each page's own tool
(`page-*`), which are sized by their content and not by a width.

### Scenarios

A scenario is a named combination of coach settings laid over every cell. It is plain data in `scenarios.mjs`, in the shape the product saves
(`theme` = CoachTheme, `item` = WidgetInstance fields, `props` by widget type, `data` = `?data=`), merged over the cell key by key, with no second model.

```
node scripts/widget-bench/run.mjs --scenarios S1,S5                      # the chosen scenarios, over the whole matrix
node scripts/widget-bench/run.mjs --scenarios all --viewports 1440 --templates terminal --modes dark
node scripts/widget-bench/run.mjs --scenarios S1 --only pnl-by-instrument
node scripts/widget-bench/run.mjs --scenarios S1,S5 --dry-run true       # lists the cells and exits
```

Without `--scenarios` the bench runs exactly as before. A scenario may pin template, mode, density (`theme`) and Detail (`item.detail`);
cells that end up equal are run once. S0 Default, S1 Short note, S2 Long note, S3 Header Top, S4 Figure Display, S5 Note + Top + Display,
S6 Detailed, S7 Star + Detailed + long note, S8 Empty (`?data=empty`), S9 Atelier Airy. To add one, add an entry to `SCENARIOS`; a typo in a key or value fails at start.

Each card in `results.json` carries `detailRequested` (what was saved) and `detailShown` (the `data-detail-shown` attribute, `null` when absent).
The product sets that attribute only when it reduces the Detail, so `null` means "not reduced"; the bench does not infer a value. The summary has a
"Detail asked for and shown" section. `compare.mjs` keys cells by scenario as well.

### Regression gate (known defects)

`gate.mjs` compares a run with `baseline.json`, the versioned list of defects already known. It runs a small matrix (S0, S1, S5 at Terminal dark compact 1440, and S9 which pins Atelier airy; 4 cells, 1416 cards) and never edits the baseline by itself.

```
node scripts/widget-bench/gate.mjs run     --base http://localhost:3100 --out /tmp/gate-run     # run the gate matrix only
node scripts/widget-bench/gate.mjs create  --results /tmp/gate-run/results.json                  # first baseline; refuses to overwrite one
node scripts/widget-bench/gate.mjs check   --results /tmp/gate-run/results.json [--show new|known|fixed|all] [--report-dir DIR] [--enforce]
node scripts/widget-bench/gate.mjs verify  --base http://localhost:3100 --enforce                # run + check
node scripts/widget-bench/gate.mjs update  --results /tmp/gate-run/results.json --yes [--reason "text"]   # only fixed defects
node scripts/widget-bench/gate.mjs update  --results ... --accept-new --yes                       # also accepts NEW defects (regressions)
node scripts/widget-bench/gate.mjs update  --results ... --accept-counts --yes                    # also accepts changed occurrence counts
```

- **Identity** of a defect: cell (scenario, template, mode, density, Detail asked, viewport and its column regime) + card (widget type, layout, width) + category. Coordinates, measured heights, order, element text, Drop count and live data are not part of it. The number of occurrences is kept as a diagnostic.
- **Known**: in the baseline and in the run; does not block, stays in the report as debt. **New**: in the run and not in the baseline (also when a card the baseline never measured has a defect); blocks. **Fixed**: in the baseline and not in the run; never blocks and is listed for review; only `update --yes` removes it from the baseline. **Unclassified**: a change in occurrences for a known defect, a card not rendered in this run (not counted as fixed), a cell the baseline lacks.
- Cells in the baseline that the run did not execute are listed; with `--enforce` the gate is INCOMPLETE (exit 3). New defects with `--enforce` exit 1. Missing or invalid baseline or results exit 2. Without `--enforce` the gate is report-only: it prints the verdict and exits 0.
- `small-text` (a warning) is counted but not part of the identity.
- **Updating the baseline** prints the plan first and writes nothing unless it is allowed:
  - only fixed defects: `--yes` removes them from the baseline;
  - new defects: a generic `--yes` is refused and the full list of new identities is printed; `--accept-new --yes` is the only way to add them (and is refused when the run has none);
  - changed occurrence counts of known defects: refused unless `--accept-counts --yes`;
  - incomplete run (a baseline cell not executed, a baseline card not measured, a cell the baseline lacks): always refused, because absence of a measurement is not a fix. Run the whole matrix again;
  - no differences: "baseline unchanged", nothing written.
  Each accepted update appends to `history` in `baseline.json`: date, cells changed, fixed, accepted new, counts changed (from, to), occurrences before/after and the optional `--reason`. No author is recorded.
- It is not wired to any CI.

## What counts as a defect, and what does not

Findings (`DEFECT`): `cut-content` (text or control partly outside a box that clips it), `hidden-content` (completely outside),
`text-clipped-no-ellipsis`, `unexpected-scroll`, `card-clips-content` (the card itself clips its content), `overlap` (letters of two texts that
share pixels), page-level horizontal overflow. Warning: `small-text` under 10.5px.

Evidence: every finding names the element, the box that clips it (`by`) and its nearest ancestors (`ancestors`), each as
`tag.classes [display, overflow, WxH]`; an overlap names both elements (`a`, `b`) and the ancestor that lays them out (`via`).
Overlap is judged on the letters: each text node's line rects, cut to what is visible and narrowed to the height of the letters,
so two boxes that merely touch are not an overlap. Overlaps with a positioned layer or an SVG are counted as `layered`, overlaps
of items stacked with a negative margin as `stacked`, and odometer digits are left out.

Nothing is ignored by category. Anything that looks like a defect is checked against the mechanism the code uses on purpose,
and counted under that name in the summary (so a mechanism that suddenly changes its count shows up):

| mechanism | how it is recognised | where it comes from |
|---|---|---|
| `dropped` | `[data-dropped]` | `useDropToFit` hides parts that do not fit the height (`parts/card.tsx`) |
| `rolling` | `[data-rolling]` | odometer digits (`parts/anatomy.tsx`) |
| `carousel` | `touch-pan-y` class or `touch-action: pan-y` | Embla in `shelf.tsx` and `featured.tsx` |
| `scroll` | `overflow-*auto/scroll` or `snap-x` class on an ancestor | shelf rows, FAQ and links lists |
| `wrapped-rows` | flex-wrap column list with overflow hidden, element wholly outside to the side (or below, for a row strip) | `GROW_ROWS`, Watchlist, `FitChips`: "whole rows only". A row cut in half is still a defect |
| `ellipsis` | the box that clips the text has `text-overflow: ellipsis` or a line-clamp | `truncate`, `line-clamp-*`. Text cut by a different box (a chip that clips a longer span) is a defect |
| `layered` | overlap with an absolutely positioned element or SVG | chart labels, badges |
| `stacked` | overlap where an element or ancestor has a negative margin | avatar stacks |
| `collapsed-separator` | a lone non-letter character wholly hidden by the box that holds it, whose first sibling (the section) has collapsed to under 2 px | the `/` of the `path` header (`parts/anatomy.tsx`): it goes with its section instead of staying behind |
| `sr-only` | `.sr-only` | screen-reader text |

A text box may lose its line-height leading at the top or bottom without cutting a letter; a vertical cut up to half the
leading is not reported. Horizontal cuts always are.

How these were validated: each category was found in the first runs as a false positive, traced to its code, and checked on a
screenshot. The detector was then checked the other way too: run against the code before the Watchlist and Partner links fixes
(`PRE_BUILD="git show HEAD:… > …" serve-copy.sh …`) it reports both; run against the fixed code it reports neither.

## Finding the rows a layout needs (find-rows.mjs, an-rows.mjs)

These two set `narrow.cardBelow` / `contentBelow` in the registry (`registry-widgets.tsx`, `catalog/more/registry.ts`) from data
rather than by eye. `find-rows.mjs` lays one layout at every candidate height (2 to 6 rows, in half rows) on one page and repeats
that at many widths, templates and densities; `an-rows.mjs` then reports, per layout and detail, the widest card (and widest content,
card less padding) that still needs more rows than the layout's default, and the first width that does not.

**1. A measuring copy.** The app takes a card's rows from the registry (`heightFor`), so `find-rows` needs a copy where the rows can be
asked for instead. `find-rows` gives each item an id ending in its rows (`next-live|split|4|compact@2.5`); the copy has to read them
from there. The whole change is one line at the top of `estimate` in `src/components/widgets/page-renderer.tsx`:

```ts
export const estimate = (w: WidgetInstance, gap: number, box?: CardBox) => {
  const bm = /@([\d.]+)$/.exec(w.id); if (bm) return Number(bm[1]) * (ROW_HEIGHT + gap) - gap   // <- added, in the copy only
  const def = getWidget(w.type)
  return def ? heightFor(def, w.variant, w.detail, widthOf(w), box) * (ROW_HEIGHT + gap) - gap : 200
}
```

`serve-copy.sh` can apply it for you (the project is never touched; `PRE_BUILD` runs inside the copy before the build):

```bash
PRE_BUILD="python3 - <<'PY'
p = 'src/components/widgets/page-renderer.tsx'
s = open(p).read()
old = '  const def = getWidget(w.type)\n  return def ? heightFor(def, w.variant, w.detail, widthOf(w), box)'
new = '  const bm = /@([\\\\d.]+)\$/.exec(w.id); if (bm) return Number(bm[1]) * (ROW_HEIGHT + gap) - gap\n' + old
assert old in s, 'estimate() changed: adapt the patch'
open(p, 'w').write(s.replace(old, new, 1))
PY" scripts/widget-bench/serve-copy.sh /tmp/rows-copy 3107
```

If the assertion fails, `estimate` has changed since this was written: add the same line by hand to the copy's `estimate`.

**2. Measure, then analyse:**

```bash
node scripts/widget-bench/find-rows.mjs --base http://localhost:3107 \
  --ids "next-live|split|4,check-in|mood|4" --out /tmp/rows.json   # about 2 minutes for 5 layouts
node scripts/widget-bench/an-rows.mjs /tmp/rows.json
```

`--ids` takes `type|variant|width` (width 4, 8 or 12). Optional: `--viewports`, `--templates`, `--concurrency`. The viewports (960 to 1500)
are those that give the 3-column page, where card heights are fixed.

**3. Reading the result.** For each layout and detail `an-rows` prints, per density, how many widths needed extra rows, the widest card
and the widest content that still did (`card 349..352` is: 349 px needed them, the first measured width that did not was 352), and the
rows needed. The registry values were set from that: `cardBelow` where the layout flips by the card's own width (for example the Split
at 22rem = 352 px), `contentBelow` where it is the content that runs out (chips wrapping), a value above the largest width that needed
the extra rows and below the first that did not, with a little room for wider fonts; `minH` the rows needed.

**Limits.** `an-rows.mjs` has the layouts' default rows per detail written in its `BASE` table (the values of `heightFor` without
`narrow`); a layout that is not in it must be added there first, or the script fails. The thresholds are read from the measured
widths, so the fonts of the three templates are covered but a coach's own font is not.

## Compare two runs

`compare.mjs` lists, per widget, cells where what is visible on the card changed (text that disappears or appears), its height,
the parts removed by Drop, and defects that are new or gone. Use it for any change to thresholds, tokens, paddings or themes. Numbers are collapsed (`1,220` and `98` are both `#`). `--ignore open-positions` leaves out a widget whose content changes on every load (it draws live-looking figures); comparing a run with itself gives 0 changes, which is the determinism check.

## Known limits

- The Featured hero is set to manual play so two runs show the same slide; other motion runs as it does for a visitor, and the page is measured once it has settled. `--reduced-motion` runs the same matrix with `prefers-reduced-motion`, to check that the page does not depend on the motion setting.
- Overlap and small-text are warnings: some are legitimate (avatar initials at 9px, labels laid over a chart). Read them, do not gate on them.
- Charts are checked for clipping and overlap of their text, not for the correctness of what they draw.
- The Home layout of one coach (Northline) is used; widgets whose data differs for other coaches are not covered.
- Hover, open menus and other interaction states are not part of the matrix.
