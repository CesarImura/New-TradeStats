/**
 * Admin / Editor Canvas dots (Figma 1189:71873): the grey field the page and the previews sit on, with dots in
 * `component/editor/canvas/dot` (white 8 %). The grey (#2b2b2e) is a plain fill in Figma, not a variable, so it lives here once.
 * It stays lighter than the editor's black cards on purpose: the coach's page (in the coach's colours) must stand out from the tool.
 */
export const CANVAS_FILL = "#2b2b2e"

/** Inline style for a field that shows the dots: `size` is the grid step in px (16 by default, as in /setup), `at` shifts it with a pan. */
export const canvasDots = (size = 16, at = "0 0"): React.CSSProperties => ({
  backgroundColor: CANVAS_FILL,
  backgroundImage: "radial-gradient(circle, var(--admin-component-editor-canvas-dot) 1px, transparent 1.4px)",
  backgroundSize: `${size}px ${size}px`,
  backgroundPosition: at,
})
