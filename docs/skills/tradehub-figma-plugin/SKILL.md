---
name: tradehub-figma-plugin
description: "Use whenever a script runs in the TradeHub Figma file through use_figma: Helvetica Neue font swap, variables and paints, components and instances, slots, cloning, screenshots, what the MCP cannot do (named versions, page deletion, layer reorder) and how to recover from a failed call."
---

# Tradehub Figma: Plugin API manual

Scope: HOW to run scripts safely (API behaviour only). It never decides design rules, colours, sizes or what a component should look like: those live in `tradehub-figma` (file, components, variables) and `tradehub-figma-visual` (Admin and Editor design). If a gotcha here seems to contradict a design rule, the design rule wins; fix the script, not the design. Add new API lessons here only.

Scripts: /mnt/project-files/figma-tradehub/scripts/ (inter-swap.js, audit-page.js, foundations-sync.tmpl.js, bind-colors.tmpl.js, fingerprint-page.js, panel-convert-A/B.tmpl.js, table-convert-*.js).

## Calls and safety
- Never run mutating use_figma calls in parallel. A thrown error rolls back the whole call (a final `throw` tests safely). A const declared inside try is not visible after it.
- Never write a loop that can't end (freezes the plugin). findAll over ~40k nodes takes ~4 s: fine.
- End statements with ';' (a line starting with '(' becomes a call).
- Deleting may be blocked by the safety classifier until Gustavo approves in chat.
- Prefer findAll or ids over findOne/regex; filter by exact parent (parent.name === '...') or id, never by a default label that may be hidden (a findOne sweep once changed 93 screens).
- `setPluginData` is unsupported on the remote host: use `setSharedPluginData` plus `new AsyncFunction` to keep long scripts in the file (clear them at the end).
- Skip invisible nodes in audits; three hidden page-level helper texts ("_kit code", "_v2 convert code", "_builder code") are ignored.

## Fonts (Helvetica Neue)
- Helvetica Neue can't be loaded. To edit those texts (characters, auto-resize, clone/insertChild/reparent, moving frames between sections) use inter-swap.js in the SAME call: load Inter (Regular, Medium, Semi Bold, Bold, Light) and Noto Sans Symbols2 (Space Mono only for a theme text), set Admin `font/family/primary` = "Inter" in every mode (today only the mode `Admin`), wait 300-400 ms, edit, and restore ALL modes in a `finally`. Helvetica Neue has no 'Semi Bold': use Regular, Medium or Bold or the restore fails and the whole call rolls back. While swapped, nodes report 'Inter': detect fonts in a separate read-only call after restoring. Bind a text node or style with `setBoundVariable('fontFamily', primaryVar)`.
- Even with the swap (and a 300 ms wait after setValueForMode), moving a big frame INTO a new Section can fail: keep variants in a second row of the same section instead.

## Variables and paints
- `setBoundVariableForPaint` changes paint opacity: set `opacity` = the variable's alpha (alpha tokens render opaque white otherwise). With a black base it can render black on new strokes: pass the real resolved colour and check a screenshot. A gradient stop with alpha 0 can't be bound: leave it unbound. Gradient stops bind via `boundVariables: {color: figma.variables.createVariableAlias(v)}`.
- `variable.codeSyntax` is read-only: use `setVariableCodeSyntax('WEB', 'var(--admin-...)')`. Primitives: `hiddenFromPublishing = true`, `scopes = []`. Bind layout with `setBoundVariable('itemSpacing'|'paddingLeft'..., spaceVar)`.
- Bulk rebind: always screenshot a sample afterwards, and never bulk-swap accent/strong to accent/default (a wrong swap touched 343 nodes). Skip product previews (Admin / Editor Preview shell, Public / Shell, Preview · ...): Terminal territory.
- Before deleting a variable check what is still bound to it; rebind, delete, then sync Foundations.
- 'Used variable' scan: Foundations swatches bind every colour, so scan Components + Screens + Cover only, include gradient stops, text ranges, effects and alias chains.
- Mixed-colour text: getStyledTextSegments(['fills']) then setRangeFills.

