"use client";

import { useEffect, useState } from "react";

/**
 * Self-playing terminal that loops a "search → download" session.
 * Purely cosmetic — it just makes the hero feel alive.
 */

type ScriptLine =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string; tone: "muted" | "green" | "white" }
  | { kind: "row"; active?: boolean; index: string; title: string; meta: string }
  | { kind: "gap" }
  | { kind: "bar" }
  | { kind: "bar-done" };

const BAR_CELLS = 28;

const SCRIPT: ScriptLine[] = [
  { kind: "cmd", text: 'dhun search "kesariya"' },
  { kind: "out", text: "searching jiosaavn… 12 results · 0.21s", tone: "muted" },
  { kind: "gap" },
  {
    kind: "row",
    active: true,
    index: "1",
    title: "Kesariya",
    meta: "Arijit Singh · Brahmastra",
  },
  {
    kind: "row",
    index: "2",
    title: "Kesariya (Lofi Flip)",
    meta: "VIBIE · Lofi Flip",
  },
  {
    kind: "row",
    index: "3",
    title: "Kesariya (Remix)",
    meta: "DJ Chetas · Brahmastra",
  },
  { kind: "gap" },
  { kind: "cmd", text: "dhun download kesariya -q 320" },
  {
    kind: "out",
    text: "Kesariya — Arijit Singh · Brahmastra · 2022",
    tone: "white",
  },
  { kind: "bar" },
  { kind: "out", text: "saved  ~/Music/dhun/Kesariya [320kbps].m4a", tone: "green" },
];

function BarCells({ filled }: { filled: number }) {
  return (
    <span className="inline-flex h-3 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: BAR_CELLS }).map((_, i) => (
        <span
          key={i}
          className={`h-full w-[5px] rounded-[1px] ${
            i < filled ? "bg-primary" : "bg-muted-foreground/20"
          }`}
        />
      ))}
    </span>
  );
}

function TerminalLine({ line }: { line: ScriptLine }) {
  switch (line.kind) {
    case "cmd":
      return (
        <div>
          <span className="select-none text-primary">$ </span>
          <span className="text-foreground">{line.text}</span>
        </div>
      );
    case "out":
      if (line.tone === "green") {
        return (
          <div>
            <span className="select-none text-emerald-400">✓ </span>
            <span className="text-emerald-400/90">{line.text}</span>
          </div>
        );
      }
      return (
        <div className={line.tone === "muted" ? "text-muted-foreground" : "text-foreground/90"}>
          {line.text}
        </div>
      );
    case "row":
      return (
        <div className="flex items-baseline gap-2">
          <span
            className={`w-4 select-none text-right ${
              line.active ? "text-primary" : "text-muted-foreground/50"
            }`}
          >
            {line.active ? ">" : ""}
          </span>
          <span className="w-4 shrink-0 select-none text-right text-muted-foreground/70">
            {line.index}.
          </span>
          <span
            className={`shrink-0 ${
              line.active ? "text-foreground" : "text-foreground/70"
            }`}
          >
            {line.title}
          </span>
          <span className="min-w-0 truncate text-muted-foreground">
            · {line.meta}
          </span>
        </div>
      );
    case "gap":
      return <div className="h-2" />;
    case "bar-done":
      return (
        <div className="flex items-center gap-3">
          <BarCells filled={BAR_CELLS} />
          <span className="text-muted-foreground">100% · 10.4 MB · 2.1s</span>
        </div>
      );
    case "bar":
      return null;
  }
}

export function Terminal() {
  const [done, setDone] = useState<ScriptLine[]>([]);
  const [typing, setTyping] = useState("");
  const [liveBar, setLiveBar] = useState(-1);

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      await sleep(700);
      while (!cancelled) {
        setDone([]);
        setTyping("");
        setLiveBar(-1);

        for (const line of SCRIPT) {
          if (cancelled) return;

          if (line.kind === "cmd") {
            for (let i = 1; i <= line.text.length; i++) {
              if (cancelled) return;
              setTyping(line.text.slice(0, i));
              await sleep(22 + Math.random() * 40);
            }
            await sleep(280);
            setDone((prev) => [...prev, line]);
            setTyping("");
          } else if (line.kind === "bar") {
            for (let p = 0; p <= BAR_CELLS; p++) {
              if (cancelled) return;
              setLiveBar(p);
              await sleep(55);
            }
            await sleep(220);
            setLiveBar(-1);
            setDone((prev) => [...prev, { kind: "bar-done" } as ScriptLine]);
          } else {
            await sleep(line.kind === "gap" ? 150 : 200);
            setDone((prev) => [...prev, line]);
          }
        }

        await sleep(4200);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border bg-[#121013] shadow-2xl shadow-black/40"
      role="img"
      aria-label="Animated terminal demo: dhun search and download a song"
    >
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-[#171419]/80 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-[#FF5F57]" />
        <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="size-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-2 font-mono text-xs text-muted-foreground">
          zsh — dhun
        </span>
        <span className="ml-auto hidden items-center gap-1.5 font-mono text-[10px] text-emerald-400/80 sm:flex">
          <span className="dot-pulse size-1.5 rounded-full bg-emerald-400" />
          live
        </span>
      </div>

      {/* terminal body */}
      <div className="h-[352px] overflow-hidden p-4 font-mono text-[12.5px] leading-[1.9] sm:h-[368px] sm:p-5 sm:text-[13px]">
        {done.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}

        {/* in-progress command line with caret */}
        {typing !== "" && (
          <div>
            <span className="select-none text-primary">$ </span>
            <span className="text-foreground">{typing}</span>
            <span className="terminal-caret" />
          </div>
        )}

        {/* in-progress progress bar */}
        {liveBar >= 0 && (
          <div className="flex items-center gap-3">
            <BarCells filled={liveBar} />
            <span className="text-muted-foreground">
              {Math.round((liveBar / BAR_CELLS) * 100)}%
            </span>
          </div>
        )}

        {/* idle caret between cycles */}
        {typing === "" && liveBar < 0 && (
          <div>
            <span className="select-none text-primary">$ </span>
            <span className="terminal-caret" />
          </div>
        )}
      </div>
    </div>
  );
}
