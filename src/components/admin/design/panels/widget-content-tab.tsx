"use client"
import { useState } from "react"
import { ArrowDown, ArrowUp, Plus } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectOptions } from "@/components/kit/select-field"
import { getWidget, lookOf, settingApplies, settingsFor } from "@/components/widgets/registry"
import { useGroups } from "@/lib/data/access"
import type { WidgetInstance, WidgetNote } from "@/lib/widgets/layout"
import { cn } from "@/lib/utils"
import { BOX, InspectorSection, Row, Segmented, YesNo } from "../fields/controls"
import { useDesign } from "../fields/design-fields"
import { PHASES, PictureUpload, noteTargets } from "./builder-panels"
import { MediaCardsEditor } from "./media-cards-editor"
import { capsOf } from "./widget-caps"

/** The widget's own fields (from the registry), the coach's own text, button and picture, and who sees it. */
export type PhoneOrder = { index: number; total: number; custom: boolean; onMove: (step: -1 | 1) => void; onReset: () => void }

export function ContentTab({ w, pinned, onChange, part, phone }: { w: WidgetInstance; pinned?: boolean; onChange: (patch: Partial<WidgetInstance>, key: string) => void; part: "content" | "visibility"; phone?: PhoneOrder }) {
  const def = getWidget(w.type)!
  const { coach } = useDesign()
  const groups = useGroups(coach)
  const props = w.props ?? {}
  const setProp = (k: string, v: string | boolean) => onChange({ props: { ...props, [k]: v } }, `${w.id}-${k}`)
  const note = w.note ?? {}
  const hasNote = Object.values(note).some(Boolean)
  const [adding, setAdding] = useState(false)
  const setNote = (k: keyof WidgetNote, v: string) => onChange({ note: { ...w.note, [k]: v || undefined } }, `${w.id}-note-${k}`)
  const setShow = (k: "phase" | "group", v: string) => onChange({ show: { ...w.show, [k]: v || undefined } }, `${w.id}-show-${k}`)
  const select = cn(BOX, "w-full px-2")
  const variant = lookOf(def, w.variant).value
  // A field this layout draws only with More waits for More, and says so (as the header's description does).
  const all = settingsFor(def, w.variant)
  const unlocked = all.filter((s) => !s.more?.includes(variant) || w.detail === "detailed")
  const settings = unlocked.filter((s) => settingApplies(def, s, props))
  const later = all.filter((s) => !unlocked.includes(s))
  const free = !pinned && def.type !== "page-header"
  // Only where the layout draws it: the coach's own text, button and picture.
  const drawsNote = free && capsOf(w.type, variant).note
  if (part === "visibility")
    return free ? <Visibility w={w} onChange={onChange} groups={groups} setShow={setShow} select={select} phone={phone} /> : null
  return (
    <>
      {/* One block for everything the widget says: its own fields, then the coach's extra text, button or picture. */}
      {(all.length > 0 || drawsNote) && (
        <InspectorSection title="Content">
          {settings.map((s) => {
            if (s.type === "cards")
              return <MediaCardsEditor key={s.key} kind={s.kind} max={s.max} label={s.label} props={props} onProps={(patch, key) => onChange({ props: { ...props, ...patch } }, `${w.id}-${key}`)} picture={(value, onPick) => <PictureUpload value={value} onChange={onPick} />} />
            if (s.type === "toggle")
              return (
                <Row key={s.key} label={s.label} stack={s.label.length > 14}>
                  <YesNo label={s.label} value={props[s.key] === undefined ? !!s.defaultOn : !!props[s.key]} onChange={(v) => setProp(s.key, v)} />
                </Row>
              )
            if (s.type === "select")
              return (
                <Row key={s.key} label={s.label} stack={s.label.length > 14}>
                  <SelectOptions value={String(props[s.key] ?? s.options[0].value)} onChange={(e) => setProp(s.key, e.target.value)} aria-label={s.label} className={select}>
                    {s.options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectOptions>
                </Row>
              )
            if (s.type === "image")
              return (
                <Row key={s.key} label={s.label} stack>
                  <PictureUpload value={typeof props[s.key] === "string" ? String(props[s.key]) : ""} onChange={(v) => setProp(s.key, v)} />
                </Row>
              )
            return (
              <Row key={s.key} label={s.label} stack>
                {s.type === "textarea" ? (
                  <Textarea value={String(props[s.key] ?? "")} placeholder="Leave empty for the default text" aria-label={s.label} onChange={(e) => setProp(s.key, e.target.value)} className="min-h-20 t-body-m" />
                ) : (
                  <Input value={String(props[s.key] ?? "")} placeholder={s.placeholder ?? "Leave empty for the default"} aria-label={s.label} onChange={(e) => setProp(s.key, e.target.value)} className="h-8 t-body-m" />
                )}
              </Row>
            )
          })}
          {later.length > 0 && <p className="t-caption text-muted-foreground">{later.map((s) => s.label).join(", ")} shows with More.</p>}
          {drawsNote && (
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3">
          {hasNote || adding ? (
            <>
              <Row label="Text" stack>
                <Textarea value={note.text ?? ""} aria-label="Text" onChange={(e) => setNote("text", e.target.value)} className="min-h-20 t-body-m" />
              </Row>
              <Row label="Button">
                <Input value={note.button ?? ""} placeholder="Button text" aria-label="Button text" onChange={(e) => setNote("button", e.target.value)} className="h-8 t-body-m" />
              </Row>
              <Row label="Opens">
                <SelectOptions value={note.target ?? noteTargets()[0].value} aria-label="Opens" onChange={(e) => setNote("target", e.target.value)} className={select}>
                  {noteTargets().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectOptions>
              </Row>
              {note.target === "url" && (
                <Row label="Address">
                  <Input value={note.url ?? ""} placeholder="https://" aria-label="Web address" onChange={(e) => setNote("url", e.target.value)} className="h-8 t-body-m" />
                </Row>
              )}
              <Row label="Picture" stack>
                <PictureUpload value={note.image} onChange={(v) => setNote("image", v)} />
              </Row>
            </>
          ) : (
            // Its own text, button or picture, one click away, under the widget's own fields.
            <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => setAdding(true)}>
              <Plus /> Add text, button or picture
            </Button>
          )}
            </div>
          )}
        </InspectorSection>
      )}

    </>
  )
}

/** Who sees the widget: phones, a phase of the student's life, a group. Last in the panel: set once, rarely changed. */
/** A control that can't be used right now: dimmed, dashed edge, not-allowed cursor. */
export const DISABLED = "cursor-not-allowed border-dashed opacity-40"

export function Visibility({ w, onChange, groups, setShow, select, phone }: { w: WidgetInstance; onChange: (patch: Partial<WidgetInstance>, key: string) => void; groups: { id: string; name: string }[]; setShow: (k: "phase" | "group", v: string) => void; select: string; phone?: PhoneOrder }) {
  // Hidden: who sees it doesn't apply, so Phase and Group stay in view, plainly off (dimmed, dashed, no pointer), with why.
  const off = !!w.hideOnPhone
  return (
      <InspectorSection title="Visibility">
        <Row label="On phones" own={!!w.hideOnPhone} onReset={() => onChange({ hideOnPhone: false }, `${w.id}-phone`)} from="shown">
          <Segmented
            label="On phones"
            value={w.hideOnPhone ? "hide" : "show"}
            onChange={(v) => onChange({ hideOnPhone: v === "hide" }, `${w.id}-phone`)}
            options={[
              { value: "show", label: "Show" },
              { value: "hide", label: "Hide" },
            ]}
          />
        </Row>
        {phone && !off && phone.index >= 0 && (
          <Row label="Order on phones" hint={phone.custom ? `Number ${phone.index + 1} of ${phone.total}, set for phones` : `Number ${phone.index + 1} of ${phone.total}, same as the desktop`} own={phone.custom} onReset={phone.onReset} from="desktop order">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" disabled={phone.index === 0} onClick={() => phone.onMove(-1)}>
                <ArrowUp /> Earlier
              </Button>
              <Button variant="outline" size="sm" className="flex-1" disabled={phone.index === phone.total - 1} onClick={() => phone.onMove(1)}>
                <ArrowDown /> Later
              </Button>
            </div>
          </Row>
        )}
        <Row label="Phase" hint={off ? "Hidden on phones: shown again with Show" : "Show it only in one phase of a student's life"} own={!!w.show?.phase} onReset={() => setShow("phase", "")} from="everyone">
          <SelectOptions disabled={off} value={w.show?.phase ?? ""} aria-label="Phase" onChange={(e) => setShow("phase", e.target.value)} className={cn(select, off && DISABLED)}>
            {PHASES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectOptions>
        </Row>
        <Row label="Group" hint={off ? "Hidden on phones: shown again with Show" : "Show it only to one group"} own={!!w.show?.group} onReset={() => setShow("group", "")} from="everyone">
          <SelectOptions disabled={off} value={w.show?.group ?? ""} aria-label="Group" onChange={(e) => setShow("group", e.target.value)} className={cn(select, off && DISABLED)}>
            <option value="">Everyone</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </SelectOptions>
        </Row>
      </InspectorSection>
  )
}
