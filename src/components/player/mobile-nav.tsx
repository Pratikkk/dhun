"use client";

import { House, Library, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentView, useViewRouter } from "@/lib/view-store";

const NAV_ITEMS = [
  { name: "home", label: "Home", icon: House },
  { name: "search", label: "Search", icon: Search },
  { name: "library", label: "Library", icon: Library },
] as const;

export function MobileNav() {
  const view = useCurrentView();
  const push = useViewRouter((s) => s.push);

  return (
    <nav
      aria-label="Player menu"
      className="flex shrink-0 border-t border-border/60 bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = view.name === item.name;
        return (
          <button
            key={item.name}
            type="button"
            onClick={() => push({ name: item.name })}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5" aria-hidden="true" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
