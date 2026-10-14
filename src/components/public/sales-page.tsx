"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, Check, MessagesSquare, NotebookPen, PlayCircle, Quote, Sparkles, Star, Users } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { CourseCover, hours } from "@/components/courses/shared"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Cover } from "@/components/widgets/shared"
import { amount, courseTiers, fmtDate, isFull, per, useGroups, useTiers, type TierInfo } from "@/lib/data/access"
import { allLessons, studentCourses, useCatalog } from "@/lib/data/learning"
import { useSalesPage, type Block } from "@/lib/data/sales-page"
import { cn } from "@/lib/utils"

const wrap = "mx-auto w-full max-w-[1180px] px-4 sm:px-6"

/** PUB-01: the coach's sales page, from the blocks set in Sales & payments → Sales page. */
export function SalesPage() {
  const { coach } = useCoach()
  const blocks = useSalesPage(coach).filter((b) => b.on)
  // The editor beside the preview asks to show the block being edited. Scrolls only this page, never the editor around it.
  useEffect(() => {
    const show = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "sales-page:show") return
      const el = document.getElementById(e.data.id)
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: "smooth" })
    }
    window.addEventListener("message", show)
    return () => window.removeEventListener("message", show)
  }, [])
  return (
    <div className="flex flex-col">
      {blocks.map((b, i) => (
        <section key={b.id} id={b.id} className={cn("scroll-mt-20 py-14 sm:py-20", i > 0 && b.type !== "cta" && "border-t")}>
          <BlockView block={b} />
        </section>
      ))}
      {blocks.length === 0 && <p className="py-24 text-center text-muted-foreground">This page has no blocks switched on yet.</p>}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "hero":
      return <Hero block={block} />
    case "about":
      return <About block={block} />
    case "results":
      return <Results block={block} />
    case "curriculum":
      return <Curriculum block={block} />
    case "week":
      return <Week block={block} />
    case "tiers":
      return <Prices block={block} />
    case "groups":
      return <Groups block={block} />
    case "faq":
      return <Faq block={block} />
    case "cta":
      return <Closing block={block} />
  }
}

function Heading({ block, center }: { block: Block; center?: boolean }) {
  return (
    <div className={cn("mb-8 grid max-w-2xl gap-2", center && "mx-auto text-center")}>
      <h2 className="text-3xl leading-tight sm:text-4xl">{block.title}</h2>
      {block.text && <p className="text-muted-foreground">{block.text}</p>}
    </div>
  )
}

