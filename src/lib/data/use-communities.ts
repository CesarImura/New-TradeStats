"use client"

import { useSyncExternalStore } from "react"
import { NONE, account, customCommunities, subscribe } from "./communities"

/** Communities made with the setup wizard. Empty on the server and on first paint. */
export function useCustomCommunities() {
  return useSyncExternalStore(subscribe, customCommunities, () => NONE)
}

/** The signed-up coach, or null. */
export function useAccount() {
  return useSyncExternalStore(subscribe, account, () => null)
}
