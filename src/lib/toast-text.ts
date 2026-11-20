/**
 * The rule for the words of a notice (docs/notifications.md): the title is ONE short sentence without a final full stop; whatever
 * comes after it is the description, which is a sentence and keeps its full stop. Written once here so 130 call sites say it the same way:
 * "Link copied." becomes "Link copied", and "Changes discarded. Your platform is back to the live version." becomes the title
 * "Changes discarded" with the second sentence as its description.
 */
const SENTENCE_BREAK = /(?<=[a-z0-9)”"'’])\.\s+(?=[A-Z⌘])/

export function toastText(message: string, description: unknown): { title: string; description?: string } {
  const text = message.trim()
  if (description !== undefined) return { title: text.replace(/(?<!\.)\.$/, "") }
  const at = text.search(SENTENCE_BREAK)
  if (at > 0) {
    const first = text.slice(0, at)
    const words = first.trim().split(/\s+/)
    // "J. Smith" is not the end of a sentence (a one-letter last word), and a one-word first part is not a title worth splitting off.
    if (/^[A-Za-z]$/.test(words[words.length - 1]) || words.length < 2) return { title: text.replace(/(?<!\.)\.$/, "") }
    return { title: first, description: text.slice(at + 1).trim() }
  }
  return { title: text.replace(/(?<!\.)\.$/, "") }
}
