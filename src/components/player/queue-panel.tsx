"use client";

import { useEffect, useState } from "react";
import { Music2, X } from "lucide-react";
import { toast } from "sonner";
import { fmtTime } from "@/lib/player-api";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import type { PlayerTrack } from "@/lib/player-types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Art, EmptyState, Equalizer } from "@/components/player/primitives";

/** SSR-safe media query (defaults to false on the server). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function QueuePanelContent() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const queue = usePlayer((s) => s.queue);
  const contextTracks = usePlayer((s) => s.contextTracks);
  const contextLabel = usePlayer((s) => s.contextLabel);
  const order = usePlayer((s) => s.order);
  const orderPos = usePlayer((s) => s.orderPos);
  const clearQueue = usePlayer((s) => s.clearQueue);
  const removeFromQueue = usePlayer((s) => s.removeFromQueue);
  const playContext = usePlayer((s) => s.playContext);

  const upcoming: PlayerTrack[] = order
    .slice(orderPos + 1)
    .map((i) => contextTracks[i])
    .filter((t): t is PlayerTrack => Boolean(t))
    .slice(0, 30);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3.5">
        <h2 className="text-sm font-semibold">Queue</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={queue.length === 0}
          onClick={() => {
            clearQueue();
            toast.success("Queue cleared");
          }}
          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Clear
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-2">
        {!current ? (
          <EmptyState
            icon={Music2}
            title="Nothing playing"
            description="Pick a song and your queue shows up here."
          />
        ) : (
          <>
            <section className="mb-4">
              <SectionLabel>Now playing</SectionLabel>
              <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                <Art
                  src={current.image}
                  alt={`Album art for ${current.album || current.title}`}
                  seed={current.id}
                  className="size-10 rounded-md"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-primary">{current.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {current.artists}
                  </p>
                </div>
                {isPlaying ? <Equalizer className="mr-1" /> : null}
              </div>
            </section>

            {queue.length > 0 ? (
              <section className="mb-4">
                <SectionLabel>Next in queue</SectionLabel>
                {queue.map((track, i) => (
                  <div
                    key={`${track.id}-${i}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <Art
                      src={track.image}
                      alt={`Album art for ${track.album || track.title}`}
                      seed={track.id}
                      className="size-10 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{track.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.artists}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${track.title} from queue`}
                      onClick={() => removeFromQueue(i)}
                      className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </section>
            ) : null}

            {upcoming.length > 0 ? (
              <section className="mb-4">
                <SectionLabel>{`Next from: ${contextLabel ?? "up next"}`}</SectionLabel>
                {upcoming.map((track, i) => (
                  <button
                    key={`${track.id}-${i}`}
                    type="button"
                    onClick={() => {
                      const idx = contextTracks.findIndex(
                        (t) => t.id === track.id
                      );
                      if (idx >= 0) {
                        playContext(
                          contextTracks,
                          idx,
                          contextLabel ?? undefined
                        );
                      }
                    }}
                    aria-label={`Play ${track.title}`}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="w-10 shrink-0 text-center font-mono text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{track.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {track.artists}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {fmtTime(track.duration)}
                    </span>
                  </button>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function QueuePanel() {
  const queueOpen = useViewRouter((s) => s.queueOpen);
  const setQueueOpen = useViewRouter((s) => s.setQueueOpen);
  const isXl = useMediaQuery("(min-width: 1280px)");

  if (isXl) {
    if (!queueOpen) return null;
    return (
      <aside
        aria-label="Play queue"
        className="hidden w-80 shrink-0 flex-col overflow-hidden rounded-xl bg-card xl:flex"
      >
        <QueuePanelContent />
      </aside>
    );
  }

  return (
    <Sheet open={queueOpen && !isXl} onOpenChange={setQueueOpen}>
      <SheetContent
        side="right"
        aria-describedby={undefined}
        className="w-[85vw] border-border/60 bg-card p-0 sm:max-w-sm"
      >
        <SheetTitle className="sr-only">Queue</SheetTitle>
        <QueuePanelContent />
      </SheetContent>
    </Sheet>
  );
}
