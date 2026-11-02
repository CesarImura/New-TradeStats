import { toast as notify, type ExternalToast } from "sonner"

/**
 * The canvas's notices ("added at the bottom", "removed"…) have their own toaster, top right under the editor's bar,
 * so while they show they never sit over the cards' resize handles or quick actions at the bottom of the canvas.
 */
export const CANVAS_TOASTS = "canvas"
export const toast = (message: string, data?: ExternalToast) => notify(message, { ...data, toasterId: CANVAS_TOASTS })
