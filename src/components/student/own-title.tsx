"use client"

import { usePageTitleShown } from "@/components/widgets/shared"

/** A page's built-in title. Left out when the page has a Page title widget (Design → Pages), so it never shows twice. */
export function OwnTitle({ children }: { children: React.ReactNode }) {
  return usePageTitleShown() ? <>{children}</> : null
}
