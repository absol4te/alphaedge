"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DocumentAnalysis } from "@/types";

export interface SavedDocument {
  id: string;
  symbol: string; // linked company ticker
  companyName: string;
  exchange: string;
  uploadedAt: string; // ISO timestamp
  analysis: DocumentAnalysis; // includes fileName, period, metrics, summary…
}

interface DocState {
  documents: SavedDocument[];
  addDocument: (doc: SavedDocument) => void;
  removeDocument: (id: string) => void;
  /** Documents linked to a ticker, newest first. */
  forSymbol: (symbol: string) => SavedDocument[];
}

export const useDocStore = create<DocState>()(
  persist(
    (set, get) => ({
      documents: [],
      addDocument: (doc) =>
        set((s) => ({ documents: [doc, ...s.documents].slice(0, 200) })),
      removeDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
      forSymbol: (symbol) =>
        get()
          .documents.filter((d) => d.symbol.toUpperCase() === symbol.toUpperCase())
          .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    }),
    { name: "alphaedge-docs", version: 1 },
  ),
);
