"use client";

import { useState, KeyboardEvent } from "react";
import {
  Plus, X, ChevronDown, Check, Twitter, Building2, Shield,
  Pen, BarChart2, Globe, HelpCircle, ToggleLeft, ToggleRight,
  BookmarkPlus, BookmarkCheck, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialAccount, SocialCategory, SavedSocialList } from "@/lib/tracker/types";

interface Props {
  accounts: SocialAccount[];
  savedLists: SavedSocialList[];
  onAdd: (handle: string) => void;
  onRemove: (handle: string) => void;
  onToggle: (handle: string) => void;
  onSaveList: (name: string) => void;
  onLoadList: (list: SavedSocialList) => void;
  onDeleteList: (id: string) => void;
}

const CATEGORY_CONFIG: Record<SocialCategory, { label: string; icon: React.FC<{ className?: string }>; cls: string }> = {
  executive:  { label: "Executive",  icon: Building2, cls: "text-blue-400" },
  company:    { label: "Company",    icon: Twitter,   cls: "text-cyan-400" },
  regulator:  { label: "Regulator", icon: Shield,    cls: "text-red-400" },
  journalist: { label: "Journalist", icon: Pen,       cls: "text-yellow-400" },
  analyst:    { label: "Analyst",    icon: BarChart2, cls: "text-purple-400" },
  macro:      { label: "Macro",      icon: Globe,     cls: "text-green-400" },
  other:      { label: "Other",      icon: HelpCircle, cls: "text-muted" },
};

function CategoryIcon({ category, className }: { category: SocialCategory; className?: string }) {
  const cfg = CATEGORY_CONFIG[category];
  return <cfg.icon className={cn("h-3 w-3 shrink-0", cfg.cls, className)} />;
}

export function SocialPanel({
  accounts,
  savedLists,
  onAdd,
  onRemove,
  onToggle,
  onSaveList,
  onLoadList,
  onDeleteList,
}: Props) {
  const [input, setInput] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveListName, setSaveListName] = useState("");
  const [filterCat, setFilterCat] = useState<SocialCategory | "all">("all");

  function handleAdd() {
    const h = input.replace(/^@/, "").trim();
    if (!h) return;
    onAdd(h);
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

  const enabledCount = accounts.filter((a) => a.enabled).length;
  const visible = filterCat === "all"
    ? accounts
    : accounts.filter((a) => a.category === filterCat);

  const categories = [...new Set(accounts.map((a) => a.category))];

  return (
    <div className="border-t border-border text-sm">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Social Accounts
        </span>
        <span className="rounded bg-card px-1.5 py-0.5 text-[10px] text-muted">
          {enabledCount}/{accounts.length}
        </span>
      </div>

      {/* Sources notice */}
      <div className="border-b border-border/50 bg-blue-500/5 px-3 py-1.5">
        <p className="text-[10px] leading-relaxed text-muted">
          Sources:{" "}
          <span className="text-blue-400">StockTwits</span> &middot;{" "}
          <span className="text-orange-400">Reddit</span> &middot;{" "}
          <span className="text-green-400">Truth Social</span> &middot;{" "}
          Nitter (fallback)
        </p>
      </div>

      {/* Add input */}
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <span className="shrink-0 text-xs text-muted">@</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.replace(/^@/, ""))}
          onKeyDown={handleKeyDown}
          placeholder="Add handle…"
          className="h-7 min-w-0 flex-1 rounded bg-card px-2 text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
          maxLength={50}
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-accent/15 text-accent transition-colors hover:bg-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Category filter pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-1.5">
          <button
            onClick={() => setFilterCat("all")}
            className={cn(
              "rounded px-1.5 py-0.5 text-[9px] font-medium",
              filterCat === "all" ? "bg-accent/20 text-accent" : "bg-card text-muted hover:text-foreground",
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat === filterCat ? "all" : cat)}
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-medium capitalize",
                filterCat === cat ? "bg-accent/20 text-accent" : "bg-card text-muted hover:text-foreground",
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Account list */}
      <div className="max-h-48 overflow-y-auto py-0.5">
        {visible.length === 0 && (
          <p className="px-3 py-3 text-center text-[11px] text-muted">
            No accounts tracked
          </p>
        )}
        {visible.map((account) => (
          <div
            key={account.id}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-card/40",
              !account.enabled && "opacity-50",
            )}
          >
            <CategoryIcon category={account.category} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-[11px] font-medium text-foreground">
                  @{account.handle}
                </span>
                {account.linkedTickers.length > 0 && (
                  <span className="shrink-0 text-[9px] text-muted">
                    ({account.linkedTickers.slice(0, 2).join(", ")})
                  </span>
                )}
              </div>
              {account.displayName !== `@${account.handle}` && (
                <p className="truncate text-[10px] text-muted">{account.displayName}</p>
              )}
            </div>

            {/* Toggle enable/disable */}
            <button
              onClick={() => onToggle(account.handle)}
              className={cn(
                "shrink-0 transition-colors",
                account.enabled ? "text-accent" : "text-muted",
              )}
              title={account.enabled ? "Disable" : "Enable"}
            >
              {account.enabled ? (
                <ToggleRight className="h-3.5 w-3.5" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              onClick={() => onRemove(account.handle)}
              className="shrink-0 text-muted opacity-0 transition-opacity hover:text-negative group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Saved account lists */}
      <div className="border-t border-border">
        <button
          onClick={() => setShowSaved((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-1.5"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Saved Lists
          </span>
          <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", showSaved && "rotate-180")} />
        </button>

        {showSaved && (
          <div className="pb-2">
            {savedLists.length === 0 && !showSaveInput && (
              <p className="px-3 py-1 text-[11px] text-muted">No saved lists</p>
            )}
            {savedLists.map((list) => (
              <div key={list.id} className="group flex items-center gap-1 px-3 py-1">
                <button
                  onClick={() => onLoadList(list)}
                  className="flex-1 truncate text-left text-[11px] text-foreground/80 hover:text-accent"
                >
                  <BookmarkCheck className="mr-1 inline h-3 w-3 text-muted" />
                  {list.name}
                  <span className="ml-1 text-muted">({list.handles.length})</span>
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
                  placeholder="List name…"
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
                disabled={accounts.length === 0}
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
