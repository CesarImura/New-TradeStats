"use client"

import { useState } from "react"
import { Download, MoreHorizontal, Plus } from "@/components/icons"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  AdminButton, AdminDrawer, AdminField, AdminFilter, AdminModal, AdminPageHeader, AdminProgress, AdminSearch, AdminSegmented, AdminTabs, AdminToolbar, AdminUnderlineTabs,
  Callout, CellDot, CellPerson, CellProgress, CellStack, Dropzone, EmptyState, FileItem, LessonCard, MediaCard, Metric, OptionCard, Panel, SortableRow, StatPanel, StepIndicator, Tag, adminControl,
} from "@/components/admin/ui"

const TONES = ["neutral", "accent", "success", "warning", "danger", "info"] as const
const HIER = ["primary", "secondary", "ghost", "danger", "highlight"] as const
const SIZES = ["sm", "md", "lg", "xl"] as const

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3" aria-label={title}>
      <h2 className="t-mono-label text-a-text-3">{title}</h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  )
}

/** Dev-only gallery: every Admin kit component in its states, to test them at each breakpoint. Not linked from the app. */
export default function KitGallery() {
  const [seg, setSeg] = useState("a")
  const [ul, setUl] = useState("one")
  const [tab, setTab] = useState("all")
  const [opt, setOpt] = useState("x")
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState("all")
  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10">
      <AdminPageHeader title="Kit" subtitle="Admin components in their states." actions={<AdminButton><Plus /> Action</AdminButton>} />
      <Block title="Button · hierarchy × size, default and disabled, icon only">
        {HIER.map((h) => (
          <div key={h} className="grid gap-2" data-hier={h}>
            {SIZES.map((s) => (
              <div key={s} className="flex items-center gap-2">
                <AdminButton hierarchy={h} size={s}>Label</AdminButton>
                <AdminButton hierarchy={h} size={s} disabled>Label</AdminButton>
                <AdminButton hierarchy={h} size={s} iconOnly aria-label="Add"><Plus /></AdminButton>
              </div>
            ))}
          </div>
        ))}
      </Block>
      <Block title="Tag · tones, with dot"><>{TONES.map((t) => <Tag key={t} tone={t} dot>{t}</Tag>)}</></Block>
      <Block title="Callout · tones"><div className="grid w-full gap-2">{(["neutral", "accent", "success", "warning", "danger"] as const).map((t) => <Callout key={t} tone={t} action={<AdminButton hierarchy="secondary" size="md">Review</AdminButton>}>Message for the {t} callout</Callout>)}</div></Block>
      <Block title="Tabs · toolbar group, underline, segmented">
        <AdminTabs label="Group" value={tab} onChange={setTab} tabs={[{ id: "all", label: "All", count: 5 }, { id: "att", label: "Needs attention", count: 2, dot: true }, { id: "pub", label: "Published", count: 3 }]} />
        <AdminUnderlineTabs label="Underline" value={ul} onChange={setUl} tabs={[{ id: "one", label: "Lesson" }, { id: "two", label: "Chapters", count: 6 }, { id: "three", label: "Quiz", count: 4 }]} />
        <div className="w-full max-w-72"><AdminSegmented label="Segmented" value={seg} onChange={setSeg} options={[{ value: "a", label: "Monthly" }, { value: "b", label: "One payment" }, { value: "c", label: "3 months" }]} /></div>
      </Block>
      <Block title="Option card · default, active, disabled">
        <div className="grid w-full max-w-md gap-2" role="radiogroup" aria-label="Options">
          <OptionCard checked={opt === "x"} onSelect={() => setOpt("x")} title="All tiers" description="Everyone with any paid or free tier" />
          <OptionCard checked={opt === "y"} onSelect={() => setOpt("y")} title="Pick tiers" description="Only the tiers you choose" />
          <OptionCard checked={false} onSelect={() => {}} disabled title="Sell it on its own" description="Disabled" />
        </div>
      </Block>
      <Block title="Form · field states, controls, filter, search">
        <div className="grid w-full max-w-72 gap-4">
          <AdminField label="Default" hint="Helper text">{(p) => <input {...p} className={`${adminControl} h-11`} defaultValue="Value" />}</AdminField>
          <AdminField label="Error" error="Something is wrong">{(p) => <input {...p} className={`${adminControl} h-11`} defaultValue="Oops" />}</AdminField>
          <AdminField label="Disabled" optional>{(p) => <input {...p} disabled className={`${adminControl} h-11`} defaultValue="Locked" />}</AdminField>
        </div>
        <div className="grid gap-3">
          <label className="flex items-center gap-3 t-body-m"><Checkbox defaultChecked /> Checked</label>
          <label className="flex items-center gap-3 t-body-m"><Checkbox /> Unchecked</label>
          <label className="flex items-center gap-3 t-body-m"><Switch defaultChecked /> On</label>
          <label className="flex items-center gap-3 t-body-m"><Switch /> Off</label>
        </div>
        <div className="grid gap-3"><AdminSearch value={q} onChange={setQ} placeholder="Search" hint="⌘K" /><AdminFilter label="Tier" value={filter} onValueChange={setFilter} options={[{ value: "all", label: "All tiers" }, { value: "core", label: "Core" }]} /></div>
      </Block>
      <Block title="Files · dropzone, file items, sortable rows">
        <div className="grid w-full max-w-sm gap-3">
          <Dropzone title="Drop a file here, or click" hint="Up to 200 MB" onFiles={() => {}} />
          <FileItem name="Trend checklist.pdf" meta="1.2 MB · Ready" />
          <FileItem name="Trend checklist.pdf" status="uploading" progress={40} meta="480 KB of 1.2 MB" />
          <FileItem name="Trend checklist.pdf" status="done" meta="1.2 MB · Complete" />
          <FileItem name="Trend checklist.pdf" status="error" meta="Upload failed · Retry" />
        </div>
        <div className="grid w-full max-w-xs gap-2">
          <SortableRow title="Default" description="One line" trailing={<Tag>New</Tag>} />
          <SortableRow title="Active" description="One line" active />
          <SortableRow title="Dragging" description="One line" dragging />
        </div>
      </Block>
      <Block title="Data · progress, steps, metrics, cells">
        <div className="grid w-full max-w-60 gap-3">{(["default", "accent", "success", "danger"] as const).map((t) => <AdminProgress key={t} tone={t} value={60} label={t} />)}</div>
        <div className="flex items-center gap-2">{(["done", "current", "upcoming", "success", "warning", "error"] as const).map((s, i) => <StepIndicator key={s} step={i + 1} state={s} />)}</div>
        <div className="w-full"><StatPanel stats={[{ label: "Active students", value: "1,284", delta: "+6.2% vs last 30 days", tone: "success" }, { label: "Revenue", value: "€37,180", delta: "−4 vs last 30 days", tone: "danger" }, { label: "New", value: 40, delta: "neutral" }]} /></div>
        <Metric label="Single" value="84%" delta="+3 pp" tone="success" />
        <div className="grid w-full max-w-72 gap-3"><CellPerson initials="AM" name="Alex Moreau" subtitle="alex@mail.com" /><CellStack title="Core" subtitle="October cohort" /><CellProgress label="Progress" value={62} /><CellDot tone="danger" label="Payment failed" /><CellDot tone="warning" label="Inactive for 9 days" /></div>
      </Block>
      <Block title="Cards · media card, lesson card, empty state, panel">
        <div className="w-full max-w-xs"><MediaCard cover={<div className="aspect-[2.3] w-full" />} title="Foundations" subtitle="Market structure, execution and risk" meta={<><span className="text-a-text-2">All tiers</span></>} stats={[["11", "Lessons"], ["142", "Students"], ["59%", "Completed"]]} /></div>
        <div className="w-full max-w-60"><LessonCard picture={<div className="aspect-[1.78] w-full bg-a-raised" />} time="12:40" title="How price moves" mark="Free preview" markClassName="text-a-text-3" /></div>
        <div className="w-full max-w-xl"><EmptyState icon={Download} title="Nothing here yet" description="Describe what will appear." actions={<AdminButton>Create</AdminButton>} /></div>
        <Panel className="w-full max-w-72"><p className="t-body-m text-a-text-2">Panel content</p></Panel>
      </Block>
      <Block title="Overlays · menu, modal, drawer">
        <DropdownMenu>
          <DropdownMenuTrigger render={<AdminButton hierarchy="secondary" iconOnly aria-label="Open menu" />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="start"><DropdownMenuItem>Edit</DropdownMenuItem><DropdownMenuItem>Duplicate</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive">Delete</DropdownMenuItem></DropdownMenuContent>
        </DropdownMenu>
        <AdminButton hierarchy="secondary" onClick={() => setModal(true)}>Open modal</AdminButton>
        <AdminButton hierarchy="secondary" onClick={() => setDrawer(true)}>Open drawer</AdminButton>
      </Block>
      <AdminToolbar><AdminTabs label="Toolbar" value={tab} onChange={setTab} tabs={[{ id: "all", label: "All", count: 5 }, { id: "att", label: "Draft", count: 1 }]} /><div className="flex-1" /><AdminSearch value={q} onChange={setQ} placeholder="Search" /></AdminToolbar>
      <AdminModal open={modal} onOpenChange={setModal} title="Modal title" subtitle="Subtitle" footer={<><span className="flex-1" /><AdminButton hierarchy="secondary" onClick={() => setModal(false)}>Cancel</AdminButton><AdminButton onClick={() => setModal(false)}>Save</AdminButton></>}><p className="t-body-m text-a-text-2">Content goes in the body.</p></AdminModal>
      <AdminDrawer open={drawer} onOpenChange={setDrawer} title="Drawer title" subtitle="Subtitle" footer={<AdminButton hierarchy="ghost" onClick={() => setDrawer(false)}>Close</AdminButton>}><p className="t-body-m text-a-text-2">Content goes in the body.</p></AdminDrawer>
    </div>
  )
}
