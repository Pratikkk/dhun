"use client";

import { motion } from "framer-motion";
import { Music4, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyCommand } from "@/components/site/copy-command";
import {
  EXTERNAL_LINK_PROPS,
  GITHUB_REPO,
  INSTALL_COMMAND,
} from "@/components/site/constants";
import { useAppMode } from "@/lib/view-store";

export function Cta() {
  const openPlayer = useAppMode((s) => s.openPlayer);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-border bg-card/70 px-6 py-14 text-center sm:px-12 sm:py-16"
        >
          {/* backdrop */}
          <div
            aria-hidden="true"
            className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black_20%,transparent_75%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-primary/15 blur-[100px]"
          />

          <div className="relative">
            <p className="mb-3 font-mono text-sm text-primary">
              {"// one last push"}
            </p>
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your terminal was a music player all along.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
              Install it, search something you love, and hear the difference a
              keyboard-first workflow makes. The first song takes ten seconds.
            </p>

            <div className="mx-auto mt-8 max-w-md">
              <CopyCommand
                command={INSTALL_COMMAND}
                label="Install command copied"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <a href="#install">Get started</a>
              </Button>
              <Button size="lg" variant="outline" onClick={() => openPlayer()}>
                <Music4 className="size-4" />
                Open the web player
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a
                  href={GITHUB_REPO}
                  {...EXTERNAL_LINK_PROPS}
                  aria-label="Star dhun on GitHub"
                >
                  <Star className="size-4" />
                  Star on GitHub
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