## Components, variants, instances
- `addComponentProperty(name,type,default)` returns the real key ('Show Prefix#771:0'): link with `node.componentPropertyReferences = {visible|characters|mainComponent: key}`. Cloning a variant does NOT copy references: relink. Read `componentPropertyDefinitions` only from a COMPONENT_SET or stand-alone COMPONENT (a Base is a plain COMPONENT). Text/variant props of a public wrapper live on its nested _Base (`inst.children[0].setProperties`); never pass slot props to setProperties.
- Renaming a variant keeps instances linked; after renaming a fresh clone `findOne` may return null (edit children first). Variant option order does not follow child order: reorder children, rename `State=X` to `State=zX`, read the definitions, rename back. combineAsVariants re-keys properties (overrides survive); lift the set out of its 'Frame · ...' wrapper and delete the empty frame.
- Hidden instance children are missing from `.children`: use a boolean property (Show X) + setProperties, not node.visible.
- `swapComponent` keeps old size/padding, loses slot content, loses icon colour (save fills, reapply) and leaves child handles stale: re-fetch in a 2nd call. Test on 2-3 instances with non-standard content before migrating many.
- Never recreate the _Base instance inside a public wrapper used in screens: it wipes every screen's text overrides. List usages and copy values first. Moving a node out of a _Base group leaves ghost overrides.
- `resize()` on a child of an instance does NOT stick. Change the size inside the variant, or reset overrides. For proportional bars make the track an auto-layout with two FILL children (Value, Rest) and set layoutGrow (e.g. 62/38); 0% hide Value, 100% hide Rest.
- An instance whose size differs from its main can be drawn with the old size in some clients: make the main the real size and, if needed, detachInstance (detached nested instances lose ids starting with 'I': audits flag false positives).
- After a base changes, instances keep a stale layout: re-set size/padding or toggle layoutSizing, or nudge height +2/-2 with resizeWithoutConstraints.
- A _Base inside a fixed-size wrapper does not resize with Size: give the public component its own Size variant.
- Overview screen frames have `itemReverseZIndex` on (first child is on top): a new absolute overlay goes in with `insertChild(0)`. `resizeWithoutConstraints(+2/−2)` on a frame changes the height of its Atmosphere child: restore it afterwards.
- Wrapping a rectangle in a HUG frame turns it FILL; a wrapper of an ABSOLUTE node must stay ABSOLUTE; `layoutGrow` takes integers; absolute children use `layoutPositioning = 'ABSOLUTE'`; cloned Field labels keep FIXED height (set HUG). A FILL text moved can collapse to width 1: set HUG then FILL.
- Vectors: `figma.createVector()` + `vectorPaths`. Group to frame without visual change: new frame, no fill, clipsContent false, same x/y/size, move children.
- `setProperties` needs the real property name (read `componentProperties` keys first; e.g. 'Hierarchy'). Detach instances outermost first, in rounds, one section per call.
- After widening or resizing an instance with nested cards, nested text keeps the old width or x (a description stuck at 134 px, a title 7 px off). Fix: re-set padding on the row and toggle layoutSizing (FIXED then FILL), or textAutoResize NONE, resize, HEIGHT, FILL (with the Inter swap); then check title, description and control in a screenshot.
- New variant of a set: clone the variant, `set.appendChild(clone)`, rename it 'Prop=Value, Size=X' (the property is created by the rename), then lay the variants out in a grid and resizeWithoutConstraints the set. `node.rescale(s)` on a component scales its whole content; to fit drawn content (illustrations) in a frame, rescale children with a uniform factor and keep margins.

