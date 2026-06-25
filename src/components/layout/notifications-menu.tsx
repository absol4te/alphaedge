"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, TrendingUp, TrendingDown, Newspaper, CalendarClock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notif {
  id: string;
  icon: typeof Bell;
  iconClass: string;
  title: string;
  body: string;
  time: string;
  href?: string;
}

const SEED: Notif[] = [
  {
    id: "n1",
    icon: TrendingUp,
    iconClass: "bg-positive/15 text-positive",
    title: "NVDA price alert",
    body: "NVIDIA crossed above your $200 target.",
    time: "2m ago",
    href: "/company/NVDA?ex=NASDAQ",
  },
  {
    id: "n2",
    icon: Newspaper,
    iconClass: "bg-info/15 text-info",
    title: "Breaking — Apple",
    body: "Apple reportedly accelerates foldable iPhone timeline.",
    time: "18m ago",
    href: "/company/AAPL?ex=NASDAQ",
  },
  {
    id: "n3",
    icon: CalendarClock,
    iconClass: "bg-warning/15 text-warning",
    title: "Earnings tomorrow",
    body: "NVDA reports after market close.",
    time: "1h ago",
    href: "/company/NVDA?ex=NASDAQ",
  },
  {
    id: "n4",
    icon: TrendingDown,
    iconClass: "bg-negative/15 text-negative",
    title: "TSLA watchlist mover",
    body: "Tesla is down 2.9% on the session.",
    time: "3h ago",
    href: "/company/TSLA?ex=NASDAQ",
  },
];

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const unread = SEED.filter((n) => !read.has(n.id)).length;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-card",
          open ? "bg-card text-foreground" : "text-muted hover:text-foreground",
        )}
        title="Notifications"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-black">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 animate-fade-in overflow-hidden rounded-xl border border-border bg-card shadow-premium">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => setRead(new Set(SEED.map((n) => n.id)))}
                className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {SEED.map((n) => {
              const isRead = read.has(n.id);
              const Inner = (
                <div
                  className={cn(
                    "flex gap-3 px-3.5 py-3 transition-colors hover:bg-surface",
                    !isRead && "bg-accent/[0.04]",
                  )}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", n.iconClass)}>
                    <n.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{n.title}</span>
                      {!isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                    <span className="mt-0.5 block text-[10px] text-muted">{n.time}</span>
                  </div>
                </div>
              );
              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    setRead((s) => new Set(s).add(n.id));
                    setOpen(false);
                  }}
                  className="block"
                >
                  {Inner}
                </Link>
              ) : (
                <div key={n.id}>{Inner}</div>
              );
            })}
          </div>

          <Link
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-3.5 py-2.5 text-center text-xs font-medium text-muted hover:text-foreground"
          >
            Manage alerts in Watchlist
          </Link>
        </div>
      )}
    </div>
  );
}
