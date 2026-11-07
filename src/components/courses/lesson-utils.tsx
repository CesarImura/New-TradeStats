"use client"

import Link from "next/link"

export const link = (p: string) => ({ nativeButton: false as const, render: <Link href={p} /> })

/** Seconds into the video that a transcript line ("2:35 …") starts at. */
export const toSec = (line: string) => {
  const m = line.match(/^(\d+):(\d+)/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : 0
}


/** Asks the player to jump to a time (it listens for this event). */
export const seek = (at: number) => window.dispatchEvent(new CustomEvent("lesson-seek", { detail: at }))
