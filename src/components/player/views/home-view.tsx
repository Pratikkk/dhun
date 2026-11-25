"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Heart, History, Music2, Play, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHome, gradientFor, songWord } from "@/lib/player-api";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import type { HomeData } from "@/lib/player-types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CardGrid,
  CardGridSkeleton,
  CollectionCard,
  EmptyState,
  SectionHeader,
  TrackCard,
} from "@/components/player/primitives";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function QuickTile({
  tile,
  label,
  count,
  onClick,
}: {
  tile: ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 overflow-hidden rounded-lg bg-white/[0.06] pr-4 text-left transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {tile}
      <span className="min-w-0 py-2">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">
          {count} {songWord(count)}
        </span>
      </span>
    </button>
  );
}

export function HomeView() {
  const push = useViewRouter((s) => s.push);
  const liked = usePlayer((s) => s.liked);
  const recent = usePlayer((s) => s.recent);
  const playlists = usePlayer((s) => s.playlists);
  const playContext = usePlayer((s) => s.playContext);

  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getHome()
      .then((home) => {
        if (cancelled) return;
        setData(home);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "The home feed didn't respond — check your connection."
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setNonce((n) => n + 1);
  };

  if (error) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Couldn't load home"
        description={error}
        action={
          <Button variant="outline" size="sm" onClick={retry}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting()}
      </h1>

      {loading ? (
        <>
          <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                aria-hidden="true"
                className="flex items-center gap-3 overflow-hidden rounded-lg bg-white/[0.03] pr-4"
              >
                <Skeleton className="size-12 shrink-0 rounded-none" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          {[0, 1].map((i) => (
            <div key={i} className="mb-8">
              <Skeleton className="mb-4 h-6 w-48" />
              <CardGridSkeleton />
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {liked.length > 0 ? (
              <QuickTile
                onClick={() =>
                  push({ name: "collection", source: { kind: "liked" } })
                }
                tile={
                  <span className="grid size-12 shrink-0 place-items-center bg-gradient-to-br from-rose-500 to-red-700 text-white">
                    <Heart className="size-5 fill-current" aria-hidden="true" />
                  </span>
                }
                label="Liked Songs"
                count={liked.length}
              />
            ) : null}

            {recent.length > 0 ? (
              <QuickTile
                onClick={() =>
                  push({ name: "collection", source: { kind: "recent" } })
                }
                tile={
                  <span className="grid size-12 shrink-0 place-items-center bg-white/10 text-foreground">
                    <History className="size-5" aria-hidden="true" />
                  </span>
                }
                label="Recently played"
                count={recent.length}
              />
            ) : null}

            {playlists.slice(0, 4).map((p) => (
              <QuickTile
                key={p.id}
                onClick={() =>
                  push({
                    name: "collection",
                    source: { kind: "user", id: p.id },
                  })
                }
                tile={
                  <span
                    className={cn(
                      "grid size-12 shrink-0 place-items-center bg-gradient-to-br text-white",
                      gradientFor(p.id)
                    )}
                  >
                    <Music2 className="size-5" aria-hidden="true" />
                  </span>
                }
                label={p.name}
                count={p.tracks.length}
              />
            ))}
          </div>

          {data?.sections.map((section) => (
            <section key={`${section.label}-${section.query}`} className="mb-8">
              <SectionHeader
                title={section.label}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => playContext(section.tracks, 0, section.label)}
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                    Play all
                  </Button>
                }
              />
              <CardGrid>
                {section.tracks.slice(0, 12).map((track, i) => (
                  <TrackCard
                    key={`${track.id}-${i}`}
                    track={track}
                    context={section.tracks}
                    contextLabel={section.label}
                  />
                ))}
              </CardGrid>
            </section>
          ))}

          {data && data.playlists.length > 0 ? (
            <section className="mb-8">
              <SectionHeader title="Trending playlists on JioSaavn" />
              <CardGrid>
                {data.playlists.map((p) => (
                  <CollectionCard
                    key={p.id}
                    title={p.title}
                    subtitle={p.subtitle || `${p.songCount} ${songWord(p.songCount)}`}
                    image={p.image}
                    onClick={() =>
                      push({
                        name: "collection",
                        source: { kind: "playlist", id: p.id },
                      })
                    }
                  />
                ))}
              </CardGrid>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
