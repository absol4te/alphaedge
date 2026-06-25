import { NextRequest, NextResponse } from "next/server";
import { searchSymbols } from "@/lib/providers/discovery";

export const runtime = "nodejs";

// GET /api/search?q=apple — universal, global company discovery.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const data = await searchSymbols(q);
  return NextResponse.json({ query: q, data, count: data.length });
}
