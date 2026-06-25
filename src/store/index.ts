"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Watchlist, WatchlistItem } from "@/types";
import { defaultWatchlist } from "@/lib/mock-data";

interface AppState {
  // ── Watchlists ──
  watchlists: Watchlist[];
  activeWatchlistId: string;
  setActiveWatchlist: (id: string) => void;
  createWatchlist: (name: string) => void;
  deleteWatchlist: (id: string) => void;
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (symbol: string) => void;
  isWatched: (symbol: string) => boolean;

  // ── Search history ──
  recentSearches: RecentSearch[];
  pushSearch: (item: RecentSearch) => void;
  clearSearches: () => void;
}

export interface RecentSearch {
  symbol: string;
  name: string;
  exchange: string;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      watchlists: [
        { id: "default", name: "My Watchlist", items: defaultWatchlist() },
        { id: "tech", name: "Big Tech", items: [] },
      ],
      activeWatchlistId: "default",

      setActiveWatchlist: (id) => set({ activeWatchlistId: id }),

      createWatchlist: (name) =>
        set((s) => {
          const id = `wl-${Date.now()}`;
          return { watchlists: [...s.watchlists, { id, name, items: [] }], activeWatchlistId: id };
        }),

      deleteWatchlist: (id) =>
        set((s) => {
          if (s.watchlists.length <= 1) return s;
          const remaining = s.watchlists.filter((w) => w.id !== id);
          return {
            watchlists: remaining,
            activeWatchlistId:
              s.activeWatchlistId === id ? remaining[0].id : s.activeWatchlistId,
          };
        }),

      addToWatchlist: (item) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === s.activeWatchlistId && !w.items.some((i) => i.symbol === item.symbol)
              ? { ...w, items: [...w.items, item] }
              : w,
          ),
        })),

      removeFromWatchlist: (symbol) =>
        set((s) => ({
          watchlists: s.watchlists.map((w) =>
            w.id === s.activeWatchlistId
              ? { ...w, items: w.items.filter((i) => i.symbol !== symbol) }
              : w,
          ),
        })),

      isWatched: (symbol) => {
        const s = get();
        const wl = s.watchlists.find((w) => w.id === s.activeWatchlistId);
        return !!wl?.items.some((i) => i.symbol === symbol);
      },

      recentSearches: [
        { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
        { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
        { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
      ],
      pushSearch: (item) =>
        set((s) => ({
          recentSearches: [
            item,
            ...s.recentSearches.filter((x) => x.symbol !== item.symbol),
          ].slice(0, 8),
        })),
      clearSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: "alphaedge-store",
      version: 2,
      // v1 stored recentSearches as string[]; coerce/drop so hydration is safe.
      migrate: (persisted) => {
        const s = persisted as Partial<AppState> | undefined;
        if (s?.recentSearches?.some((x) => typeof x === "string")) {
          s.recentSearches = [];
        }
        return s as AppState;
      },
    },
  ),
);
