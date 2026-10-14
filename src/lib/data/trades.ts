// Journal trades and chart data. The prototype's "today" is Monday 12 October 2026, 09:00.

export type Side = "long" | "short"
export type Review = "none" | "waiting" | "answered"

export type Trade = {
  id: string
  symbol: string
  side: Side
  date: string // e.g. "Fri 9 Oct"
  time: string
  entry: number
  exit: number
  stop: number
  target: number
  size: string
  r: number
  pnl: number
  setup: string
  tags: string[]
  rulesBroken: string[]
  note: string
  review: Review
  /** Coach feedback thread, oldest first. */
  /** "chart" is a TradingView snapshot or layout link the coach shares. */
  thread: { from: "coach" | "student"; kind: "text" | "voice" | "video" | "chart"; text: string; when: string; link?: string }[]
  account: string
}

export const BROKERS = [
  { id: "ibkr", name: "Interactive Brokers", note: "Stocks, futures, options" },
  { id: "tradovate", name: "Tradovate", note: "Futures" },
  { id: "mt5", name: "MetaTrader 5", note: "Forex and CFDs, most prop firms" },
  { id: "mt4", name: "MetaTrader 4", note: "Forex and CFDs" },
  { id: "ninja", name: "NinjaTrader", note: "Futures" },
  { id: "ctrader", name: "cTrader", note: "Forex and CFDs" },
  { id: "binance", name: "Binance", note: "Crypto" },
  { id: "rithmic", name: "Rithmic", note: "Futures, prop firms" },
]

export const ACCOUNTS = [
  { id: "a1", name: "Tradovate · Live", broker: "Tradovate", balance: 12480, synced: "4 min ago" },
  { id: "a2", name: "Funded 50K", broker: "Rithmic", balance: 52340, synced: "4 min ago" },
]

export const TRADES: Trade[] = [
  {
    id: "t1", symbol: "NQ", side: "long", date: "Fri 9 Oct", time: "15:42", entry: 30584.2, exit: 30551.5, stop: 30550, target: 30650, size: "2 contracts", r: -1.2, pnl: -1310,
    setup: "Opening range breakout", tags: ["NY open", "Chased"], rulesBroken: ["Stop never moved further away"], note: "Got in late after the first push. Stop was under the range low.", review: "waiting", thread: [
      { from: "student", kind: "text", text: "Was my stop too tight here?", when: "2 days ago" },
    ], account: "Tradovate · Live",
  },
  {
    id: "t2", symbol: "ES", side: "short", date: "Thu 8 Oct", time: "16:05", entry: 7812.5, exit: 7794.75, stop: 7820, target: 7790, size: "3 contracts", r: 2.4, pnl: 2660,
    setup: "Failed breakout", tags: ["NY open", "Partials"], rulesBroken: [], note: "Took partials early, let the runner go to target.", review: "answered", thread: [
      { from: "student", kind: "text", text: "Took partials early, right call?", when: "Thu" },
      { from: "coach", kind: "voice", text: "Voice note · 0:48", when: "Fri" },
      { from: "coach", kind: "text", text: "Good patience on the entry. Next time scale out at 1R so the runner is free.", when: "Fri" },
    ], account: "Tradovate · Live",
  },
  {
    id: "t3", symbol: "CL", side: "long", date: "Thu 8 Oct", time: "15:12", entry: 71.42, exit: 71.18, stop: 71.12, target: 72.1, size: "1 contract", r: -0.8, pnl: -240,
    setup: "VWAP reclaim", tags: ["Early entry"], rulesBroken: [], note: "Entered before confirmation again.", review: "answered", thread: [
      { from: "student", kind: "text", text: "Entered before confirmation again.", when: "Thu" },
      { from: "coach", kind: "text", text: "You entered before the candle closed. Wait for the close.", when: "Thu" },
    ], account: "Funded 50K",
  },
  {
    id: "t4", symbol: "NQ", side: "short", date: "Wed 7 Oct", time: "15:36", entry: 30640, exit: 30614.5, stop: 30682, target: 30560, size: "1 contract", r: 0.6, pnl: 510,
    setup: "Opening range breakout", tags: ["NY open"], rulesBroken: [], note: "Clean, but closed early before CPI talk.", review: "waiting", thread: [
      { from: "student", kind: "text", text: "Should I have held to target?", when: "5 hours ago" },
    ], account: "Funded 50K",
  },
  {
    id: "t5", symbol: "ES", side: "long", date: "Tue 6 Oct", time: "16:20", entry: 7788, exit: 7801.25, stop: 7781.5, target: 7801, size: "2 contracts", r: 2, pnl: 1325,
    setup: "VWAP reclaim", tags: ["Patience"], rulesBroken: [], note: "Waited for the retest. Textbook.", review: "none", thread: [], account: "Tradovate · Live",
  },
  {
    id: "t6", symbol: "EURUSD", side: "short", date: "Mon 5 Oct", time: "09:14", entry: 1.0942, exit: 1.0961, stop: 1.0961, target: 1.0904, size: "0.5 lots", r: -1, pnl: -95,
    setup: "News fade", tags: ["London", "News"], rulesBroken: ["No trades 10 min before red news"], note: "Traded into the PMI release. Shouldn't have.", review: "none", thread: [], account: "Funded 50K",
  },
  {
    id: "t7", symbol: "NQ", side: "long", date: "Mon 5 Oct", time: "15:48", entry: 30490, exit: 30541, stop: 30465, target: 30540, size: "1 contract", r: 2, pnl: 1020,
    setup: "Opening range breakout", tags: ["NY open"], rulesBroken: [], note: "", review: "none", thread: [], account: "Tradovate · Live",
  },
]

