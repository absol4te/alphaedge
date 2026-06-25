import { NextRequest, NextResponse } from "next/server";
import { getFinancialStatement } from "@/lib/financials";

// GET /api/statements?symbol=AAPL
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "AAPL";
  return NextResponse.json({ symbol, data: getFinancialStatement(symbol) });
}
