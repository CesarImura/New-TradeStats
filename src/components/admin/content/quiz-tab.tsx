"use client"

import { useState } from "react"
import { Plus, Sparkles, Trash2, Wand2 } from "@/components/icons"
import { Switch } from "@/components/ui/switch"
import { uid, type Lesson, type Quiz } from "@/lib/data/learning"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AdminButton, AdminSegmented, EmptyState, Panel, SortHint, SortableRow, Tag, useMoveFeedback } from "../ui"
import { dropLine } from "@/components/kit/drop-line"

const PASS = [70, 80, 90]

export function QuizTab({ lesson, onChange }: { lesson: Lesson; onChange: (p: Partial<Lesson>) => void }) {
  const quiz = lesson.quiz
  const [open, setOpen] = useState<string | null>(quiz?.questions[0]?.id ?? null)
  const [dragQ, setDragQ] = useState<number | null>(null)
  const [overQ, setOverQ] = useState<number | null>(null)
  const { flashed, moved, Live } = useMoveFeedback()
  const set = (patch: Partial<Quiz>) => onChange({ quiz: { ...(quiz as Quiz), ...patch, ai: false } })
  const draft = () => {
    const questions = [
      { id: uid("q"), q: `What is the main idea of “${lesson.title}”?`, options: ["The idea from the lesson", "Something it warns against", "Not covered"], answer: 0 },
      { id: uid("q"), q: "When should you apply it?", options: ["Every trade", "When the setup on the chart matches", "Never on news days"], answer: 1 },
      { id: uid("q"), q: "What's the most common mistake?", options: ["Doing it too late", "Skipping the checklist", "Both"], answer: 2 },
    ]
    onChange({ quiz: { passMark: 2, gate: false, ai: true, questions } })
    setOpen(questions[0].id)
  }
  const blank = () => {
    const q = { id: uid("q"), q: "", options: ["", ""], answer: 0 }
    onChange({ quiz: { passMark: 1, gate: false, questions: [q] } })
    setOpen(q.id)
  }

  if (!quiz) {
    return (
      <EmptyState title="No quiz on this lesson" description="A few questions at the end help students check they got it. You can make passing a condition for the next lesson." className="py-14"
        actions={<><AdminButton onClick={draft}><Sparkles /> Write with AI</AdminButton><AdminButton hierarchy="secondary" onClick={blank}>Start empty</AdminButton></>} />
    )
  }

  const n = quiz.questions.length
  /** The question at `from` takes the place of the one at `to` (a drop, or an arrow on its handle). One undo takes it back. */
  const reorder = (from: number, to: number) => {
    if (from === to || to < 0 || to >= n) return
    const before = quiz.questions
    const next = [...before]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    set({ questions: next })
    moved(m.id, `Question moved to ${to + 1} of ${n}.`)
    toast(`Question moved to ${to + 1} of ${n}.`, { id: "quiz-undo", action: { label: "Undo", onClick: () => set({ questions: before }) } })
  }
  const dropOnQ = (qi: number) => {
    if (dragQ !== null) reorder(dragQ, qi)
    setDragQ(null)
    setOverQ(null)
  }
  const overProps = (qi: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragQ === null) return
      e.preventDefault()
      setOverQ(qi)
    },
    onDrop: () => dropOnQ(qi),
  })
  const need = (p: number) => Math.max(1, Math.min(n, Math.ceil((p / 100) * n)))
  // The pass mark is kept as a count of right answers; the nearest percentage is the one shown as chosen.
  const chosen = PASS.reduce((best, p) => (Math.abs(p - (quiz.passMark / n) * 100) < Math.abs(best - (quiz.passMark / n) * 100) ? p : best), PASS[0])
  const updateQ = (id: string, patch: Partial<Quiz["questions"][number]>) => set({ questions: quiz.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) })
  const addQuestion = () => {
    const q = { id: uid("q"), q: "", options: ["", ""], answer: 0 }
    set({ questions: [...quiz.questions, q] })
    setOpen(q.id)
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <AdminButton hierarchy="secondary" onClick={addQuestion}>
            <Plus /> Add question
          </AdminButton>
          <span className="flex items-center gap-2"><span className="t-caption text-a-text-3">{n} {n === 1 ? "question" : "questions"}</span><AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Remove quiz" className="text-a-danger" onClick={() => onChange({ quiz: undefined })}><Trash2 /></AdminButton></span>
        </div>
        {quiz.ai && <div className="flex items-center gap-2 rounded-a-md bg-a-accent-soft px-3 py-2 t-body-m text-a-text-accent"><Sparkles className="size-4" /> Drafted by AI from the transcript. Check the answers before you publish.</div>}
        <SortHint id="quiz-sort-hint" />
        <Live />
        <div className="grid gap-2">
        {quiz.questions.map((q, qi) =>
          open === q.id ? (
            <div key={q.id} {...overProps(qi)} className={cn("group/q grid gap-2.5 rounded-a-10 border border-a-border-strong px-4 py-3.5", overQ === qi && dragQ !== null && dragQ !== qi && dropLine(dragQ < qi ? "after" : "before"))}>
              <div className="flex items-center gap-2.5">
                <span className="t-caption text-a-text tabular-nums">{qi + 1}</span>
                <input value={q.q} placeholder="Question" aria-label="Question" onChange={(e) => updateQ(q.id, { q: e.target.value })} className="min-w-0 flex-1 bg-transparent t-body-l text-a-text outline-none placeholder:text-a-text-3" />
                <span className="relative flex h-5 shrink-0 items-center">
                  <span className="t-caption text-a-text-3 transition-opacity duration-200 group-focus-within/q:opacity-0 group-hover/q:opacity-0">{q.options.length} answers</span>
                  <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Delete question" className="absolute top-1/2 right-0 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-focus-within/q:opacity-100 group-hover/q:opacity-100 focus-visible:opacity-100" onClick={() => (set({ questions: quiz.questions.filter((x) => x.id !== q.id), passMark: Math.min(quiz.passMark, Math.max(1, n - 1)) }), setOpen(null))}>
                    <Trash2 />
                  </AdminButton>
                </span>
              </div>
              {q.options.map((o, oi) => (
                <div key={oi} className="group/a flex items-center gap-2.5">
                  <button type="button" role="radio" aria-checked={q.answer === oi} aria-label={q.answer === oi ? "Correct answer" : "Mark as correct"} onClick={() => updateQ(q.id, { answer: oi })} className={cn("grid size-4 shrink-0 place-items-center rounded-full border-[1.5px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-a-border-focus", q.answer === oi ? "border-a-accent-strong" : "border-a-border-strong")}>
                    {q.answer === oi && <span className="size-2 rounded-full bg-a-accent-strong" />}
                  </button>
                  <div className="relative min-w-0 flex-1">
                    <input value={o} placeholder={`Answer ${oi + 1}`} onChange={(e) => updateQ(q.id, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} className="h-8 w-full rounded-a-md border border-a-border bg-a-field px-3 t-body-m text-a-text outline-none placeholder:text-a-text-3 focus-visible:border-a-border-focus" />
                    {q.options.length > 2 && q.answer !== oi && (
                      <AdminButton hierarchy="ghost" size="sm" iconOnly aria-label="Remove answer" className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-focus-within/a:opacity-100 group-hover/a:opacity-100 focus-visible:opacity-100" onClick={() => updateQ(q.id, { options: q.options.filter((_, j) => j !== oi), answer: q.answer > oi ? q.answer - 1 : q.answer === oi ? 0 : q.answer })}>
                        <Trash2 />
                      </AdminButton>
                    )}
                  </div>
                  {q.answer === oi && <Tag tone="success" dot>Correct</Tag>}
                </div>
              ))}
              {q.options.length < 5 && (
                <AdminButton hierarchy="ghost" size="md" className="w-fit" onClick={() => updateQ(q.id, { options: [...q.options, ""] })}>
                  <Plus className="size-3.5" /> Add answer
                </AdminButton>
              )}
            </div>
          ) : (
            <div key={q.id} {...overProps(qi)} className={cn("rounded-a-10", overQ === qi && dragQ !== null && dragQ !== qi && dropLine(dragQ < qi ? "after" : "before"))}>
              <SortableRow
                dragging={dragQ === qi}
                active={flashed(q.id)}
                onClick={() => setOpen(q.id)}
                handle={{
                  label: `Reorder question ${qi + 1}`,
                  hintId: "quiz-sort-hint",
                  onMove: (by) => reorder(qi, qi + by),
                  draggable: true,
                  onDragStart: (e) => {
                    setDragQ(qi)
                    e.dataTransfer.effectAllowed = "move"
                    const row = e.currentTarget.closest("[data-slot=sortable-row]") ?? e.currentTarget
                    e.dataTransfer.setDragImage(row, 24, 26)
                  },
                  onDragEnd: () => (setDragQ(null), setOverQ(null)),
                }}
                title={
                  <button type="button" onClick={() => setOpen(q.id)} className="max-w-full truncate text-left outline-none focus-visible:underline">
                    {qi + 1} · {q.q || "Untitled question"}
                  </button>
                }
                trailing={<span className="t-caption text-a-text-3">{q.options.length} answers</span>}
                className="h-[52px] cursor-pointer border-a-border hover:border-a-border-strong hover:bg-a-hover"
              />
            </div>
          ),
        )}
        </div>
      </div>

      <Panel className="gap-3.5">
        <h2 className="t-heading-s text-a-text">Quiz rules</h2>
        <div className="grid gap-1.5">
          <span className="t-caption text-a-text">Pass mark</span>
          <AdminSegmented label="Pass mark" value={String(chosen)} onChange={(v) => set({ passMark: need(Number(v)) })} options={PASS.map((p) => ({ value: String(p), label: `${p}%` }))} />
        </div>
        <label className="flex items-center justify-between gap-4">
          <span className="grid max-w-[206px] gap-0.5">
            <span className="t-body-m text-a-text">Must pass to open the next lesson</span>
            <span className="t-caption text-a-text-2">Students see the next lesson locked</span>
          </span>
          <Switch checked={quiz.gate} onCheckedChange={(v) => set({ gate: v })} />
        </label>
        <span className="h-px bg-a-selected" aria-hidden />
        <AdminButton hierarchy="secondary" className="w-fit" onClick={draft}>
          <Wand2 /> Write with AI
        </AdminButton>
        <p className="t-caption text-a-text-2">Questions come from the transcript. You review them before they go in.</p>
      </Panel>
    </div>
  )
}
