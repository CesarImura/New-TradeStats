"use client"

import { setStored, useStored } from "@/lib/prototype-store"

/**
 * Student onboarding (STO-01 to STO-04) and Home's "Start here" card and
 * first-week checklist (STU-01). The coach sets it up in Settings → Student
 * onboarding (ADM-49).
 */

export type FirstWeekItem = "lesson" | "live" | "intro" | "trade" | "picture" | "discord" | "call"

export const FIRST_WEEK: Record<FirstWeekItem, { label: string; text: string; module?: "courses" | "calendar" | "community" | "journal" }> = {
  lesson: { label: "Watch your first lesson", text: "Ten minutes, and you know how everything works", module: "courses" },
  live: { label: "Join a live session", text: "Watch the coach trade, ask questions", module: "calendar" },
  intro: { label: "Introduce yourself", text: "Say hi in the community: markets, goal, time zone", module: "community" },
  trade: { label: "Log your first trade", text: "Connect your broker or enter one by hand", module: "journal" },
  picture: { label: "Add a profile picture", text: "So the group knows who they talk to" },
  discord: { label: "Link Discord", text: "Your role and channels follow your plan", module: "community" },
  call: { label: "Book your welcome call", text: "15 minutes to set your goals", module: "calendar" },
}

export type OnboardingSettings = {
  video: boolean
  message: string
  questions: { nickname: boolean; experience: boolean; markets: boolean; goal: boolean; broker: boolean }
  discord: boolean
  tour: boolean
  login: "code" | "password" | "both"
  startHere: boolean
  firstWeek: FirstWeekItem[]
}

export const ONBOARDING_DEFAULTS: OnboardingSettings = {
  video: true,
  message: "Welcome! Start with the first lesson of Foundations, then book your first live session.",
  questions: { nickname: true, experience: true, markets: true, goal: true, broker: false },
  discord: true,
  tour: true,
  login: "code",
  startHere: true,
  firstWeek: ["lesson", "live", "intro", "trade", "picture"],
}

export function useOnboardingSettings(slug: string): OnboardingSettings {
  // Saved before the Start here settings existed? Fill in what's missing.
  return { ...ONBOARDING_DEFAULTS, ...useStored(`${slug}:student-onboarding`, ONBOARDING_DEFAULTS) }
}

/** Where the demo student is. The sample student finished onboarding long ago. */
export type StudentStart = {
  stage: "new" | "done"
  tour: boolean
  done: FirstWeekItem[]
  dismissed: boolean
  profile: { nickname: string; experience: string; markets: string[]; goal: string }
}

export const START_DONE: StudentStart = { stage: "done", tour: false, done: [], dismissed: true, profile: { nickname: "alexm", experience: "", markets: [], goal: "" } }

export function useStudentStart(slug: string) {
  return useStored(`${slug}:student-start`, START_DONE)
}

export function saveStudentStart(slug: string, update: (s: StudentStart) => StudentStart) {
  setStored(`${slug}:student-start`, update, START_DONE)
}

/** Prototype: start over as a brand-new student. */
export function resetAsNewStudent(slug: string) {
  setStored<StudentStart>(`${slug}:student-start`, { stage: "new", tour: false, done: [], dismissed: false, profile: { nickname: "", experience: "", markets: [], goal: "" } })
}
