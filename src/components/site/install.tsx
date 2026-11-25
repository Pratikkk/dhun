"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Github } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CopyCommand } from "@/components/site/copy-command";
import { SectionHeading } from "@/components/site/section-heading";
import {
  EXTERNAL_LINK_PROPS,
  GITHUB_REPO,
  GITHUB_REPO_LABEL,
  INSTALL_COMMAND,
} from "@/components/site/constants";

export function Install() {
  return (
    <section id="install" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="// install"
          title="One pip command. That's the install."
          description="dhun installs one way: pip pulls the package straight from the GitHub repository. No cloning, no PyPI release, no extra steps — the repo is the source of truth."
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl"
        >
          <Card className="border-border/80 bg-card/70 p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Github className="size-4.5 text-primary" />
                <h3 className="font-mono text-sm font-medium">
                  Install from GitHub with pip
                </h3>
              </div>
              <a
                href={GITHUB_REPO}
                {...EXTERNAL_LINK_PROPS}
                className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {GITHUB_REPO_LABEL}
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>

            <CopyCommand
              command={INSTALL_COMMAND}
              label="Install command copied"
            />

            <p className="mt-5 border-t border-border/70 pt-4 text-xs leading-relaxed text-muted-foreground">
              Prerequisites: Python 3.9 or newer with pip. Works the same on
              Windows, macOS and Linux. If <code className="font-mono">pip</code>{" "}
              isn&rsquo;t on your PATH, swap it for{" "}
              <code className="font-mono">python3&nbsp;-m&nbsp;pip</code> in the
              command above.
            </p>
          </Card>

          <div className="mt-6 space-y-2">
            <p className="text-sm text-muted-foreground">
              Verify it landed, then start searching:
            </p>
            <CopyCommand
              command='dhun --version && dhun search "kesariya"'
              label="Verification command copied"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
