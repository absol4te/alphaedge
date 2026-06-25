"use client";

import { useState } from "react";
import { User, Bell, Palette, Shield, CreditCard, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/store/theme";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "security", label: "Security", icon: Shield },
  { key: "billing", label: "Billing", icon: CreditCard },
];

export default function SettingsPage() {
  const [section, setSection] = useState("profile");
  const theme = useTheme((s) => s.theme);
  const setTheme = useTheme((s) => s.setTheme);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <h1 className="mb-5 text-2xl font-bold tracking-tight">Settings</h1>
      <div className="grid gap-5 md:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                section === s.key ? "bg-accent/10 text-accent" : "text-muted hover:bg-card hover:text-foreground",
              )}
            >
              <s.icon className="h-4 w-4" /> {s.label}
            </button>
          ))}
        </nav>

        <Card>
          <CardContent className="p-5">
            {section === "profile" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gradient text-xl font-bold text-black">
                    VP
                  </div>
                  <div>
                    <div className="text-lg font-semibold">V. Petrov</div>
                    <div className="text-sm text-muted">mr.v.n.petrov@gmail.com</div>
                  </div>
                </div>
                <Field label="Display name" value="V. Petrov" />
                <Field label="Email" value="mr.v.n.petrov@gmail.com" />
                <Field label="Base currency" value="USD ($)" />
              </div>
            )}
            {section === "appearance" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Theme</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-left transition-colors",
                      theme === "dark" ? "border-accent" : "border-border hover:border-[#3a3a3a]",
                    )}
                    style={{ backgroundColor: "#0A0A0A" }}
                  >
                    <div className="mb-2 h-12 rounded-lg" style={{ backgroundColor: "#1A1A1A" }} />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                      {theme === "dark" && <Check className="h-4 w-4 text-accent" />} Dark (Terminal)
                    </div>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-4 text-left transition-colors",
                      theme === "light" ? "border-accent" : "border-border hover:border-[#cbd0d8]",
                    )}
                    style={{ backgroundColor: "#F4F5F7" }}
                  >
                    <div className="mb-2 h-12 rounded-lg bg-white shadow-sm" />
                    <div className="flex items-center gap-1.5 text-sm font-medium text-black">
                      {theme === "light" && <Check className="h-4 w-4 text-accent" />} Light
                    </div>
                  </button>
                </div>
                <div>
                  <h3 className="mb-2 mt-4 text-sm font-semibold">Accent color</h3>
                  <div className="flex gap-2">
                    {["#00C853", "#3B82F6", "#A855F7", "#FFB020", "#FF3B5C"].map((c) => (
                      <button
                        key={c}
                        className={cn("h-8 w-8 rounded-full", c === "#00C853" && "ring-2 ring-white ring-offset-2 ring-offset-card")}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {section === "notifications" && (
              <div className="space-y-3">
                {["Price alerts", "Breaking news", "Earnings reminders", "Watchlist movers", "Weekly digest"].map(
                  (n, i) => (
                    <label key={n} className="flex items-center justify-between rounded-lg bg-surface px-4 py-3 text-sm">
                      {n}
                      <input type="checkbox" defaultChecked={i < 3} className="accent-[#00C853]" />
                    </label>
                  ),
                )}
              </div>
            )}
            {(section === "security" || section === "billing") && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-3 h-8 w-8 text-muted" />
                <p className="text-sm text-muted">This section is a placeholder in the demo build.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-muted">{label}</label>
      <input
        defaultValue={value}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-accent/50 focus:outline-none"
      />
    </div>
  );
}
