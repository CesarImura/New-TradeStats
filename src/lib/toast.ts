import { toast as base, type ExternalToast } from "sonner"
import { toastText } from "./toast-text"

/**
 * The one `toast` of the product (same API as sonner's), with two rules on top (docs/notifications.md):
 * 1. The words: a title is one short sentence without a final full stop; a second sentence becomes the description (lib/toast-text.ts).
 * 2. A notice with the same text as one already showing REPLACES it (and restarts its timer) instead of stacking, so pressing
 *    "Remind" or "Copy link" six times gives one notice, not six (QA 20/11). An explicit `id` still wins; the "Undo" notices have their own.
 * A notice with a custom body (not a string) is left as sonner makes it.
 */
type Message = Parameters<typeof base>[0]

const prepare = (message: Message, data?: ExternalToast): [Message, ExternalToast | undefined] => {
  if (typeof message !== "string") return [message, data]
  const { title, description } = toastText(message, data?.description)
  return [title, { ...data, id: data?.id ?? message, ...(description ? { description } : {}) }]
}

const wrap = (fn: (message: Message, data?: ExternalToast) => string | number) => (message: Message, data?: ExternalToast) => {
  const [m, d] = prepare(message, data)
  return fn(m, d)
}

export const toast: typeof base = Object.assign(wrap(base), base, {
  success: wrap(base.success),
  error: wrap(base.error),
  warning: wrap(base.warning),
  info: wrap(base.info),
  message: wrap(base.message),
})