export const STRATEGIES = [
  { id: "orb", name: "Opening range breakout", rules: ["Range = first 15 min", "Enter on close outside the range", "Stop on the other side of the range"], trades: 14 },
  { id: "fbo", name: "Failed breakout", rules: ["Breakout candle closes back inside", "Enter on the next candle", "Target the range middle first"], trades: 9 },
  { id: "vwap", name: "VWAP reclaim", rules: ["Price reclaims VWAP after a trend move", "Wait for a retest", "Stop below the retest low"], trades: 11 },
  { id: "news", name: "News fade", rules: ["Only after the first 5 minutes", "Fade into the prior day's level"], trades: 5 },
]

export const TAGS = ["NY open", "London", "News", "Chased", "Early entry", "Partials", "Patience", "Revenge", "FOMO"]

/** The TradingView symbol for a journal symbol (CFD stand-ins for futures, see MARKETS). */
export function tvSymbol(symbol: string) {
  const map: Record<string, string> = { NQ: "CAPITALCOM:US100", ES: "CAPITALCOM:US500", CL: "TVC:USOIL", GC: "TVC:GOLD", EURUSD: "FX:EURUSD", GBPUSD: "FX:GBPUSD", XAUUSD: "OANDA:XAUUSD" }
  return map[symbol] ?? symbol
}