## Slots
- Never set `componentPropertyReferences={visible:...}` on a SLOT (it becomes a FRAME). Bind a Show boolean to the slot's container instead. Empty slots reserve space.
- No `figma.createSlot`; `component.createSlot()` creates a SLOT property named after the node (clear its white default fill; slots can be ABSOLUTE). `clone()` of a SLOT returns a frame; a slot inside a nested instance (public to base) is not editable; to make a slot component clone `Admin / Panel` and delete its header and Show Header.
- Nodes created or moved into a SLOT get new ids, `indexOf` can be -1, `insertChild` may report -1 (use appendChild), and sizes can't be read in the same call: set layoutSizing and check in a 2nd call. Find the real child through the parent by name and position.
- Conversion into slots: step A converts, keeps a hidden ' · backup' on the page root plus a hash of the original; step B compares the hash and deletes the backup or restores (panel-convert-A/B). Never compare against the clone (ABSOLUTE, reflows). Save measurements before.
- `clone()` of a text inside an instance can fail: create the text with the source textStyleId and a bound fill.
- `insertChild` into an instance only works for SLOT contents (not auto-layout children). A clone of a frame with instances can miss nested nodes in the same call: create in one call, edit in the next. Anything appended into a slot needs `layoutSizingHorizontal='FILL'` set AFTER appending, then a +2/-2 height nudge to render; a Field in a slot needs vertical HUG. Clones of frames land on the page root: move them into the Section.

## Cloning frames and scripts
- Cloned frames: create in one call and edit text in the next; swap the font to Inter and load Archivo and Space Mono for public pages (Terminal). Error text on a public page: primitive/red/300. Do not put \n inside a script string sent via JSON (it breaks as a literal): use '\\n'.split/join or a real template literal.

## Screenshots and visual checks
- Screenshots can lag: re-take after edits. A frame screenshot may not show an absolute child covered by another: check z-order before concluding it rendered wrong. get_screenshot rejects ids starting with 'I': use the screen id. Copy the URL exactly; on the Mac curl it to PNG and montage with PIL.
- Cloud sessions cannot download screenshots (figma.com blocked): verify by data (counts, fills, sizes) or the Chrome extension (navigate to the node-id URL, wait ~7 s, zoom, close the tab; call navigate/screenshot one by one, browser_batch is rejected; shift+1 fits the page). Say which checks were only by data.
- Compare against code at FULL SCALE (1920), never downscaled; measure the DOM with getBoundingClientRect instead of guessing from pixels.
- Read assets for code: a vector or logo frame exports with `await node.exportAsync({format:'SVG_STRING'})` in a read-only call (return under 48 KB). Screen sections are named `Admin · NN Name`.
## Lessons from the reorganization (21/11/2026)
- `figma.saveVersionHistoryAsync` is not implemented in the MCP: ask Gustavo to save a named version (File › Save to version history) before risky work.
- Deleting a page (`page.remove()`) is blocked by the safety classifier even with approval: ask Gustavo to delete it in the UI.
- Moving and renaming top-level frames (x, y, name) needs no font; `insertChild`/`appendChild` of anything that holds Helvetica Neue text fails, even with the Inter swap, when some texts are not bound to `font/family/primary`. Reordering sections in the Layers panel therefore fails: leave the layer order.
- A thrown error rolls back the whole `use_figma` call: put risky edits last and check the rollback with a read call.
- A component set whose `parent` is null but `removed` is false is an orphaned main component (instances still render). Re-attach it with `section.appendChild(set)` after loading the fonts of its texts: ids, instances and overrides stay.
- Slot content (e.g. the widgets inside `Admin / Editor Preview shell`) is per instance: fixing a text there means fixing every instance (`findAll` by text inside the named frame).
- Notes are frames with bound text styles: clone an existing `Note · …` (title "Nota de design" + bullet text), append to the section, set the bullet text under the Inter swap, restore in `finally`.
- use_figma in a remote session can't load Helvetica Neue: text edits and clones with Helvetica need the Inter swap (§Fonts).
