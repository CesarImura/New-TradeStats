"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";
import { ACCENT, ACCENT_TEXT, TYPE, W } from "./kit";
import { GREY, Label, Num, TRACK, ink, useFigureFont } from "./instrument";

/**
 * Shared layout types, so widgets differ in SHAPE, not just in their chart:
 * - Hero: one figure owns the card, a sentence says what it means, a visual
 *   bleeds off the bottom edge. Big through space, not type: the figure stays
 *   28px (40px only on the page's Star), per the type rules in kit.tsx.
 * - Split: a picture or poster panel beside the details; stacks when narrow.
 * - Rail: a vertical timeline with a "now" marker; past above, ahead below.
 */

/** Card padding, the same as W's, for layouts that pad their own parts. */
const PAD = "px-[calc(1rem*var(--density,1))]";

// ---------- Hero

export function HeroCard({
  title,
  chip,
  label,
  value,
  unit,
  delta,
  deltaTone,
  line,
  stats,
  foot,
}: {
  title: React.ReactNode;
  chip?: React.ReactNode;
  /** Small label over the figure: "Left before the floor". */
  label?: React.ReactNode;
  value: React.ReactNode;
  unit?: string;
  delta?: React.ReactNode;
  deltaTone?: "profit" | "loss" | "accent" | "muted";
  /** One sentence that says what the figure means (Standard and up). */
  line?: React.ReactNode;
  /** Small figures in a row under the sentence (Detailed). */
  stats?: {
    label: string;
    value: React.ReactNode;
    tone?: "profit" | "loss" | "accent";
  }[];
  /** Full-bleed visual along the bottom edge. */
  foot?: React.ReactNode;
}) {
  const font = useFigureFont();
  return (
    <W className="gap-0 p-0">
      <div
        className={cn(
          "flex min-w-0 shrink-0 items-center gap-2 pt-[calc(0.875rem*var(--density,1))]",
          PAD,
        )}
      >
        <Label className="min-w-0 flex-1 truncate">{title}</Label>
        {chip && (
          <span className="hidden shrink-0 @[13rem]:inline-flex">{chip}</span>
        )}
      </div>
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col justify-end gap-1 pb-[calc(0.875rem*var(--density,1))]",
          PAD,
        )}
      >
        {label && <span className={cn(TYPE.small, "truncate")}>{label}</span>}
        <Num value={value} unit={unit} delta={delta} deltaTone={deltaTone} />
        {line && (
          <p className={cn(TYPE.body, "line-clamp-2 text-muted-foreground")}>
            {line}
          </p>
        )}
        {stats && (
          <div
            className="mt-2 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${stats.length}, minmax(0,1fr))`,
            }}
          >
            {stats.map((s) => (
              <div key={s.label} className="grid min-w-0 gap-0.5">
                <Label className="truncate">{s.label}</Label>
                <span
                  className="truncate text-[0.8125rem] leading-5 tabular-nums"
                  style={{
                    fontFamily: font,
                    color:
                      s.tone === "profit"
                        ? ink("var(--profit)")
                        : s.tone === "loss"
                          ? ink("var(--loss)")
                          : s.tone === "accent"
                            ? ink(ACCENT_TEXT)
                            : undefined,
                  }}
                >
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {foot && (
        <div className="relative h-[28%] max-h-20 min-h-9 shrink-0">{foot}</div>
      )}
    </W>
  );
}

/** An area line that runs edge to edge: faint fill, a hairline, a dot on the latest value. `floor` draws a dashed loss line. */
export function BleedArea({
  values,
  floor,
  invert,
}: {
  values: number[];
  floor?: number;
  invert?: boolean;
}) {
  const id = useId();
  const pts = invert ? values.map((v) => -v) : values;
  const fl = floor === undefined ? undefined : invert ? -floor : floor;
  const hi = Math.max(...pts);
  const lo = Math.min(...pts, fl ?? Infinity);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (pts.length - 1)) * 100;
  const y = (v: number) => 6 + ((hi - v) / span) * 44;
  const line = pts
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
    .join(" ");
  const last = pts.length - 1;
  return (
    <>
      <svg
        viewBox="0 0 100 52"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        <defs>
          <clipPath id={`c${id}`}>
            <rect width="100" height="52" />
          </clipPath>
        </defs>
        <g clipPath={`url(#c${id})`}>
          <path d={`${line} L100 52 L0 52 Z`} fill={ACCENT} opacity={0.09} />
          {fl !== undefined && (
            <line
              x1={0}
              x2={100}
              y1={y(fl)}
              y2={y(fl)}
              stroke="var(--loss)"
              strokeWidth={1}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
            />
          )}
          <path
            d={line}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
      <span
        className="r-dot absolute size-2 -translate-x-full -translate-y-1/2 border-[1.5px] bg-card"
        style={{
          left: "100%",
          top: `${(y(pts[last]) / 52) * 100}%`,
          borderColor: ACCENT,
          marginLeft: -2,
        }}
      />
    </>
  );
}

