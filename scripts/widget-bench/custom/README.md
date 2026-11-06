# Customization bench (`scripts/widget-bench/custom`)

Checks that what the Design editor offers does something, and that it survives a reload. Needs a copy of the app built with
`NEXT_PUBLIC_WIDGET_BENCH=1` (see `../README.md`; on Linux add `NODE_OPTIONS="--require scripts/widget-bench/chromium-shim.cjs"`).

| Script | Question it answers |
|---|---|
| `probe.mjs` + `summarize.mjs` / `analyze.mjs` | For each layout, does each customization the inspector offers change the card (and does one it hides?) |
| `propose-off.mjs` | From probe groups, which options to add to or take out of `OFF` in `widget-caps.ts` |
| `star-pixels.mjs`, `shot.mjs` | Stand out → Star and other effects, judged on pictures one card at a time |
| `editor-flow.mjs`, `flowdiff.mjs` | Real editor: click every option, restore, reload, publish, compare with the student page |
| `core-probe.mjs` | The page's own tools (Courses, Calendar, ...) and their fields |
| `detail-after-edit.mjs` | Detail shown in the editor after adding a note equals the one after a reload |
| `prints.mjs` | Before/after pictures of one card across widths and the editor's 4 → 12 → 4 columns cycle |

`alterations.mjs` lists the customizations; `sig.js` is the card signature (ignores generated ids and animation frames).
A DOM difference is not proof that a change is visible: check on a picture before offering an option.
