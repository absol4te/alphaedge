"use client";

import { useState, KeyboardEvent } from "react";
import { Plus, X, GripVertical, BookmarkPlus, BookmarkCheck, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TICKER_NAMES } from "@/lib/tracker/scoring";
import type { TrackedCompany, SavedWatchlist, FilterState } from "@/lib/tracker/types";

interface Props {
  watchlist: TrackedCompany[];
  savedLists: SavedWatchlist[];
  filters: FilterState;
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  onReorder: (from: number, to: number) => void;
  onSaveList: (name: string) => void;
  onLoadList: (list: SavedWatchlist) => void;
  onDeleteList: (id: string) => void;
  onFiltersChange: (f: FilterState) => void;
}

/** Ticker badge colours — cycles through a fixed palette */
const BADGE_COLORS = [
  "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "bg-green-500/20 text-green-400 border-green-500/30",
  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "bg-red-500/20 text-red-300 border-red-500/30",
];

export function tickerColor(ticker: string, index: number): string {
  // Deterministic by ticker or fall back to index
  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return BADGE_COLORS[(seed + index) % BADGE_COLORS.length];
}

export function CompanyPanel({
  watchlist,
  savedLists,
  filters,
  onAdd,
  onRemove,
  onReorder,
  onSaveList,
  onLoadList,
  onDeleteList,
  onFiltersChange,
}: Props) {
  const [input, setInput] = useState("");
  const [saveListName, setSaveListName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [showSaved, setShowSaved] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  function handleAdd() {
    const t = input.trim().toUpperCase();
    if (!t) return;
    onAdd(t);
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") setInput("");
  }

  function handleSaveList() {
    const name = saveListName.trim();
    if (!name) return;
    onSaveList(name);
    setSaveListName("");
    setShowSaveInput(false);
  }

  // Drag-to-reorder
  function onDragStart(i: number) { setDragIndex(i); }
  function onDragEnter(i: number) { setDragOver(i); }
  function onDragEnd() {
    if (dragIndex !== null && dragOver !== null && dragIndex !== dragOver) {
      onReorder(dragIndex, dragOver);
    }
    setDragIndex(null);
    setDragOver(null);
  }

  // Toggle ticker in filter
  function toggleTickerFilter(ticker: string) {
    const current = filters.tickers;
    const next = current.includes(ticker)
      ? current.filter((t) => t !== ticker)
      : [...current, ticker];
    onFiltersChange({ ...filters, tickers: next });
  }

  return (
    <div className="flex flex-col text-sm">
      {/* Header */}
      <div className="border-b border-border px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Tracked Companies
        </span>
      </div>

      {/* Add input */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          placeholder="Add ticker…"
          className="h-7 min-w-0 flex-1 rounded bg-card px-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
          maxLength={10}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent/15 text-accent transition-colors hover:bg-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Company list — bounded height so social panel is always visible */}
      <div className="max-h-52 overflow-y-auto py-1">
        {watchlist.length === 0 && (
          <p className="px-3 py-4 text-center text-xs text-muted">Add tickers above to start tracking</p>
        )}
        {watchlist.map((company, i) => {
          const isFiltered = filters.tickers.includes(company.ticker);
          const color = tickerColor(company.ticker, i);
          return (
            <div
              key={company.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={cn(
                "group flex cursor-default items-center gap-2 px-2 py-1.5 transition-colors",
                dragOver === i && dragIndex !== i && "bg-accent/10",
              )}
            >
              <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />

              {/* Ticker badge — click to toggle focus filter */}
              <button
                onClick={() => toggleTickerFilter(company.ticker)}
                className={cn(
                  "rounded border px-1.5 py-0.5 text-[10px] font-bold transition-opacity",
                  color,
                  !isFiltered && filters.tickers.length > 0 && "opacity-40",
                )}
                title={isFiltered ? "Remove focus filter" : "Focus on this ticker"}
              >
                {company.ticker}
              </button>

              <span className="min-w-0 flex-1 truncate text-[11px] text-foreground/70">
                {company.name}
              </span>

              <button
                onClick={() => onRemove(company.ticker)}
                className="shrink-0 text-muted opacity-0 transition-opacity hover:text-negative group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Clear filter shortcut */}
      {filters.tickers.length > 0 && (
        <button
          onClick={() => onFiltersChange({ ...filters, tickers: [] })}
          className="border-t border-border px-3 py-1.5 text-left text-[10px] text-muted hover:text-accent"
        >
          ✕ Clear focus ({filters.tickers.length} selected)
        </button>
      )}

      {/* Watchlists section */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowSaved((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Watchlists
          </span>
          <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", showSaved && "rotate-180")} />
        </button>

        {showSaved && (
          <div className="pb-2">
            {savedLists.length === 0 && !showSaveInput && (
              <p className="px-3 py-1 text-[11px] text-muted">No saved watchlists</p>
            )}
            {savedLists.map((list) => (
              <div key={list.id} className="group flex items-center gap-1 px-3 py-1">
                <button
                  onClick={() => onLoadList(list)}
                  className="flex-1 truncate text-left text-[11px] text-foreground/80 hover:text-accent"
                >
                  <BookmarkCheck className="mr-1 inline h-3 w-3 text-muted" />
                  {list.name}
                  <span className="ml-1 text-muted">({list.tickers.length})</span>
                </button>
                <button
                  onClick={() => onDeleteList(list.id)}
                  className="shrink-0 text-muted opacity-0 hover:text-negative group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {showSaveInput ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <input
                  value={saveListName}
                  onChange={(e) => setSaveListName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveList();
                    if (e.key === "Escape") { setShowSaveInput(false); setSaveListName(""); }
                  }}
                  placeholder="Watchlist name…"
                  autoFocus
                  className="h-6 min-w-0 flex-1 rounded bg-card px-2 text-[11px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
                <button
                  onClick={handleSaveList}
                  disabled={!saveListName.trim()}
                  className="shrink-0 text-[10px] font-medium text-accent disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSaveInput(true)}
                disabled={watchlist.length === 0}
                className="mx-3 mt-1 flex items-center gap-1 text-[11px] text-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <BookmarkPlus className="h-3 w-3" />
                Save current list
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
