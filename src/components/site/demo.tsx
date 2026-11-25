"use client";

import { useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  Download,
  Music4,
  Pause,
  Play,
  RotateCcw,
  Search,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SectionHeading } from "@/components/site/section-heading";
import type { SaavnSong } from "@/lib/saavn";

type Status = "idle" | "loading" | "success" | "empty" | "error";

const SUGGESTIONS = [
  "Kesariya",
  "Tum Hi Ho",
  "Apna Bana Le",
  "Pasoori",
  "Raatan Lambiyan",
  "Jhoome Jo Pathaan",
];

const QUALITIES = [
  { value: "320", hint: "best quality · ~10 MB" },
  { value: "160", hint: "balanced · ~5 MB" },
  { value: "96", hint: "smallest · ~3 MB" },
] as const;

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "–:––";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Equalizer() {
  return (
    <span
      className="flex h-3.5 items-end gap-[2px]"
      aria-label="Now playing"
      role="img"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar h-full w-[3px] rounded-[1px] bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function SongRow({
  song,
  playing,
  onTogglePlay,
  onDownload,
}: {
  song: SaavnSong;
  playing: boolean;
  onTogglePlay: (song: SaavnSong) => void;
  onDownload: (song: SaavnSong, quality: "96" | "160" | "320") => void;
}) {
  return (
    <li className="group flex items-center gap-3 border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-accent/40 sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={() => onTogglePlay(song)}
        aria-label={playing ? `Pause ${song.title}` : `Preview ${song.title}`}
        className="relative size-12 shrink-0 overflow-hidden rounded-md"
      >
        <img
          src={song.image}
          alt={`Album art for ${song.album || song.title}`}
          className="size-full object-cover"
          loading="lazy"
        />
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/55 transition-opacity ${
            playing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {playing ? (
            <Pause className="size-4 text-white" />
          ) : (
            <Play className="size-4 fill-white text-white" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{song.title}</p>
          {playing && <Equalizer />}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {song.artists}
        </p>
      </div>

      <div className="hidden w-44 shrink-0 md:block">
        <p className="truncate text-xs text-muted-foreground">
          {song.album || "—"}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">
          {song.year || "—"} · {song.language || "—"}
        </p>
      </div>

      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {formatDuration(song.duration)}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 px-2.5"
            aria-label={`Download ${song.title}`}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Get</span>
            <ChevronDown className="size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-mono text-xs text-muted-foreground">
            {song.title.length > 26
              ? `${song.title.slice(0, 26)}…`
              : song.title}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {QUALITIES.map((q) => (
            <DropdownMenuItem
              key={q.value}
              onClick={() =>
                onDownload(song, q.value as "96" | "160" | "320")
              }
              className="gap-3"
            >
              <span className="font-mono text-xs font-semibold text-primary">
                {q.value}k
              </span>
              <span className="text-xs">{q.hint}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function SkeletonRows() {
  return (
    <ul aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <li
          key={i}
          className="flex items-center gap-4 border-b border-border/50 px-4 py-3 last:border-0 sm:px-5"
        >
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <div className="hidden w-44 space-y-2 md:block">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </li>
      ))}
    </ul>
  );
}

export function Demo() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [songs, setSongs] = useState<SaavnSong[]>([]);
  const [searchMeta, setSearchMeta] = useState<{
    count: number;
    ms: number;
    query: string;
  } | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const doSearch = async (raw: string) => {
    const q = raw.trim();
    if (!q || status === "loading") return;

    setQuery(q);
    setStatus("loading");
    setPlayingId(null);
    audioRef.current?.pause();
    const started = performance.now();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? `Search failed (HTTP ${res.status})`);
      }
      const found: SaavnSong[] = data.songs ?? [];
      setSongs(found);
      setSearchMeta({ count: found.length, ms: Math.round(performance.now() - started), query: q });
      setSearchedQuery(q);
      setStatus(found.length === 0 ? "empty" : "success");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong searching."
      );
      setStatus("error");
    }
  };

  const previewUrl = (song: SaavnSong) =>
    `/api/download?u=${encodeURIComponent(
      song.downloadUrl
    )}&q=96&inline=1&name=${encodeURIComponent(song.title)}`;

  const togglePlay = (song: SaavnSong) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === song.id) {
      if (audio.paused) {
        void audio.play().catch(() => {
          toast.error("Playback was blocked by the browser");
          setPlayingId(null);
        });
      } else {
        audio.pause();
        setPlayingId(null);
      }
      return;
    }

    audio.src = previewUrl(song);
    audio.load();
    void audio
      .play()
      .then(() => setPlayingId(song.id))
      .catch(() => {
        toast.error("Couldn't start the preview", {
          description: "This track's CDN stream may be unavailable — try downloading instead.",
        });
        setPlayingId(null);
      });
  };

  const download = (song: SaavnSong, quality: "96" | "160" | "320") => {
    const url = `/api/download?u=${encodeURIComponent(
      song.downloadUrl
    )}&q=${quality}&name=${encodeURIComponent(
      `${song.title} — ${song.artists}`
    )}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success(`Downloading ${song.title}`, {
      description: `${quality} kbps · .m4a — straight from JioSaavn's CDN`,
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void doSearch(query);
  };

  return (
    <section id="demo" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="// live demo"
          title="Try dhun's search engine right here"
          description="The exact JioSaavn query engine that powers the CLI, wired into this page. Search a song, preview it, take the file — nothing is stored on any server."
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <Card className="overflow-hidden border-border/80 bg-card/70 p-0 shadow-lg shadow-black/20">
            {/* card chrome */}
            <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5 sm:px-5">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                dhun/web — search
              </span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-emerald-400/90">
                <span className="dot-pulse size-1.5 rounded-full bg-emerald-400" />
                jiosaavn · connected
              </span>
            </div>

            {/* search form */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-3 border-b border-border/70 px-4 py-4 sm:px-5"
            >
              <span
                aria-hidden="true"
                className="select-none font-mono text-sm text-primary"
              >
                ❯
              </span>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='search a song — try "kesariya"'
                aria-label="Search JioSaavn songs"
                className="h-9 flex-1 border-0 bg-transparent font-mono text-sm shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
              />
              <Button
                type="submit"
                size="sm"
                disabled={status === "loading" || query.trim().length === 0}
              >
                {status === "loading" ? (
                  <>
                    <span
                      className="mr-1 inline-block size-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                      aria-hidden="true"
                    />
                    Searching
                  </>
                ) : (
                  <>
                    <Search className="size-3.5" />
                    Search
                  </>
                )}
              </Button>
            </form>

            {/* suggestion chips */}
            <div className="flex flex-wrap gap-2 border-b border-border/70 px-4 py-3 sm:px-5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void doSearch(s)}
                  className="rounded-full border border-border bg-background/50 px-3 py-1 font-mono text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* results */}
            <div className="max-h-[460px] overflow-y-auto scrollbar-thin">
              {status === "idle" && (
                <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                  <div className="flex size-12 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
                    <Music4 className="size-5" />
                  </div>
                  <p className="font-mono text-sm text-muted-foreground">
                    results render here
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    press Enter or pick a suggestion above
                  </p>
                </div>
              )}

              {status === "loading" && <SkeletonRows />}

              {status === "success" && (
                <ul>
                  {songs.map((song) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      playing={playingId === song.id}
                      onTogglePlay={togglePlay}
                      onDownload={download}
                    />
                  ))}
                </ul>
              )}

              {status === "empty" && (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
                  <Search className="size-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No results for{" "}
                    <span className="font-mono text-foreground">
                      &ldquo;{searchedQuery}&rdquo;
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    try a different spelling or a shorter query
                  </p>
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
                  <div className="flex size-11 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive">
                    <WifiOff className="size-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Couldn&rsquo;t reach JioSaavn from this network.
                  </p>
                  <p className="max-w-sm font-mono text-xs text-muted-foreground/70">
                    {error}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void doSearch(searchedQuery || query)}
                  >
                    <RotateCcw className="size-3.5" />
                    Retry
                  </Button>
                </div>
              )}
            </div>

            {/* status bar */}
            <div className="flex items-center justify-between border-t border-border/70 px-4 py-2 font-mono text-[11px] text-muted-foreground/80 sm:px-5">
              <span>
                {status === "success" || status === "empty"
                  ? `${searchMeta?.count ?? 0} results · ${searchMeta?.ms ?? 0} ms`
                  : status === "loading"
                    ? "searching…"
                    : "waiting for input"}
              </span>
              <span className="hidden sm:inline">
                preview 96k · downloads up to 320k
              </span>
            </div>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground/80">
            Streams are proxied live from JioSaavn&rsquo;s CDN — files land
            directly in your downloads folder, nothing touches this server&rsquo;s
            disk.
          </p>
        </motion.div>
      </div>

      <audio ref={audioRef} preload="none" className="hidden" onEnded={() => setPlayingId(null)} />
    </section>
  );
}
