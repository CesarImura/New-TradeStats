"use client"

import { useMemo } from "react"
import { DesignProvider } from "@/components/admin/design/design-fields"
import { useDraftEditor } from "@/components/admin/design/editor-shell"
import type { CustomCommunity } from "@/lib/data/communities"
import { resolveCoach, resolveTheme } from "@/lib/theme/resolve"

/**
 * The setup wizard edits the same draft as the Design workspace, with the same
 * fields (design-fields.tsx). So a change in setup is there in Design, and the
 * other way round. Publishing the platform publishes the draft.
 */
export function WizardDesign({ community, children }: { community: CustomCommunity; children: React.ReactNode }) {
  const { working, change, commit } = useDraftEditor(community.slug)
  const coach = useMemo(() => resolveCoach(community, working.content), [community, working.content])
  const theme = useMemo(() => resolveTheme(coach, working.theme), [coach, working.theme])
  return <DesignProvider value={{ coach, theme, working, change, commit }}>{children}</DesignProvider>
}
