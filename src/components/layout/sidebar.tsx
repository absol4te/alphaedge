"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Star,
  CandlestickChart,
  FileScan,
  FileSpreadsheet,
  Settings,
  TrendingUp,
  Newspaper,
  BadgeDollarSign,
  Microscope,
  Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/tracker", label: "Tracker", icon: Radio },
  { href: "/research", label: "Research", icon: Microscope },
  { href: "/earnings", label: "Earnings", icon: BadgeDollarSign },
  { href: "/search", label: "Search", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/charts", label: "Charts", icon: CandlestickChart },
  { href: "/documents", label: "Documents", icon: FileScan },
  { href: "/statements", label: "Financials", icon: FileSpreadsheet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[68px] shrink-0 flex-col items-center border-r border-border bg-surface py-4 md:flex lg:w-[220px] lg:items-stretch lg:px-3">
      {/* Brand */}
      <Link href="/" className="mb-6 flex items-center gap-2 px-0 lg:px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-gradient shadow-glow-sm">
          <TrendingUp className="h-5 w-5 text-black" strokeWidth={2.5} />
        </div>
        <span className="hidden text-lg font-bold tracking-tight lg:inline">
          Alpha<span className="text-accent">Edge</span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors lg:justify-start",
                "justify-center",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-card hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="hidden lg:inline">{label}</span>
              {active && (
                <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-accent lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        title="Settings"
        className={cn(
          "flex items-center justify-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-card hover:text-foreground lg:justify-start",
        )}
      >
        <Settings className="h-5 w-5 shrink-0" strokeWidth={2} />
        <span className="hidden lg:inline">Settings</span>
      </Link>
    </aside>
  );
}
