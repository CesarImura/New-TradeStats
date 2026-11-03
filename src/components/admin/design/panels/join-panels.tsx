"use client"

import { useRef } from "react"
import { toast } from "sonner"
import { ImagePlus } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { JOIN_SCREENS, joinTheme, type JoinCopy, type JoinDraft, type JoinLook, type JoinScreenId } from "@/lib/data/join"
import { pictureFrom } from "@/lib/images"
import { onColor } from "@/lib/theme/derive"
import { cn } from "@/lib/utils"
import { BackgroundControl } from "../fields/background-control"
import { Field, InspectorSection, Segmented, Swatches } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { card } from "../states"
import { InspectorTop } from "./widget-inspector"

/** What each screen says when the coach hasn't changed it: shown as the field's hint, so an empty field is never a mystery. */
const DEFAULTS: Record<JoinScreenId, { title: (name: string) => string; subtitle: string; button?: string }> = {
  login: { title: () => "Welcome back", subtitle: "Log in to your platform.", button: "Send me a code" },
  signup: { title: (name) => `Join ${name}`, subtitle: "No card needed.", button: "Join free" },
  subscribe: { title: (name) => `Join ${name}`, subtitle: "One page, about a minute. Your account is made from your e-mail after you pay." },
}

/** The Join draft and how to save it: one step in Undo per change, like every other setting. */
function useJoin() {
  const { working, commit } = useDesign()
  const join: JoinDraft = working.content.join ?? {}
  const set = (next: JoinDraft, key: string) => commit({ ...working, content: { ...working.content, join: next } }, `join-${key}`)
  return { join, set }
}

/** The look the three Join screens share, in the inspector with each screen's own settings. */
function JoinLook() {
  const { theme } = useDesign()
  const { join, set } = useJoin()
  const custom = join.look !== undefined
  const look = join.look ?? {}
  const shown = joinTheme(theme, look)
  const setLook = (patch: JoinLook, key: string) => set({ ...join, look: { ...look, ...patch } }, key)

  return (
    <InspectorSection title="Look · all Join screens" defaultOpen={false} summary={custom ? "Custom" : "Platform"}>
      <div className="grid gap-4">
        <p className="text-xs leading-4 text-muted-foreground">Shared by Log in, Sign up and Subscribe. The platform your members use after they join does not change.</p>
        <Segmented
          label="Look of the Join screens"
          value={custom ? "custom" : "platform"}
          onChange={(v) => (v === "custom" ? set({ ...join, look: {} }, "look-on") : set({ ...join, look: undefined }, "look-off"))}
          options={[
            { value: "platform", label: "Same as platform", hint: "These screens follow your platform's look" },
            { value: "custom", label: "Custom", hint: "A look of their own" },
          ]}
        />
        {custom && (
          <div className="grid gap-5 pt-1">
            <BackgroundControl theme={shown} onChange={(p, key) => setLook(p, key)} where={false} />
            <Field label="Button colour">
              <Swatches
                label="Button colour"
                value={shown.primary}
                colors={[...new Set([theme.primary, "#ffffff", "#f8ff9e", "#3a6df0"])]}
                onChange={(c) => setLook({ primary: c, primaryForeground: onColor(c) }, "primary")}
              />
            </Field>
            <Field label="Card">
              <Segmented
                label="Card"
                value={shown.cardSurface ?? "raised"}
                onChange={(cardSurface) => setLook({ cardSurface }, "card")}
                options={[
                  { value: "raised", label: "Raised" },
                  { value: "grey", label: "Grey" },
                  { value: "outline", label: "Outline" },
                ]}
              />
            </Field>
            <Field label="Corners">
              <Segmented
                label="Corners"
                value={shown.radius <= 4 ? 2 : shown.radius <= 10 ? 8 : 16}
                onChange={(radius) => setLook({ radius }, "corners")}
                options={[
                  { value: 2, label: "Sharp" },
                  { value: 8, label: "Soft" },
                  { value: 16, label: "Round" },
                ]}
              />
            </Field>
            <Button variant="ghost" size="sm" className="w-fit" onClick={() => set({ ...join, look: undefined }, "look-off")}>
              Reset to platform look
            </Button>
          </div>
        )}
      </div>
    </InspectorSection>
  )
}

