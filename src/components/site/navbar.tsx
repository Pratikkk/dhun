"use client";

import { useEffect, useState } from "react";
import { Download, Github, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DhunLogo } from "@/components/site/logo";
import {
  EXTERNAL_LINK_PROPS,
  GITHUB_REPO,
} from "@/components/site/constants";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#demo", label: "Live demo" },
  { href: "#install", label: "Install" },
  { href: "#commands", label: "Commands" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || menuOpen
          ? "border-b border-border/80 bg-background/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2.5"
          aria-label="dhun — back to top"
        >
          <DhunLogo className="size-7" />
          <span className="font-mono text-lg font-semibold tracking-tight">
            dhun
          </span>
          <span className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            CLI
          </span>
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <a
              href={GITHUB_REPO}
              {...EXTERNAL_LINK_PROPS}
              aria-label="dhun on GitHub"
            >
              <Github className="size-4.5" />
            </a>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <a href="#install">
              <Download className="size-3.5" />
              Get dhun
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#install"
              onClick={() => setMenuOpen(false)}
              className="mt-1 rounded-md bg-primary px-3 py-2.5 text-center text-sm font-medium text-primary-foreground"
            >
              Get dhun
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
