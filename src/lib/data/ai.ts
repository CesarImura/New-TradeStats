// Canned answers for the AI assistant in the prototype. The real one answers
// from the coach's own courses, transcripts, documents and rules.

import { AI_KNOWLEDGE, AI_USAGE } from "./people"

/** What the coach set up for their AI (ADM-24 to ADM-27). */
export type AiSetup = {
  tone: number
  length: "short" | "medium" | "long"
  examples: string
  avoid: string
  knowledge: Record<string, boolean>
  features: Record<string, Record<string, boolean>>
  quotas: Record<string, number>
  corrections: { q: string; a: string }[]
}
export const DEFAULT_AI: AiSetup = {
  tone: 40,
  length: "medium",
  examples: "Short sentences. Refer to the lesson and the minute. Always end with one thing to do next.",
  avoid: "Signals, specific entries for tomorrow, which broker to pick, anything about taxes.",
  knowledge: Object.fromEntries(AI_KNOWLEDGE.map((k) => [k.id, k.on])),
  features: {},
  quotas: Object.fromEntries(AI_USAGE.map((u) => [u.tier, u.quota])),
  corrections: [],
}

export type AiReply = { text: string; source?: string; trade?: string }

const ANSWERS: { match: RegExp; reply: AiReply }[] = [
  {
    match: /stop|stopped/i,
    reply: {
      text: "Your stops sit just beyond the obvious swing low, where most traders put theirs. In Module 2 the coach suggests placing them past the next structure level and sizing down to keep the 1% risk.",
      source: "Module 2 · Stops that make sense, 12:40",
    },
  },
  {
    match: /size|contract|lot|risk/i,
    reply: {
      text: "Risk 1% of the account per trade. On a 50K account that's €500: with a 20-point stop on NQ (€20 per point on a micro), that's about 1 mini or 12 micros. Round down, never up.",
      source: "Module 3 · Position sizing, 04:15",
    },
  },
  {
    match: /cpi|news|fomc|nfp|ecb/i,
    reply: {
      text: "The rule is flat 10 minutes before and after red news. CPI is on Wednesday at 14:30 and it's marked as no-trade in the calendar. Trade the reaction after the first 5-minute candle closes.",
      source: "Module 3 · Daily loss limits, 08:02",
    },
  },
  {
    match: /orb|opening range|breakout/i,
    reply: {
      text: "The range is the first 15 minutes after the open. Enter only on a candle close outside the range, stop on the other side. If the breakout candle closes back inside, that's the failed-breakout setup instead.",
      source: "Price action playbook · Opening range breakout, 06:30",
    },
  },
  {
    match: /prop|funded|challenge|ftmo/i,
    reply: {
      text: "I can't recommend a specific firm, but the course has a checklist: daily drawdown rules, trailing or static drawdown, payout split and news rules. Compare those against your own trading style.",
      source: "Foundations · Scaling up safely, 10:12",
    },
  },
]

const FALLBACK: AiReply = {
  text: "I couldn't find that in the course material. I've passed the question on, so the coach sees it and can add it to a lesson. You can also ask on the next Q&A call.",
}

export function aiAnswer(q: string): AiReply {
  return ANSWERS.find((a) => a.match.test(q))?.reply ?? FALLBACK
}

export function aiTradeAnswer(trade: { symbol: string; side: string; r: number; setup: string; rulesBroken: string[] }): AiReply {
  const broke = trade.rulesBroken.length ? ` It broke one rule: “${trade.rulesBroken[0]}”.` : " It kept every rule."
  return {
    text: `${trade.symbol} ${trade.side} as a ${trade.setup}, ${trade.r >= 0 ? "+" : ""}${trade.r.toFixed(1)}R.${broke} ${
      trade.r < 0 ? "The entry came after the move had already started, so the stop had to be wide. Waiting for the retest would have halved the risk." : "Entry and stop matched the setup. Next time consider taking half off at 1R so the runner is free."
    }`,
    source: `Your journal · ${trade.symbol} ${trade.side}`,
    trade: trade.symbol,
  }
}

export const SUGGESTED = [
  "Why do I keep getting stopped out right before the move?",
  "How many contracts for a 50K account?",
  "Should I trade during CPI?",
  "What counts as an opening range breakout?",
]
