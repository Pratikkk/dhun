"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";

interface CommandDoc {
  name: string;
  args: string;
  description: string;
  example: string;
}

const COMMANDS: CommandDoc[] = [
  {
    name: "search",
    args: "<query> [-n 20]",
    description:
      "Fuzzy-search songs and pick from an interactive, keyboard-driven list.",
    example: 'dhun search "kesariya" -n 20',
  },
  {
    name: "download",
    args: "<query|url> [-q 320] [-o DIR]",
    description:
      "Download the top match or any song URL at your chosen quality, fully tagged.",
    example: "dhun dl kesariya -q 320 -o ~/Music",
  },
  {
    name: "stream",
    args: "<query>",
    description:
      "Buffer and play instantly in the terminal — nothing written to disk.",
    example: 'dhun stream "tum hi ho"',
  },
  {
    name: "album",
    args: "<url>",
    description:
      "Grab a full album in track order, files numbered like a proper release.",
    example: "dhun album https://jiosaavn.com/album/brahmastra/xq4v9ZFC9iA",
  },
  {
    name: "playlist",
    args: "<url> [--concurrent 4]",
    description:
      "Same as album, for playlists and mixes — parallel downloads included.",
    example: "dhun playlist https://jiosaavn.com/featured/… --concurrent 4",
  },
  {
    name: "lyrics",
    args: "<query>",
    description:
      "Print a track's lyrics to your terminal, synced where available.",
    example: 'dhun lyrics "apna bana le"',
  },
  {
    name: "trending",
    args: "[--city mumbai]",
    description:
      "See what India is listening to right now, then download it in one keystroke.",
    example: "dhun trending --city mumbai",
  },
  {
    name: "config",
    args: "set <key> <value>",
    description:
      "Set defaults once — quality, music folder, filename template — and forget it.",
    example: "dhun config set quality 320",
  },
];

function CommandCard({ command, index }: { command: CommandDoc; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: (index % 2) * 0.08 }}
    >
      <Card className="h-full border-border/80 bg-card/70 transition-colors hover:border-primary/40">
        <CardContent className="p-5">
          <p className="font-mono text-sm">
            <span className="text-muted-foreground">dhun </span>
            <span className="font-semibold text-primary">{command.name}</span>
            <span className="text-muted-foreground"> {command.args}</span>
          </p>
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {command.description}
          </p>
          <p className="mt-4 truncate rounded-md border border-border/70 bg-background/60 px-3 py-2 font-mono text-xs text-muted-foreground">
            <span className="select-none text-primary/70">$ </span>
            {command.example}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Commands() {
  return (
    <section id="commands" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="// commands"
          title="Eight commands. That's the whole app."
          description="dhun is designed to be learned in a coffee break — every command does one thing, and does it well."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {COMMANDS.map((command, i) => (
            <CommandCard key={command.name} command={command} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
