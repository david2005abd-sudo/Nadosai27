"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ar } from "@/messages/ar";
import { btnIconBare } from "@/components/ui/styles";
import { cn } from "@/lib/utils";

export type ThemeChoice = "dark" | "light" | "system";

const STORAGE_KEY = "nados-theme";

type ThemeListener = () => void;
const listeners = new Set<ThemeListener>();
let cachedChoice: ThemeChoice | null = null;

function readStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "system") return stored;
  } catch {
    void 0;
  }
  return "dark";
}

function getSnapshot(): ThemeChoice {
  if (cachedChoice === null) cachedChoice = readStoredTheme();
  return cachedChoice;
}

function getServerSnapshot(): ThemeChoice {
  return "dark";
}

function subscribe(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function resolveTheme(choice: ThemeChoice): "dark" | "light" {
  if (choice === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return choice;
}

export function applyTheme(choice: ThemeChoice): void {
  cachedChoice = choice;
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    void 0;
  }
  document.documentElement.setAttribute("data-theme", resolveTheme(choice));
  for (const listener of listeners) listener();
}

export function ThemeToggleButton() {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLight = choice === "light";

  return (
    <button
      type="button"
      className={btnIconBare}
      onClick={() => applyTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? ar.app.settings.themeDark : ar.app.settings.themeLight}
      title={isLight ? ar.app.settings.themeDark : ar.app.settings.themeLight}
    >
      {isLight ? <Moon size={18} aria-hidden /> : <Sun size={18} aria-hidden />}
    </button>
  );
}

export function ThemeSwitch({ size = "md" }: { size?: "md" | "sm" }) {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const options: { value: ThemeChoice; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: ar.app.settings.themeDark, icon: <Moon size={16} aria-hidden /> },
    { value: "light", label: ar.app.settings.themeLight, icon: <Sun size={16} aria-hidden /> },
    {
      value: "system",
      label: ar.app.settings.themeSystem,
      icon: <Monitor size={16} aria-hidden />,
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={ar.app.settings.appearance}
      className={cn(
        "inline-flex rounded-lg border border-edge bg-surface",
        size === "sm" && "text-sm",
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={choice === option.value}
          onClick={() => applyTheme(option.value)}
          className={cn(
            "inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-3 font-medium transition-colors",
            choice === option.value
              ? "bg-accent text-accent-ink"
              : "text-ink-2 hover:bg-raised hover:text-ink",
          )}
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}
