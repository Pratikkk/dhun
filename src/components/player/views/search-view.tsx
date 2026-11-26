"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Pause, Play, Search, SearchX, WifiOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { songWord } from "@/lib/player-api";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import type { PlayerTrack, SearchResults } from "@/lib/player-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Art,
  CardGrid,
  CardGridSkeleton,
  CollectionCard,
  EmptyState,
  SectionHeader,
  TrackList,
  TrackListSkeleton,
  TrackMenu,
} from "@/components/player/primitives";

type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

/** Devices with a real pointer get autofocus; touch devices keep the
    keyboard closed until the user taps the field. */
function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(pointer: fine)");
    const update = () => setFine(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return fine;
}

const GENRES: { label: string; query: string; className: string }[] = [
  { label: "Bollywood", query: "Bollywood", className: "from-orange-600 to-neutral-900" },
  { label: "Punjabi", query: "Punjabi", className: "from-rose-600 to-neutral-900" },
  { label: "Lofi", query: "Lofi", className: "from-emerald-600 to-neutral-900" },
  { label: "Romantic", query: "Romantic", className: "from-red-500 to-neutral-900" },
  { label: "Hip Hop", query: "Hip Hop", className: "from-amber-500 to-neutral-900" },
  { label: "90s Bollywood", query: "90s Bollywood", className: "from-lime-600 to-neutral-900" },
  { label: "Party", query: "Party", className: "from-orange-500 to-neutral-900" },
  { label: "Devotional", query: "Devotional", className: "from-teal-600 to-neutral-900" },
  { label: "Workout", query: "Workout", className: "from-red-600 to-neutral-900" },
  { label: "Rock", query: "Rock", className: "from-emerald-700 to-neutral-900" },
  { label: "Ghazals", query: "Ghazals", className: "from-amber-600 to-neutral-900" },
  { label: "Sad", query: "Sad", className: "from-rose-800 to-neutral-900" },
];

