"use client"

import { useSyncExternalStore } from "react"
import { NONE, account, customCommunities, subscribe } from "./communities"

/** Communities made with the setup wizard. Empty on the server and on first paint. */
export function useCustomCommunities() {
  return useSyncExternalStore(subscribe, customCommunities, () => NONE)
}

/**
 * A platform made in setup starts empty. Reading the sample as a store's fallback keeps the server and the first client
 * render equal (hydration); this swaps the untouched sample for `empty` once the browser knows the platform is a setup one.
 */
export function useEmptyIfSetup<T>(slug: string, value: T, sample: T, empty: T): T {
  const setup = useCustomCommunities().some((c) => c.slug === slug)
  return setup && value === sample ? empty : value
}

/** The signed-up coach, or null. */
export function useAccount() {
  return useSyncExternalStore(subscribe, account, () => null)
}
