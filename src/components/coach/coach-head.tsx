"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { markIcon } from "@/lib/theme/mark-icon"
import { useCoach } from "./coach-provider"

/**
 * Tab title and icon in the coach's brand. The server sets them from the demo
 * community (see the layouts' generateMetadata); the saved design lives in this
 * browser, so the name and logo the coach changed are applied here, after each
 * navigation too (Next.js writes the route's metadata again when the page changes).
 */
export function CoachHead() {
  const { coach, theme } = useCoach()
  const pathname = usePathname()
  useEffect(() => {
    document.title = coach.name
    const href = coach.logo || markIcon(coach.mark, theme.primary, theme.primaryForeground)
    const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')]
    if (!links.length) {
      const link = document.createElement("link")
      link.rel = "icon"
      document.head.appendChild(link)
      links.push(link)
    }
    links.forEach((l) => {
      l.href = href
      l.removeAttribute("sizes")
      l.removeAttribute("type")
    })
  }, [coach.name, coach.logo, coach.mark, theme.primary, theme.primaryForeground, pathname])
  return null
}
