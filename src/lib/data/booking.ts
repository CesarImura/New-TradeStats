"use client"

import { setStored, useStored } from "@/lib/prototype-store"

/**
 * The coach's booking page (Calendly or similar): one address, set in Settings › General and in the Join editor, shown on the subscribe
 * page as "Book a call". We do not see the booking itself. Empty: the line is not shown.
 */
export const bookingUrlOk = (v: string) => /^https?:\/\/\S+$/.test(v.trim())

export function useBookingUrl(slug: string) {
  return useStored<string>(`${slug}:booking`, "")
}

export function saveBookingUrl(slug: string, url: string) {
  setStored<string>(`${slug}:booking`, url, "")
}
