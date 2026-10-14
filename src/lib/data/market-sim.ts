"use client"

import { useEffect, useState } from "react"

// Simulated quotes, order book and trades for the Charts terminal. The real
// build gets these from the market-data feed (open question in the PRD
// addendum); the TradingView chart itself shows real prices.

/** `point`: euros a 1.0 price move is worth for one contract or lot, for the size calculator. */
export type SymbolMeta = { mid: number; point: number; tick: number; decimals: number; unit: string; dayChange: number; volume: string }

const META: Record<string, SymbolMeta> = {
  "CAPITALCOM:US100": { mid: 30550, point: 20, tick: 0.25, decimals: 2, unit: "contracts", dayChange: 1.21, volume: "1.84M" },
  "CAPITALCOM:US500": { mid: 7806, point: 50, tick: 0.25, decimals: 2, unit: "contracts", dayChange: 0.64, volume: "2.31M" },
  "TVC:USOIL": { mid: 71.42, point: 1000, tick: 0.01, decimals: 2, unit: "contracts", dayChange: -0.88, volume: "412K" },
  "TVC:GOLD": { mid: 2684.5, point: 100, tick: 0.1, decimals: 1, unit: "contracts", dayChange: 0.32, volume: "198K" },
  "FX:EURUSD": { mid: 1.0942, point: 100000, tick: 0.0001, decimals: 4, unit: "lots", dayChange: -0.12, volume: "96.4K" },
  "FX:GBPUSD": { mid: 1.2735, point: 100000, tick: 0.0001, decimals: 4, unit: "lots", dayChange: 0.08, volume: "71.2K" },
  "FX:USDJPY": { mid: 149.82, point: 1000, tick: 0.01, decimals: 2, unit: "lots", dayChange: 0.41, volume: "88.0K" },
  "OANDA:XAUUSD": { mid: 2684.6, point: 100, tick: 0.1, decimals: 1, unit: "lots", dayChange: 0.32, volume: "54.9K" },
  "BINANCE:BTCUSDT": { mid: 83143, point: 1, tick: 1, decimals: 0, unit: "BTC", dayChange: 1.4, volume: "221.9M" },
  "BINANCE:ETHUSDT": { mid: 3120, point: 1, tick: 0.1, decimals: 1, unit: "ETH", dayChange: 2.05, volume: "98.7M" },
  "BINANCE:SOLUSDT": { mid: 182.4, point: 1, tick: 0.01, decimals: 2, unit: "SOL", dayChange: -1.3, volume: "31.5M" },
}

export function metaFor(tv: string): SymbolMeta {
  return META[tv] ?? { mid: 100, point: 1, tick: 0.01, decimals: 2, unit: "units", dayChange: 0.5, volume: "–" }
}

export type Level = { price: number; size: number; total: number }
export type Print = { id: number; price: number; size: number; side: "buy" | "sell"; time: string }
export type Book = { asks: Level[]; bids: Level[]; trades: Print[]; price: number; prev: number }

function rng(seed: number) {
  let s = seed % 233280
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280)
}

const clock = (offset: number) => {
  const d = new Date(Date.UTC(2026, 9, 12, 7, 0, 0) + offset * 1000)
  return d.toISOString().slice(11, 19)
}

function build(meta: SymbolMeta, price: number, r: () => number, depth = 11): Pick<Book, "asks" | "bids"> {
  const side = (dir: 1 | -1) => {
    let total = 0
    return Array.from({ length: depth }, (_, i) => {
      const size = Math.round((0.4 + r() * 9) * 100) / 100
      total += size
      return { price: price + dir * meta.tick * (i + 1), size, total: Math.round(total * 100) / 100 }
    })
  }
  return { asks: side(1).reverse(), bids: side(-1) }
}

/** A live-looking book and tape around the symbol's price. The first frame is seeded so server and browser match. */
export function useMarket(tv: string): Book & { meta: SymbolMeta } {
  const meta = metaFor(tv)
  const [book, setBook] = useState<Book>(() => {
    const r = rng(tv.length * 977)
    const trades = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      price: meta.mid + Math.round((r() - 0.5) * 6) * meta.tick,
      size: Math.round((0.1 + r() * 4) * 100) / 100,
      side: (r() > 0.5 ? "buy" : "sell") as Print["side"],
      time: clock(-i * 3),
    }))
    return { ...build(meta, meta.mid, r), trades, price: meta.mid, prev: meta.mid }
  })

  useEffect(() => {
    const m = metaFor(tv)
    let n = 100
    let t = 0
    const r = rng(Date.now())
    // Reset to the new symbol, then tick.
    const first = setTimeout(() => setBook((b) => ({ ...b, ...build(m, m.mid, r), price: m.mid, prev: m.mid, trades: b.trades.map((x) => ({ ...x, price: m.mid })) })), 0)
    const id = setInterval(() => {
      t += 1
      setBook((b) => {
        const step = Math.round((r() - 0.5) * 3) * m.tick
        const price = Math.max(m.tick, b.price + step)
        const fresh = Array.from({ length: 1 + Math.floor(r() * 3) }, () => ({
          id: n++,
          price: price + Math.round((r() - 0.5) * 2) * m.tick,
          size: Math.round((0.05 + r() * 3) * 100) / 100,
          side: (step >= 0 ? (r() > 0.3 ? "buy" : "sell") : r() > 0.3 ? "sell" : "buy") as Print["side"],
          time: clock(t),
        }))
        return { ...build(m, price, r), price, prev: b.price, trades: [...fresh, ...b.trades].slice(0, 40) }
      })
    }, 1100)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [tv])

  return { ...book, meta }
}

export const fmt = (n: number, d: number) => n.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d })
