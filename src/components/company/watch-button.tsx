"use client";

import { Star } from "lucide-react";
import { useStore } from "@/store";
import { cn } from "@/lib/utils";

export function WatchButton({
  symbol,
  name,
  exchange,
}: {
  symbol: string;
  name: string;
  exchange: string;
}) {
  const watched = useStore((s) => s.isWatched(symbol));
  const add = useStore((s) => s.addToWatchlist);
  const remove = useStore((s) => s.removeFromWatchlist);

  return (
    <button
      onClick={() => (watched ? remove(symbol) : add({ symbol, name, exchange }))}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-all active:scale-95",
        watched
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border bg-card text-foreground hover:border-[#3a3a3a]",
      )}
    >
      <Star className={cn("h-4 w-4", watched && "fill-accent")} />
      {watched ? "Watching" : "Add to Watchlist"}
    </button>
  );
}
