import { Candle } from "@/types";

export interface Evaluation {
  score: number; // -1 (strong sell) … +1 (strong buy)
  label: "Strong Sell" | "Sell" | "Neutral" | "Buy" | "Strong Buy";
  last: number;
  target: number; // suggested price target derived from the score
  rsi: number;
}

function rsi(closes: number[], period = 14): number {
  if (closes.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gains += d;
    else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function avg(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
}

/**
 * A lightweight technical evaluation (trend + RSI + momentum) → a score in
 * [-1, 1], a Buy/Sell label, and a suggested price target. The target is the
 * last price nudged up to ±12% in the direction/strength of the signal.
 */
export function computeEvaluation(candles: Candle[]): Evaluation {
  const closes = candles.map((c) => c.close);
  const last = closes[closes.length - 1] ?? 0;

  const sma20 = avg(closes.slice(-20));
  const sma50 = avg(closes.slice(-50));
  const r = rsi(closes);
  const lookback = closes[closes.length - 11] ?? closes[0] ?? last;
  const momentum = lookback ? (last - lookback) / lookback : 0;

  // Component signals, each roughly in [-1, 1].
  const trend = sma20 ? clamp((last / sma20 - 1) * 8, -1, 1) : 0;
  const ma = sma50 ? clamp((sma20 / sma50 - 1) * 12, -1, 1) : 0;
  const rsiSig = clamp((50 - r) / 30, -1, 1); // overbought→sell, oversold→buy
  const mom = clamp(momentum * 6, -1, 1);

  const score = clamp(trend * 0.4 + ma * 0.25 + mom * 0.2 + rsiSig * 0.15, -1, 1);

  const label: Evaluation["label"] =
    score > 0.5 ? "Strong Buy" : score > 0.15 ? "Buy" : score >= -0.15 ? "Neutral" : score >= -0.5 ? "Sell" : "Strong Sell";

  const target = Number((last * (1 + score * 0.12)).toFixed(2));

  return { score, label, last, target, rsi: Math.round(r) };
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