/** A row of thin bars along the bottom edge: one per day or trade. */
export function BleedBars({
  bars,
}: {
  bars: { h: number; color: string; ring?: boolean; title?: string }[];
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-end gap-[3px] pb-[calc(0.875rem*var(--density,1))]",
        PAD,
      )}
    >
      {bars.map((b, i) => (
        <span
          key={i}
          title={b.title}
          className="r-bar min-w-0 flex-1"
          style={{
            height: `${Math.max(12, b.h * 100)}%`,
            ...(b.ring
              ? { boxShadow: `inset 0 0 0 1.5px ${b.color}` }
              : { background: b.color }),
          }}
        />
      ))}
    </div>
  );
}

// ---------- Split

/**
 * A panel (picture, poster, photo) beside the details. From 22rem wide the
 * panel takes the left ~40% at full height; narrower, it becomes a thin band
 * on top (parts marked data-split-narrow="hide" drop out there).
 */
export function SplitCard({
  panel,
  children,
  className,
}: {
  panel: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <W className={cn("gap-0 p-0 @[22rem]:flex-row", className)}>
      <div className="relative h-10 shrink-0 overflow-hidden @[22rem]:h-auto @[22rem]:w-[40%] @[22rem]:max-w-72 [&_[data-split-narrow=hide]]:hidden @[22rem]:[&_[data-split-narrow=hide]]:flex">
        {panel}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 p-[calc(1rem*var(--density,1))]">
        {children}
      </div>
    </W>
  );
}

/**
 * A dark poster for the Split panel: the coach's artwork (a candlestick
 * line), a small label on top and a title at the bottom, in the heading font.
 */
