"use client"

import { useSyncExternalStore } from "react"
import type { Upload } from "./course-parts"

/**
 * Where the prototype keeps the videos going up, per course, so the course page, its upload tray and the Content board show the
 * same thing and an upload keeps going while the coach moves to another screen. In memory only: a reload starts clean.
 */
const NONE: Upload[] = []
let all: ReadonlyMap<string, Upload[]> = new Map()
const listeners = new Set<() => void>()

const subscribe = (cb: () => void) => (listeners.add(cb), () => void listeners.delete(cb))

/** Changes one course's uploads; `fn` gets the current list. */
export function updateUploads(courseId: string, fn: (current: Upload[]) => Upload[]) {
  const next = new Map(all)
  next.set(courseId, fn(all.get(courseId) ?? NONE))
  all = next
  listeners.forEach((l) => l())
}

/** The uploads of one course (a steady empty list when there are none). */
export const useCourseUploads = (courseId: string) => useSyncExternalStore(subscribe, () => all.get(courseId) ?? NONE, () => NONE)

/** Every course's uploads, for the Content board. */
export const useAllUploads = () => useSyncExternalStore(subscribe, () => all, () => all)
