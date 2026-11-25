"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, Github, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EXTERNAL_LINK_PROPS, GITHUB_REPO } from "@/components/site/constants";
import {
  useAppMode,
  useCanBack,
  useCanForward,
  useViewRouter,
} from "@/lib/view-store";

export function Topbar() {
  const canBack = useCanBack();
  const canForward = useCanForward();
  const back = useViewRouter((s) => s.back);
  const forward = useViewRouter((s) => s.forward);
  const exitPlayer = useAppMode((s) => s.exitPlayer);

  return (
    <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go back"
          disabled={!canBack}
          onClick={back}
          className="size-8 rounded-full bg-white/5 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Go forward"
          disabled={!canForward}
          onClick={forward}
          className="size-8 rounded-full bg-white/5 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
          <Music2 className="size-4" aria-hidden="true" />
        </span>
        <span className="font-mono text-sm font-semibold">dhun</span>
        <Badge
          variant="outline"
          className="border-border/60 font-mono text-[10px] text-muted-foreground"
        >
          player
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild className="size-8 rounded-full">
          <a
            href={GITHUB_REPO}
            aria-label="dhun on GitHub"
            {...EXTERNAL_LINK_PROPS}
          >
            <Github className="size-4" aria-hidden="true" />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Back to site"
          onClick={exitPlayer}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Back to site</span>
        </Button>
      </div>
    </div>
  );
}
