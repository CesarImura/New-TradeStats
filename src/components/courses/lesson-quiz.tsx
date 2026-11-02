"use client"

import { useMemo, useState } from "react"
import { Check, CircleHelp, X } from "@/components/icons"
import { toast } from "sonner"
import { useCoach } from "@/components/coach/coach-provider"
import { Button } from "@/components/ui/button"
import { updateProgress, useProgress, type Lesson, type Quiz } from "@/lib/data/learning"
import { cn } from "@/lib/utils"

// ---------- quiz

/** STU-05: questions at the end of the lesson; passing can unlock the next one. */
export function QuizCard({ lesson, quiz, nextTitle }: { lesson: Lesson; quiz: Quiz; nextTitle?: string }) {
  const { coach } = useCoach()
  const progress = useProgress(coach.slug)
  const best = progress.quiz[lesson.id]
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(best === undefined)
  const score = useMemo(() => quiz.questions.filter((q) => answers[q.id] === q.answer).length, [answers, quiz.questions])
  const passed = (best ?? -1) >= quiz.passMark

  const check = () => {
    setChecked(true)
    updateProgress(coach.slug, (p) => ({ ...p, quiz: { ...p.quiz, [lesson.id]: Math.max(p.quiz[lesson.id] ?? 0, score) } }))
    if (score >= quiz.passMark) toast.success(nextTitle && quiz.gate ? `Passed. “${nextTitle}” is open.` : "Passed")
  }

  return (
    <div className="grid gap-4 rounded-(--radius) bg-card p-5 text-card-foreground" style={{ boxShadow: "var(--card-shadow)" }}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="r-chip grid size-9 place-items-center bg-primary/10 text-primary">
          <CircleHelp className="size-4" />
        </span>
        <div className="grid flex-1">
          <span className="font-heading text-lg leading-tight">Quick check</span>
          <span className="text-sm text-muted-foreground">
            {quiz.questions.length} questions · pass with {quiz.passMark} right{quiz.gate && nextTitle ? ` to open “${nextTitle}”` : ""}
          </span>
        </div>
        {passed ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Check className="size-4" /> Passed · {best}/{quiz.questions.length}
          </span>
        ) : best !== undefined ? (
          <span className="text-sm text-muted-foreground">Best so far: {best}/{quiz.questions.length}</span>
        ) : null}
        {!open && (
          <Button variant="outline" size="sm" onClick={() => (setOpen(true), setChecked(false), setAnswers({}))}>
            {passed ? "Take it again" : "Try again"}
          </Button>
        )}
      </div>

      {open && (
        <>
          <ol className="grid gap-5">
            {quiz.questions.map((q, qi) => (
              <li key={q.id} className="grid gap-2">
                <span className="text-sm font-medium">
                  {qi + 1}. {q.q}
                </span>
                <div className="grid gap-1.5">
                  {q.options.map((o, oi) => {
                    const picked = answers[q.id] === oi
                    const right = checked && oi === q.answer
                    const wrong = checked && picked && oi !== q.answer
                    return (
                      <button
                        key={o}
                        disabled={checked}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                        className={cn(
                          "flex items-center gap-3 rounded-[var(--r-inner)] border px-3 py-2 text-left text-sm transition-colors",
                          picked && !checked && "border-primary bg-primary/5",
                          right && "border-profit bg-profit/10",
                          wrong && "border-loss bg-loss/10",
                          !checked && "hover:bg-muted",
                        )}
                      >
                        <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", picked && "border-primary bg-primary text-primary-foreground")}>
                          {picked && <span className="size-1.5 rounded-full bg-current" />}
                        </span>
                        <span className="flex-1">{o}</span>
                        {right && <Check className="size-4 text-profit" />}
                        {wrong && <X className="size-4 text-loss" />}
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ol>
          {checked ? (
            <div className={cn("flex flex-wrap items-center gap-3 rounded-[var(--r-inner)] px-4 py-3 text-sm", score >= quiz.passMark ? "bg-profit/10" : "bg-loss/10")}>
              <span className="flex-1">
                {score >= quiz.passMark
                  ? `${score} of ${quiz.questions.length}. Well done.`
                  : `${score} of ${quiz.questions.length}. You need ${quiz.passMark}. Have another look at the chapters, then try again.`}
              </span>
              <Button size="sm" variant="outline" onClick={() => (setChecked(false), setAnswers({}))}>
                Try again
              </Button>
              {score >= quiz.passMark && (
                <Button size="sm" onClick={() => setOpen(false)}>
                  Close
                </Button>
              )}
            </div>
          ) : (
            <Button className="w-fit" onClick={check} disabled={Object.keys(answers).length < quiz.questions.length}>
              Check answers
            </Button>
          )}
        </>
      )}
    </div>
  )
}

