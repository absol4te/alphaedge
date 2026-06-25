import { NextRequest, NextResponse } from "next/server";
import { generateCandles } from "@/lib/mock-data";
import { Timeframe } from "@/types";

const VALID: Timeframe[] = ["1D", "5D", "1M", "6M", "1Y", "5Y", "MAX"];

// GET /api/charts?symbol=AAPL&tf=1Y
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";
  const tf = (searchParams.get("tf") ?? "1Y") as Timeframe;
  if (!VALID.includes(tf)) {
    return NextResponse.json({ error: "Invalid timeframe" }, { status: 400 });
  }
  const candles = generateCandles(symbol, tf);
  return NextResponse.json({ symbol, timeframe: tf, data: candles });
}
