"use client"

import { useMemo } from "react"
import { CoachContext } from "@/components/coach/coach-provider"
import { WidgetFrame } from "@/components/widgets/kit"
import { getDemoCoach } from "@/lib/data/coaches"
import { resolveCoach } from "@/lib/theme/resolve"
import type { CoachTheme, Mode } from "@/lib/theme/types"
import type { Detail, Emphasis } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"

const coach = resolveCoach(getDemoCoach("northline")!)

/**
 * A component shown the way widgets use it (prototype only): inside the
 * white-label theme and a widget frame (so Emphasis and Detail apply), on a
 * card surface. `bare` drops the card, for pieces that are a surface themselves.
 */
export function KitPane({ children, mode, theme, emphasis, detail, scale = 1, width, bare }: { children: React.ReactNode; mode: Mode; theme: CoachTheme; emphasis: Emphasis; detail: Detail; scale?: number; width?: number; bare?: boolean }) {
  const scope = mode === "light" ? "wb-light" : "wb-dark"
  const ctx = useMemo(() => ({ coach, theme, base: "/c/northline", scope: `.${scope}`, preview: false }), [theme, scope])
  return (
    <CoachContext.Provider value={ctx}>
      <div className={cn(scope, "max-w-full")} style={{ color: "var(--foreground)", fontFamily: "var(--coach-font-body)", zoom: scale === 1 ? undefined : scale }}>
        <WidgetFrame emphasis={emphasis} detail={detail}>
          <div
            data-kit
            className={cn("@container max-w-full text-[0.8125rem]", !bare && "rounded-(--radius) border bg-card p-4 text-card-foreground")}
            style={{ width: width ?? 320, borderColor: "var(--border)" }}
          >
            {children}
          </div>
        </WidgetFrame>
      </div>
    </CoachContext.Provider>
  )
}
