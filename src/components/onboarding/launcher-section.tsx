"use client"

import Link from "next/link"
import { ArrowRight, ArrowUpRight, RotateCcw, Trash2 } from "@/components/icons"
import { deleteCommunity, setAccount } from "@/lib/data/communities"
import { useAccount, useCustomCommunities } from "@/lib/data/use-communities"

const mono = "font-[family-name:var(--ff-plex-mono)] text-[0.7rem] uppercase tracking-[0.06em]"

/** Start page: the coach sign-up entry, and communities made with the wizard in this browser. */
export function LauncherOnboarding() {
  const communities = useCustomCommunities()
  const acc = useAccount()
  const inProgress = communities.find((c) => c.status === "setup" && c.slug === acc?.setupSlug)

  return (
    <section className="grid gap-px border border-white/10 bg-white/10 md:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-5 bg-[#262626] p-6">
        <span className={`${mono} text-white/60`}>New · Coach onboarding · ONB-01 to ONB-16</span>
        <h2 className="max-w-[22ch] text-3xl leading-[1.08] font-normal tracking-tight">Sign up as a coach and build a platform from zero.</h2>
        <p className="max-w-[56ch] text-sm text-white/55">
          Sign-up, e-mail code, three questions that pick the route (setup call or wizard), then seven steps with a live preview, publish and
          invite. The result is a real community you can open on both sides.
        </p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Link
            href="/signup"
            onClick={() => setAccount(null)}
            className={`${mono} inline-flex items-center gap-2 rounded-[2px] bg-white px-3.5 py-2.5 text-[#161616] hover:bg-[#e0e0e0]`}
          >
            Start as a new coach <ArrowRight className="size-3.5" />
          </Link>
          {inProgress && (
            <Link href="/setup" className={`${mono} inline-flex items-center gap-2 rounded-[2px] border border-white/20 px-3.5 py-2.5 hover:bg-white/5`}>
              Resume setup <RotateCcw className="size-3.5" />
            </Link>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-3 bg-[#262626] p-6">
        <span className={`${mono} text-white/50`}>Made in this browser</span>
        {communities.length === 0 && <p className="text-sm text-white/40">Nothing yet. Communities you create with the wizard appear here.</p>}
        <ul className="grid gap-px">
          {communities.map((c) => (
            <li key={c.slug} className="flex items-center gap-3 border-t border-white/10 py-2.5 first:border-0">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{c.name}</span>
                <span className={`${mono} text-[0.6rem] text-white/40`}>
                  {c.status === "live" ? `${c.slug}.tradestats.app` : "Setting up"}
                </span>
              </span>
              <Link href={`/c/${c.slug}`} className={`${mono} text-white/70 hover:text-white`}>
                Student
              </Link>
              <Link href={`/admin/${c.slug}`} className={`${mono} inline-flex items-center gap-1 text-white/70 hover:text-white`}>
                Admin <ArrowUpRight className="size-3" />
              </Link>
              <button onClick={() => deleteCommunity(c.slug)} aria-label={`Delete ${c.name}`} className="text-white/30 hover:text-white">
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
