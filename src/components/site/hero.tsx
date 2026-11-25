"use client";

import { motion } from "framer-motion";
import { Gauge, Laptop, Play, ShieldCheck, SquareTerminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyCommand } from "@/components/site/copy-command";
import { Terminal } from "@/components/site/terminal";
import { INSTALL_COMMAND } from "@/components/site/constants";

const HIGHLIGHTS = [
  { icon: Gauge, label: "320 kbps max audio" },
  { icon: ShieldCheck, label: "No account, no ads" },
  { icon: Laptop, label: "Windows · macOS · Linux" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-28 sm:pt-32 lg:pb-24">
      {/* backdrop: grid + glow */}
      <div
        aria-hidden="true"
        className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_35%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
        {/* left column */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 py-1 pl-1.5 pr-3.5 font-mono text-xs text-muted-foreground">
            <span className="dot-pulse size-1.5 rounded-full bg-primary" />
            v2.4.0 — playlists &amp; queue sync are here
          </div>

          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Every song on JioSaavn.{" "}
            <span className="text-primary">One command away.</span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            dhun is a tiny terminal app that searches, previews and downloads
            music from JioSaavn — up to 320 kbps, cover art and tags baked in.
            No account. No ads. No browser.
          </p>

          <div className="mt-8 max-w-md">
            <CopyCommand command={INSTALL_COMMAND} label="Install command copied" />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <a href="#demo">
                <Play className="size-4" />
                Try the live demo
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#commands">
                <SquareTerminal className="size-4" />
                See the commands
              </a>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {HIGHLIGHTS.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="size-4 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* right column — animated terminal */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
          className="relative"
        >
          <div
            aria-hidden="true"
            className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl"
          />
          <div className="relative">
            <Terminal />
            <p className="mt-4 text-center font-mono text-xs text-muted-foreground/80">
              pure Python · installs with pip · MIT licensed
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
