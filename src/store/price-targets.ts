"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PriceTargetState {
  targets: Record<string, number>; // symbol → target price
  setTarget: (symbol: string, price: number) => void;
  clearTarget: (symbol: string) => void;
}

export const usePriceTargets = create<PriceTargetState>()(
  persist(
    (set) => ({
      targets: {},
      setTarget: (symbol, price) =>
        set((s) => ({ targets: { ...s.targets, [symbol.toUpperCase()]: price } })),
      clearTarget: (symbol) =>
        set((s) => {
          const next = { ...s.targets };
          delete next[symbol.toUpperCase()];
          return { targets: next };
        }),
    }),
    { name: "alphaedge-price-targets" },
  ),
);