export const fmtPrice = (n: number) => (n < 10 ? n.toFixed(4) : n < 200 ? n.toFixed(2) : n.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
export const fmtR = (r: number) => `${r >= 0 ? "+" : "−"}${Math.abs(r).toFixed(1)}R`
export const fmtPnl = (n: number) => `${n >= 0 ? "+" : "−"}€${Math.abs(n).toLocaleString("en")}`

// ---------- Charts section

export type Market = "futures" | "forex" | "indices" | "crypto" | "stocks" | "commodities"
// The free TradingView widget can't show exchange futures (CME, NYMEX, COMEX):
// they need a data licence. The prototype uses the matching CFD and index
// symbols instead; which TradingView product and data feed the real build
// uses is an open question in the PRD addendum.
export const MARKETS: { id: Market; label: string; symbols: { tv: string; name: string }[] }[] = [
  { id: "futures", label: "Futures", symbols: [{ tv: "CAPITALCOM:US100", name: "NQ" }, { tv: "CAPITALCOM:US500", name: "ES" }, { tv: "TVC:USOIL", name: "CL" }, { tv: "TVC:GOLD", name: "GC" }] },
  { id: "forex", label: "Forex", symbols: [{ tv: "FX:EURUSD", name: "EURUSD" }, { tv: "FX:GBPUSD", name: "GBPUSD" }, { tv: "FX:USDJPY", name: "USDJPY" }, { tv: "OANDA:XAUUSD", name: "XAUUSD" }] },
  { id: "indices", label: "Indices", symbols: [{ tv: "CAPITALCOM:US30", name: "US30" }, { tv: "CAPITALCOM:DE40", name: "DAX" }, { tv: "CAPITALCOM:UK100", name: "UK100" }] },
  { id: "crypto", label: "Crypto", symbols: [{ tv: "BINANCE:BTCUSDT", name: "BTCUSDT" }, { tv: "BINANCE:ETHUSDT", name: "ETHUSDT" }, { tv: "BINANCE:SOLUSDT", name: "SOLUSDT" }] },
  { id: "stocks", label: "Stocks", symbols: [{ tv: "NASDAQ:AAPL", name: "AAPL" }, { tv: "NASDAQ:NVDA", name: "NVDA" }, { tv: "NASDAQ:TSLA", name: "TSLA" }] },
  { id: "commodities", label: "Commodities", symbols: [{ tv: "TVC:SILVER", name: "Silver" }, { tv: "TVC:UKOIL", name: "Brent" }, { tv: "CAPITALCOM:NATURALGAS", name: "Natural gas" }] },
]

export type ChartSettings = {
  markets: Market[]
  watchlist: { tv: string; name: string }[]
  interval: string
  style: "candles" | "bars" | "line"
  indicators: string[]
  tiers: string[] // empty = every tier
}

export const INTERVALS = [
  { id: "1", label: "1m" },
  { id: "5", label: "5m" },
  { id: "15", label: "15m" },
  { id: "60", label: "1h" },
  { id: "240", label: "4h" },
  { id: "D", label: "1D" },
]
export const INDICATORS = [
  { id: "VWAP@tv-basicstudies", label: "VWAP" },
  { id: "MAExp@tv-basicstudies", label: "EMA" },
  { id: "RSI@tv-basicstudies", label: "RSI" },
  { id: "Volume@tv-basicstudies", label: "Volume" },
  { id: "MACD@tv-basicstudies", label: "MACD" },
  { id: "BB@tv-basicstudies", label: "Bollinger Bands" },
]

export const DEFAULT_CHARTS: ChartSettings = {
  markets: ["futures", "forex"],
  watchlist: [
    { tv: "CAPITALCOM:US100", name: "NQ" },
    { tv: "CAPITALCOM:US500", name: "ES" },
    { tv: "TVC:USOIL", name: "CL" },
    { tv: "FX:EURUSD", name: "EURUSD" },
    { tv: "OANDA:XAUUSD", name: "XAUUSD" },
  ],
  interval: "5",
  style: "candles",
  indicators: ["VWAP@tv-basicstudies", "Volume@tv-basicstudies"],
  tiers: [],
}

/** A chart the coach shares: a TradingView chart of the symbol, their levels and note, and optionally a link to their own TradingView layout or idea. */
export type CoachChart = {
  id: string
  title: string
  symbol: { tv: string; name: string }
  note: string
  when: string
  pinned?: boolean
  tiers: string[] // empty = everyone
  levels: { label: string; at: number; kind: "support" | "resistance" | "target" }[]
  /** The coach's TradingView layout, idea or snapshot link. */
  link?: string
  archived?: boolean
}

export const COACH_CHARTS: CoachChart[] = [
  {
    id: "c1", title: "Levels for this week", symbol: { tv: "CAPITALCOM:US100", name: "NQ" }, when: "Sun 11 Oct", pinned: true, tiers: [],
    note: "Above 30,800 I'm only looking for longs. Below 30,200 the weekly low is in play.",
    levels: [
      { label: "Weekly high", at: 30800, kind: "resistance" },
      { label: "Value area", at: 30550, kind: "target" },
      { label: "Weekly low", at: 30200, kind: "support" },
    ], link: "https://www.tradingview.com/chart/",
  },
  {
    id: "c2", title: "CPI on Wednesday: no-trade zone", symbol: { tv: "CAPITALCOM:US500", name: "ES" }, when: "Mon 12 Oct", tiers: [],
    note: "Flat 10 minutes before and after. If we gap above 7,880, wait for the first pullback.",
    levels: [
      { label: "Gap level", at: 7880, kind: "resistance" },
      { label: "Friday close", at: 7806, kind: "target" },
      { label: "Support", at: 7720, kind: "support" },
    ]
  },
  {
    id: "c3", title: "EURUSD into the ECB", symbol: { tv: "FX:EURUSD", name: "EURUSD" }, when: "Fri 9 Oct", tiers: ["desk", "vip"],
    note: "Range trade until Thursday. Breakout only after the press conference.",
    levels: [
      { label: "Range top", at: 1.0985, kind: "resistance" },
      { label: "Range bottom", at: 1.0902, kind: "support" },
    ], link: "https://www.tradingview.com/chart/",
  },
]

/** Chart defaults for a community; one made in setup starts from the markets the coach picked there. */
export function chartDefaults(markets?: Market[]): ChartSettings {
  if (!markets?.length) return DEFAULT_CHARTS
  const watchlist = MARKETS.filter((m) => markets.includes(m.id)).flatMap((m) => m.symbols.slice(0, 3))
  return { ...DEFAULT_CHARTS, markets, watchlist: watchlist.length ? watchlist : DEFAULT_CHARTS.watchlist }
}