function Hero({ block }: { block: Block }) {
  const { coach } = useCoach()
  const tiers = useTiers(coach)
  const catalog = useCatalog(coach)
  const members = tiers.reduce((n, t) => n + t.members, 0)
  const lessons = studentCourses(catalog).reduce((n, c) => n + allLessons(c).filter((l) => l.status === "published").length, 0)
  return (
    <div className={cn(wrap, "grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]")}>
      <div className="grid gap-5">
        <span className="eyebrow">{coach.name}</span>
        <h1 className="text-4xl leading-[1.05] sm:text-6xl">{block.title}</h1>
        <p className="max-w-xl text-lg text-muted-foreground">{block.text}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="lg" nativeButton={false} render={<a href="#tiers" />}>
            See the plans <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" onClick={() => toast("The coach's intro video plays here.")}>
            <PlayCircle /> Watch the intro
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
          <span>
            <b className="font-heading text-lg text-foreground tabular-nums">{members.toLocaleString("en")}</b> {coach.wording.students.toLowerCase()}
          </span>
          {lessons > 0 && (
            <span>
              <b className="font-heading text-lg text-foreground tabular-nums">{lessons}</b> {coach.wording.lesson.toLowerCase()}s
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="size-4 fill-primary text-primary" />
            <b className="font-heading text-lg text-foreground">4.9</b> from 310 reviews
          </span>
        </div>
      </div>
      <div className="relative">
        <Cover className="aspect-[4/3] w-full rounded-(--radius)" />
        <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-(--radius) bg-card px-4 py-3 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
          </span>
          <span className="text-sm">
            Next live session <b>tomorrow 08:30</b>
          </span>
        </div>
      </div>
    </div>
  )
}

function About({ block }: { block: Block }) {
  const { coach } = useCoach()
  return (
    <div className={cn(wrap, "grid items-center gap-8 md:grid-cols-[auto_1fr]")}>
      <span className="grid size-32 place-items-center rounded-full bg-primary font-heading text-4xl text-primary-foreground sm:size-40">{coach.mark}</span>
      <div className="grid max-w-2xl gap-3">
        <h2 className="text-3xl leading-tight sm:text-4xl">{block.title}</h2>
        <p className="text-lg text-muted-foreground">{block.text}</p>
      </div>
    </div>
  )
}

function Results({ block }: { block: Block }) {
  return (
    <div className={wrap}>
      <Heading block={block} />
      <div className="grid gap-4 md:grid-cols-3">
        {(block.items ?? []).map((q, i) => (
          <figure key={i} className="grid content-between gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
            <Quote className="size-5 text-primary" />
            <blockquote className="text-[0.95rem] leading-relaxed">{q.a}</blockquote>
            <figcaption className="text-sm text-muted-foreground">{q.who}</figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Individual results. Trading carries risk; past results don&apos;t guarantee future ones.</p>
    </div>
  )
}

function Curriculum({ block }: { block: Block }) {
  const { coach } = useCoach()
  const catalog = useCatalog(coach)
  const tiers = useTiers(coach)
  const all = tiers.map((t) => t.id)
  const courses = studentCourses(catalog)
  return (
    <div className={wrap}>
      <Heading block={block} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => {
          const lessons = allLessons(c).filter((l) => l.status !== "draft" && l.status !== "archived")
          const minutes = lessons.reduce((n, l) => n + l.minutes, 0)
          const first = tiers.find((t) => courseTiers(c, all).includes(t.id))
          return (
            <article key={c.id} className="flex flex-col overflow-hidden rounded-(--radius) bg-card text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
              <CourseCover course={c} className="aspect-[16/7]" />
              <div className="grid gap-1.5 p-4">
                <span className="eyebrow">{c.area}</span>
                <h3 className="text-lg leading-tight">{c.title}</h3>
                <p className="line-clamp-2 text-sm text-muted-foreground">{c.tagline}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {lessons.length} {coach.wording.lesson.toLowerCase()}s · {hours(minutes)}
                  </span>
                  {c.tiers.length > 0 && first && <Badge variant="secondary">From {first.name}</Badge>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Week({ block }: { block: Block }) {
  const { coach } = useCoach()
  const items = [
    coach.modules.calendar && { icon: CalendarDays, title: "Live sessions", text: "Trade the open together every morning, plus a weekly Q&A." },
    coach.modules.courses && { icon: PlayCircle, title: `Short ${coach.wording.lesson.toLowerCase()}s`, text: "Ten to twenty minutes each, watch when it suits you." },
    coach.modules.journal && { icon: NotebookPen, title: "Trade reviews", text: "Log a trade, ask for a review, get feedback on your own chart." },
    coach.modules.community && { icon: MessagesSquare, title: coach.wording.community, text: "A group that answers within minutes, with its own channels." },
    coach.modules.ai && { icon: Sparkles, title: coach.wording.ai, text: "Questions answered from the course, any time of day." },
  ].filter(Boolean) as { icon: typeof CalendarDays; title: string; text: string }[]
  return (
    <div className={wrap}>
      <Heading block={block} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.title} className="grid content-start gap-2 rounded-(--radius) border p-5">
            <it.icon className="size-5 text-primary" />
            <h3 className="text-lg">{it.title}</h3>
            <p className="text-sm text-muted-foreground">{it.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Prices({ block }: { block: Block }) {
  const { coach, base } = useCoach()
  const tiers = useTiers(coach).filter((t) => !t.hidden)
  const anyYearly = tiers.some((t) => t.yearly)
  const [yearly, setYearly] = useState(false)
  return (
    <div className={wrap}>
      <Heading block={block} center />
      {anyYearly && (
        <div className="mx-auto mb-8 flex w-fit rounded-full border p-1 text-sm">
          {[false, true].map((y) => (
            <button key={String(y)} onClick={() => setYearly(y)} className={cn("rounded-full px-4 py-1.5", yearly === y ? "bg-foreground text-background" : "text-muted-foreground")}>
              {y ? "Yearly · 2 months free" : "Monthly"}
            </button>
          ))}
        </div>
      )}
      <div className={cn("mx-auto grid gap-4", tiers.length >= 3 ? "lg:grid-cols-3" : tiers.length === 2 ? "max-w-3xl md:grid-cols-2" : "max-w-md")}>
        {tiers.map((t) => (
          <PriceCard key={t.id} tier={t} yearly={yearly && !!t.yearly} href={`${base}/${amount(t.price) === 0 ? "join" : "checkout"}?tier=${t.id}${yearly && t.yearly ? "&cycle=yearly" : ""}`} />
        ))}
      </div>
    </div>
  )
}

function PriceCard({ tier, yearly, href }: { tier: TierInfo; yearly: boolean; href: string }) {
  const free = amount(tier.price) === 0
  return (
    <article
      className={cn("relative flex flex-col gap-5 rounded-(--radius) bg-card p-6 text-card-foreground", tier.featured && "outline-2 outline-primary")}
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      {tier.featured && <Badge className="absolute -top-2.5 left-6">Most popular</Badge>}
      <div className="grid gap-1">
        <h3 className="text-xl">{tier.name}</h3>
        {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-heading text-4xl tabular-nums">{free ? "Free" : yearly ? tier.yearly : tier.price}</span>
        {!free && <span className="text-sm text-muted-foreground">{yearly ? "/ year" : per(tier.cadence)}</span>}
      </div>
      <ul className="grid gap-2 text-sm">
        {tier.features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
          </li>
        ))}
      </ul>
      <Button size="lg" variant={tier.featured ? "default" : "outline"} className="mt-auto" nativeButton={false} render={<Link href={href} />}>
        {free ? "Join free" : tier.trial ? `Start ${tier.trial}-day free trial` : `Join ${tier.name}`}
      </Button>
      {tier.installments && tier.cadence === "once" && <p className="-mt-2 text-center text-xs text-muted-foreground">or 3 monthly payments</p>}
    </article>
  )
}

function Groups({ block }: { block: Block }) {
  const { coach, base } = useCoach()
  const tiers = useTiers(coach)
  const groups = useGroups(coach).filter((g) => g.end >= "2026-10-12")
  if (groups.length === 0) return null
  return (
    <div className={wrap}>
      <Heading block={block} />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => {
          const full = isFull(g)
          const started = g.start <= "2026-10-12"
          const tier = tiers.find((t) => g.tiers.includes(t.id) && !t.hidden) ?? tiers.find((t) => g.tiers.includes(t.id))
          return (
            <article key={g.id} className="grid gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-0.5">
                  <h3 className="text-lg">{g.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {fmtDate(g.start, false)} – {fmtDate(g.end)}
                  </span>
                </div>
                <Badge variant={full ? "secondary" : "outline"}>{full ? "Full" : started ? "Running" : "Starts soon"}</Badge>
              </div>
              <div className="grid gap-1.5">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (g.members / Math.max(1, g.seats)) * 100)}%` }} />
                </div>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3.5" /> {full ? `${g.seats} of ${g.seats} seats taken` : `${g.seats - g.members} of ${g.seats} seats left`}
                </span>
              </div>
              {full ? (
                g.waitlist ? (
                  <Button variant="outline" nativeButton={false} render={<Link href={`${base}/waitlist?group=${g.id}`} />}>
                    Join the waiting list
                  </Button>
                ) : (
                  <Button variant="outline" disabled>
                    Sign-ups closed
                  </Button>
                )
              ) : (
                <Button nativeButton={false} render={<Link href={`${base}/checkout?tier=${tier?.id ?? ""}&group=${g.id}`} />}>
                  Join this group
                </Button>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function Faq({ block }: { block: Block }) {
  return (
    <div className={cn(wrap, "max-w-3xl")}>
      <Heading block={block} />
      <Accordion className="rounded-(--radius) border bg-card px-4 text-card-foreground">
        {(block.items ?? []).map((it, i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="text-base">{it.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

function Closing({ block }: { block: Block }) {
  return (
    <div className={wrap}>
      <div className="grid justify-items-center gap-4 rounded-(--radius) bg-primary px-6 py-14 text-center text-primary-foreground">
        <h2 className="max-w-2xl text-3xl leading-tight sm:text-4xl">{block.title}</h2>
        <p className="max-w-xl opacity-85">{block.text}</p>
        <Button size="lg" variant="secondary" nativeButton={false} render={<a href="#tiers" />}>
          See the plans <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
