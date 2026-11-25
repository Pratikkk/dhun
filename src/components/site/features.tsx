"use client";

import { motion } from "framer-motion";
import {
  AudioWaveform,
  Disc3,
  MonitorPlay,
  Search,
  SquareTerminal,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/site/section-heading";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: AudioWaveform,
    title: "Studio-grade audio",
    description:
      "Pull tracks exactly as JioSaavn serves them — up to 320 kbps AAC with zero transcoding. What the pros stream is what lands on your disk.",
  },
  {
    icon: Search,
    title: "Instant search",
    description:
      "Fuzzy search across millions of songs, albums and artists with results in under 300 ms, even on hotel Wi-Fi.",
  },
  {
    icon: Disc3,
    title: "Albums & playlists",
    description:
      "Paste any JioSaavn link and dhun grabs the whole thing — tracks numbered, ordered and tagged like a proper release.",
  },
  {
    icon: Tags,
    title: "Metadata baked in",
    description:
      "Title, artists, album, year and cover art are written straight into the file as it downloads. No post-processing, no extra tools.",
  },
  {
    icon: MonitorPlay,
    title: "Stream before you save",
    description:
      "Not sure it's the right mix? Preview any track inline with dhun stream, then decide if it's worth the disk space.",
  },
  {
    icon: SquareTerminal,
    title: "Just Python",
    description:
      "One pip command installs it on Windows, macOS and Linux. No Electron, no bloat, no telemetry — a clean Python package that does its job.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="// features"
          title="Everything the app does, minus the app"
          description="dhun wraps JioSaavn's entire catalogue behind a keyboard-first interface that gets out of your way."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
            >
              <Card className="group h-full border-border/80 bg-card/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <feature.icon className="size-5" />
                  </div>
                  <h3 className="text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
