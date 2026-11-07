/**
 * While a card is dragged to a new size the page marks <body data-grid-resizing>. The measuring hooks of the widgets (what to hide, which
 * Detail fits, rows that fit) watch their box with a SizeObserver: it holds its callbacks back for the length of the drag, so nothing pops
 * or swaps content at every size the card passes through, and calls them once when the drag ends. Used in place of ResizeObserver.
 */
const ATTR = "data-grid-resizing"
const END = "grid-resizing-end"

/** Called by the editor when a card starts (true) or stops (false) being resized. */
export function setGridResizing(on: boolean) {
  if (on) document.body.setAttribute(ATTR, "")
  else {
    document.body.removeAttribute(ATTR)
    window.dispatchEvent(new Event(END))
  }
}

/** A ResizeObserver that waits while a card is being resized, then reports once. Same observe and disconnect; entries are empty after a wait. */
export class SizeObserver {
  private ro: ResizeObserver
  private late = false
  private cb: ResizeObserverCallback
  private onEnd = () => {
    if (!this.late) return
    this.late = false
    this.cb([], this.ro)
  }
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb
    this.ro = new ResizeObserver((e, o) => {
      if (document.body.hasAttribute(ATTR)) this.late = true
      else cb(e, o)
    })
    window.addEventListener(END, this.onEnd)
  }
  observe(el: Element, options?: ResizeObserverOptions) {
    this.ro.observe(el, options)
  }
  unobserve(el: Element) {
    this.ro.unobserve(el)
  }
  disconnect() {
    this.ro.disconnect()
    window.removeEventListener(END, this.onEnd)
  }
}