/** Abortable search hitting the same endpoint as `searchAll`. */
async function fetchResults(q: string, signal: AbortSignal): Promise<SearchResults> {
  const res = await fetch(`/api/player/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!res.ok) {
    let message = `Search failed (HTTP ${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return (await res.json()) as SearchResults;
}

function TopResultCard({
  song,
  songs,
  contextLabel,
}: {
  song: PlayerTrack;
  songs: PlayerTrack[];
  contextLabel: string;
}) {
  const currentId = usePlayer((s) => s.current?.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);
  const active = currentId === song.id;

  const toggle = () => {
    if (active) {
      usePlayer.getState().playPause();
      return;
    }
    playContext(songs, 0, contextLabel);
  };

  return (
    <div className="group relative flex items-center gap-5 rounded-xl bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.08] sm:p-5">
      <div className="relative shrink-0">
        <Art
          src={song.image}
          alt={`Album art for ${song.album || song.title}`}
          seed={song.id}
          className="size-20 rounded-lg sm:size-24"
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={active ? `Toggle ${song.title}` : `Play ${song.title}`}
          className={cn(
            "absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            active
              ? "opacity-100"
              : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          )}
        >
          {active && isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold sm:text-xl">{song.title}</p>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {song.artists}
        </p>
        <Badge variant="secondary" className="mt-2 font-mono text-[10px]">
          Song
        </Badge>
      </div>

      <TrackMenu
        track={song}
        className="absolute right-2 top-2 rounded-full bg-black/40 text-foreground opacity-100 hover:bg-black/60 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      />
    </div>
  );
}

export function SearchView() {
  const push = useViewRouter((s) => s.push);
  const playContext = usePlayer((s) => s.playContext);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [resultQuery, setResultQuery] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const lastSearchedRef = useRef<string | null>(null);
  const finePointer = useFinePointer();

  /* Cancel any in-flight search when leaving the view. */
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const runSearch = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastSearchedRef.current = q;
    setStatus("loading");
    try {
      const data = await fetchResults(q, controller.signal);
      if (controller.signal.aborted) return;
      setResults(data);
      setResultQuery(q);
      const empty =
        data.songs.length === 0 &&
        data.albums.length === 0 &&
        data.playlists.length === 0;
      setStatus(empty ? "empty" : "success");
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setResults(null);
      setStatus("error");
    }
  }, []);

  /* Debounced search: 400ms after the last keystroke, unless Enter beat it. */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      abortRef.current?.abort();
      return;
    }
    const timer = window.setTimeout(() => {
      if (q !== lastSearchedRef.current) void runSearch(q);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const contextLabel = `Search · ${resultQuery}`;
  /* While the input is empty we show the browse grid, even if stale
     results are still in state. */
  const effectiveStatus: SearchStatus =
    query.trim().length < 1 ? "idle" : status;

  return (
    <div>
      <div className="relative mb-6">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            const q = e.currentTarget.value.trim();
            if (q.length >= 1) void runSearch(q);
          }}
          placeholder="What do you want to play?"
          aria-label="Search songs, albums and playlists"
          autoFocus={finePointer}
          inputMode="search"
          enterKeyHint="search"
          className="h-12 rounded-full border-border/50 bg-white/[0.06] pl-10 pr-11 text-base focus-visible:ring-primary"
        />
        {query.length > 0 ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute right-1 top-1/2 size-9 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {effectiveStatus === "idle" ? (
        <>
          <SectionHeader title="Browse all" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {GENRES.map((genre) => (
              <button
                key={genre.label}
                type="button"
                onClick={() => setQuery(genre.query)}
                className={cn(
                  "flex min-h-24 flex-col justify-between rounded-xl bg-gradient-to-br p-4 text-left font-semibold text-white shadow-lg transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  genre.className
                )}
              >
                <Music2
                  className="size-5 self-end opacity-70"
                  aria-hidden="true"
                />
                <span className="text-sm">{genre.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}

      {effectiveStatus === "loading" ? (
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Songs</h2>
            <TrackListSkeleton />
          </div>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Albums</h2>
            <CardGridSkeleton />
          </div>
        </div>
      ) : null}

      {effectiveStatus === "error" ? (
        <EmptyState
          icon={WifiOff}
          title="Search didn't respond"
          description="The search service couldn't be reached — try again in a moment."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const q = lastSearchedRef.current;
                if (q) void runSearch(q);
              }}
            >
              Retry
            </Button>
          }
        />
      ) : null}

      {effectiveStatus === "empty" ? (
        <EmptyState
          icon={SearchX}
          title={`No results for “${resultQuery}”`}
          description="Try a different spelling or a broader term."
        />
      ) : null}

      {effectiveStatus === "success" && results ? (
        <>
          {results.songs.length > 0 ? (
            <div className="mb-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <section className="min-w-0">
                <h2 className="mb-3 text-lg font-semibold">Top result</h2>
                <TopResultCard
                  song={results.songs[0]}
                  songs={results.songs}
                  contextLabel={contextLabel}
                />
              </section>
              <section className="min-w-0">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-lg font-semibold">Songs</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      playContext(results.songs, 0, contextLabel)
                    }
                    className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Play className="size-3.5 fill-current" aria-hidden="true" />
                    Play all
                  </Button>
                </div>
                <TrackList
                  tracks={results.songs.slice(0, 10)}
                  contextLabel={contextLabel}
                />
              </section>
            </div>
          ) : null}

          {results.albums.length > 0 ? (
            <section className="mb-8">
              <SectionHeader title="Albums" />
              <CardGrid>
                {results.albums.map((album) => (
                  <CollectionCard
                    key={album.id}
                    title={album.title}
                    subtitle={album.subtitle || `${album.songCount} ${songWord(album.songCount)}`}
                    image={album.image}
                    onClick={() =>
                      push({
                        name: "collection",
                        source: { kind: "album", id: album.id },
                      })
                    }
                  />
                ))}
              </CardGrid>
            </section>
          ) : null}

          {results.playlists.length > 0 ? (
            <section className="mb-8">
              <SectionHeader title="Playlists" />
              <CardGrid>
                {results.playlists.map((playlist) => (
                  <CollectionCard
                    key={playlist.id}
                    title={playlist.title}
                    subtitle={playlist.subtitle || `${playlist.songCount} ${songWord(playlist.songCount)}`}
                    image={playlist.image}
                    onClick={() =>
                      push({
                        name: "collection",
                        source: { kind: "playlist", id: playlist.id },
                      })
                    }
                  />
                ))}
              </CardGrid>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
