"use client"

import { setStored, useStored } from "@/lib/prototype-store"
import { TRADES, type Trade } from "./trades"

/** Feedback the coach added in the prototype, shared by the admin and the student journal. */
export type FeedbackStore = Record<string, { thread: Trade["thread"]; done?: boolean; asked?: boolean }>

const NONE: FeedbackStore = {}
const key = (slug: string) => `${slug}:feedback`

export function useFeedback(slug: string) {
  return useStored<FeedbackStore>(key(slug), NONE)
}

export function addFeedback(slug: string, tradeId: string, patch: Partial<FeedbackStore[string]> & { add?: Trade["thread"][number] }) {
  setStored<FeedbackStore>(
    key(slug),
    (s) => {
      const cur = s[tradeId] ?? { thread: [] }
      const { add, ...rest } = patch
      return { ...s, [tradeId]: { ...cur, ...rest, thread: add ? [...cur.thread, add] : cur.thread } }
    },
    NONE,
  )
}

/** A trade with the prototype's saved feedback applied. */
export function withFeedback(t: Trade, store: FeedbackStore): Trade & { done: boolean } {
  const s = store[t.id]
  const review = s?.done ? "answered" : s?.asked ? "waiting" : t.review
  return { ...t, review, thread: [...t.thread, ...(s?.thread ?? [])], done: !!s?.done || t.review === "answered" }
}

export const allTrades = (store: FeedbackStore) => TRADES.map((t) => withFeedback(t, store))