export function Poster({
  kicker,
  title,
  sub,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const candles = [30, 44, 38, 52, 47, 60, 55, 68, 62, 74, 70, 80];
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background:
          "var(--cover-bg, color-mix(in oklab, var(--foreground) 90%, var(--background)))",
        color: "var(--cover-fg, var(--background))",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
        aria-hidden
      >
        {candles.map((h, i) => {
          const x = 4 + i * 8;
          return (
            <g
              key={i}
              stroke="currentColor"
              fill={i % 3 === 1 ? "none" : "currentColor"}
              opacity={i === candles.length - 1 ? 0.5 : 0.14}
            >
              <line
                x1={x + 1.5}
                x2={x + 1.5}
                y1={100 - h - 6}
                y2={100 - h + 18}
                strokeWidth="0.4"
              />
              <rect x={x} y={100 - h} width="3" height="11" strokeWidth="0.4" />
            </g>
          );
        })}
      </svg>
      <div
        data-split-narrow="hide"
        className="absolute inset-0 flex flex-col justify-between gap-2 p-3"
      >
        {kicker ? (
          <span className="text-[0.6875rem] leading-4 font-medium tracking-[0.04em] uppercase">
            {kicker}
          </span>
        ) : (
          <span />
        )}
        <div className="grid min-w-0 gap-0.5">
          <span className="line-clamp-2 font-heading text-[0.9375rem] leading-5">
            {title}
          </span>
          {sub && (
            <span className="truncate text-xs leading-4 opacity-85">{sub}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Rail

export type RailItem =
  | {
      /** Left column: a time, a day, a step number. */
      time: string;
      title: React.ReactNode;
      sub?: React.ReactNode;
      /** Right column. */
      aside?: React.ReactNode;
      /** past: done (grey dot); next: the accent; ahead: still open (hollow). The line is solid on the past side of the now marker. */
      state: "past" | "next" | "ahead";
      /** Dot colour override (e.g. the loss colour for a no-trade release). */
      color?: string;
    }
  | { now: string }
  | { group: string };

/**
 * A vertical timeline. The rail is drawn per row, so rows that don't fit the
 * card's height drop out whole (the list wraps into a hidden second column).
 * `newestFirst`: the now marker sits on top and the past runs down from it.
 */
export function Rail({
  items,
  newestFirst,
  className,
}: {
  items: RailItem[];
  newestFirst?: boolean;
  className?: string;
}) {
  const font = useFigureFont();
  const nowAt = items.findIndex((it) => "now" in it);
  const cols = "grid grid-cols-[2.75rem_0.75rem_minmax(0,1fr)_auto] gap-x-2";
  // A day heading travels with the row after it, so a heading is never left without its rows.
  const rows: {
    it: Exclude<RailItem, { group: string }>;
    head?: string;
    i: number;
  }[] = [];
  let head: string | undefined;
  items.forEach((it, i) => {
    if ("group" in it) head = it.group;
    else {
      rows.push({ it, head, i });
      head = undefined;
    }
  });
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col flex-wrap content-start overflow-hidden *:w-full",
        className,
      )}
    >
      {rows.map(({ it, head, i }, n) => {
        const past = nowAt >= 0 && (newestFirst ? i > nowAt : i < nowAt);
        const lineStyle = past
          ? { background: GREY[2] }
          : {
              backgroundImage: `linear-gradient(${TRACK} 50%, transparent 50%)`,
              backgroundSize: "1px 4px",
            };
        const last = n === rows.length - 1;
        const heading = head && (
          <div className={cols}>
            <Label className="truncate pt-1.5 pb-0.5">{head}</Label>
            <span className="relative">
              <span
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                style={lineStyle}
              />
            </span>
            <span />
            <span />
          </div>
        );
        if ("now" in it)
          return (
            <div key={i} className={cn(cols, "items-center py-1")}>
              <span
                className="text-right text-[0.6875rem] leading-4 tabular-nums"
                style={{ fontFamily: font, color: ink(ACCENT_TEXT) }}
              >
                {it.now}
              </span>
              <span className="relative grid h-full place-items-center">
                <span
                  className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2"
                  style={{ background: GREY[2] }}
                />
                <span
                  className="relative size-2.5 rotate-45 rounded-[1px]"
                  style={{ background: ACCENT }}
                />
              </span>
              <span
                className="h-px self-center"
                style={{
                  background: `color-mix(in oklab, ${ACCENT} 45%, transparent)`,
                }}
              />
              <Label className="pl-1">Now</Label>
            </div>
          );
        const dot =
          it.state === "next"
            ? {
                background: it.color ?? ACCENT,
                boxShadow: `0 0 0 3px color-mix(in oklab, ${it.color ?? ACCENT} 22%, transparent)`,
              }
            : it.state === "past"
              ? { background: it.color ?? GREY[1] }
              : {
                  boxShadow: `inset 0 0 0 1.5px ${it.color ?? GREY[1]}`,
                  background: "var(--card)",
                };
        return (
          <div key={i}>
            {heading}
            <div className={cn(cols, "py-1")}>
              <span
                className="truncate pt-px text-right text-[0.6875rem] leading-5 tabular-nums"
                style={{
                  fontFamily: font,
                  color:
                    it.state === "next"
                      ? ink(ACCENT_TEXT)
                      : "var(--muted-foreground)",
                }}
              >
                {it.time}
              </span>
              <span className="relative">
                <span
                  className={cn(
                    "absolute left-1/2 w-px -translate-x-1/2",
                    last ? "top-0 h-2.5" : "-inset-y-1",
                  )}
                  style={lineStyle}
                />
                <span
                  className="r-dot absolute top-1.5 left-1/2 size-2 -translate-x-1/2"
                  style={dot}
                />
              </span>
              <span className="grid min-w-0">
                <span
                  className={cn(
                    "truncate text-xs leading-5",
                    it.state === "next" && "font-medium",
                    it.state === "past" && "text-muted-foreground",
                  )}
                >
                  {it.title}
                </span>
                {it.sub && (
                  <span className="line-clamp-2 text-xs leading-4 text-muted-foreground">
                    {it.sub}
                  </span>
                )}
              </span>
              {it.aside !== undefined ? (
                <span
                  className="flex shrink-0 items-start pt-0.5 text-[0.6875rem] leading-4 tabular-nums"
                  style={{ fontFamily: font }}
                >
                  {it.aside}
                </span>
              ) : (
                <span />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
