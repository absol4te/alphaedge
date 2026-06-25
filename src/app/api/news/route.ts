import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/mock-data";
import { hasLiveData, liveNews } from "@/lib/providers/finnhub";

// GET /api/news?limit=20&category=Technology
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20), 60);
  const category = searchParams.get("category");

  let news = getNews(limit);
  let live = false;

  // Use real Finnhub headlines when a key is configured; fall back to mock.
  if (hasLiveData()) {
    try {
      news = await liveNews(limit);
      live = true;
    } catch (e) {
      console.error("[/api/news] live fetch failed, using mock:", e);
    }
  }

  if (category && category !== "All") {
    news = news.filter((n) => n.category === category);
  }

  return NextResponse.json({ data: news, count: news.length, live });
}