/** Right: the selected screen's words and layout. */
export function JoinInspector({ screen }: { screen: JoinScreenId }) {
  const { coach } = useDesign()
  const { join, set } = useJoin()
  const info = JOIN_SCREENS.find((s) => s.id === screen)!
  const copy: JoinCopy = join.screens?.[screen] ?? {}
  const def = DEFAULTS[screen]
  const own = Object.values(copy).some((v) => v !== undefined && v !== "")
  const edit = (patch: Partial<JoinCopy>, key: string) => set({ ...join, screens: { ...join.screens, [screen]: { ...copy, ...patch } } }, `${screen}-${key}`)
  // The checkout is one task on one screen: it has no side picture, no second way in.
  const account = screen !== "subscribe"
  const file = useRef<HTMLInputElement>(null)
  const text = (key: "title" | "subtitle" | "button", label: string, hint: string) => (
    <Field label={label}>
      <Input
        value={copy[key] ?? ""}
        placeholder={hint}
        aria-label={label}
        maxLength={key === "subtitle" ? 120 : 48}
        onChange={(e) => edit({ [key]: e.target.value || undefined }, key)}
        className="h-8 text-[0.8125rem]"
      />
    </Field>
  )

  return (
    <div>
      <InspectorTop>
        <span className="truncate text-[0.875rem] font-semibold">{info.label}</span>
      </InspectorTop>
      <div className="grid gap-4 px-5 pb-5">
        <p className="text-xs leading-4 text-muted-foreground">{info.hint}. Leave a field empty to keep the default words.</p>
        {text("title", "Title", def.title(coach.name))}
        {text("subtitle", "Subtitle", def.subtitle)}
        {def.button && text("button", "Button", def.button)}
      </div>
      {account && (
        <InspectorSection title="Layout">
          <div className="grid gap-4">
            <Field label="Layout">
              <Segmented
                label="Layout"
                value={copy.layout ?? "center"}
                onChange={(layout) => edit({ layout }, "layout")}
                options={[
                  { value: "center", label: "Centered", hint: "One card in the middle" },
                  { value: "split", label: "Split", hint: "A picture beside the card" },
                ]}
              />
            </Field>
            {copy.layout === "split" && (
              <Field label="Picture">
                <button type="button" onClick={() => file.current?.click()} className={cn("flex h-20 items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed bg-cover bg-center text-xs text-muted-foreground", card(!!copy.sideImage))} style={copy.sideImage ? { backgroundImage: `url("${copy.sideImage}")` } : undefined}>
                  {!copy.sideImage && (
                    <>
                      <ImagePlus className="size-4" /> Add a picture
                    </>
                  )}
                </button>
                <input
                  ref={file}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ""
                    if (!f) return
                    try {
                      edit({ sideImage: await pictureFrom(f, { max: 1200, side: "width", quality: 0.8, keep: [] }) }, "side")
                    } catch (err) {
                      toast.error((err as Error).message)
                    }
                  }}
                />
                {copy.sideImage && (
                  <Button variant="ghost" size="sm" className="w-fit" onClick={() => edit({ sideImage: undefined }, "side")}>
                    Remove picture
                  </Button>
                )}
              </Field>
            )}
            <Field label="Continue with Discord">
              <Segmented
                label="Continue with Discord"
                value={copy.discord === false ? "hide" : "show"}
                onChange={(v) => edit({ discord: v === "show" ? undefined : false }, "discord")}
                options={[
                  { value: "show", label: "Show" },
                  { value: "hide", label: "Hide" },
                ]}
              />
            </Field>
          </div>
        </InspectorSection>
      )}
      <JoinLook />
      {own && (
        <div className="px-5 pb-6">
          <Button variant="ghost" size="sm" onClick={() => set({ ...join, screens: { ...join.screens, [screen]: undefined } }, `${screen}-reset`)}>
            Reset this screen
          </Button>
        </div>
      )}
    </div>
  )
}
