"use client";

import { useState } from "react";
import {
  ListMusic,
  Loader2,
  Maximize2,
  Music2,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import { fmtTime } from "@/lib/player-api";
import {
  Art,
  Equalizer,
  LikeButton,
  TrackMenu,
} from "@/components/player/primitives";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

/* ------------------------------------------------------------------ */
/* Shared scrub bar                                                    */
/* ------------------------------------------------------------------ */

export function SeekSlider() {
  const [scrub, setScrub] = useState<number | null>(null);
  const current = usePlayer((s) => s.current);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const seek = usePlayer((s) => s.seek);

  const max = Math.max(duration || current?.duration || 0, 1);

  return (
    <Slider
      aria-label="Seek position"
      value={[Math.floor(scrub ?? position)]}
      max={max}
      step={1}
      disabled={!current}
      onValueChange={(v) => setScrub(v[0] ?? 0)}
      onValueCommit={(v) => {
        seek(v[0] ?? 0);
        setScrub(null);
      }}
      className="w-full cursor-pointer **:data-[slot=slider-thumb]:size-3 **:data-[slot=slider-track]:h-1"
    />
  );
}

/* ------------------------------------------------------------------ */
/* Player bar                                                          */
/* ------------------------------------------------------------------ */

export function PlayerBar() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isLoading = usePlayer((s) => s.isLoading);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);

  const playPause = usePlayer((s) => s.playPause);
  const next = usePlayer((s) => s.next);
  const prev = usePlayer((s) => s.prev);
  const seek = usePlayer((s) => s.seek);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);

  const queueOpen = useViewRouter((s) => s.queueOpen);
  const setQueueOpen = useViewRouter((s) => s.setQueueOpen);
  const setNowPlayingOpen = useViewRouter((s) => s.setNowPlayingOpen);

  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const total = duration || current?.duration || 0;
  const pct = total > 0 ? Math.min(100, (position / total) * 100) : 0;

  return (
    <footer className="shrink-0 border-t border-border/60 bg-background">
      {/* Desktop */}
      <div className="hidden h-20 items-center gap-4 px-4 sm:h-24 sm:px-6 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
        {/* Now playing summary */}
        <div className="flex min-w-0 items-center gap-1">
          {current ? (
            <>
              <button
                type="button"
                onClick={() => setNowPlayingOpen(true)}
                aria-label="Open now playing"
                className="flex min-w-0 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Art
                  src={current.image}
                  alt={`Album art for ${current.album || current.title}`}
                  seed={current.id}
                  className="size-12 rounded-md sm:size-14"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {current.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {current.artists}
                  </span>
                </span>
              </button>
              <LikeButton track={current} />
            </>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <Music2 className="size-4 shrink-0" aria-hidden="true" />
              <span>Pick a song to start</span>
            </div>
          )}
        </div>

        {/* Transport + seek */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle shuffle"
              onClick={toggleShuffle}
              className={cn(
                "size-8 rounded-full text-muted-foreground",
                shuffle && "text-primary hover:text-primary"
              )}
            >
              <Shuffle className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous track"
              onClick={() => prev()}
              className="size-8 rounded-full text-muted-foreground"
            >
              <SkipBack className="size-4 fill-current" />
            </Button>
            <Button
              size="icon"
              aria-label={isPlaying ? "Pause" : "Play"}
              onClick={playPause}
              className="size-10 rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next track"
              onClick={() => next()}
              className="size-8 rounded-full text-muted-foreground"
            >
              <SkipForward className="size-4 fill-current" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle repeat"
              onClick={cycleRepeat}
              className={cn(
                "size-8 rounded-full text-muted-foreground",
                repeat !== "off" && "text-primary hover:text-primary"
              )}
            >
              {repeat === "one" ? (
                <Repeat1 className="size-4" />
              ) : (
                <Repeat className="size-4" />
              )}
            </Button>
          </div>
          <div className="flex w-full max-w-2xl items-center gap-2.5">
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-muted-foreground">
              {fmtTime(position)}
            </span>
            <SeekSlider />
            <span className="w-10 shrink-0 font-mono text-[11px] text-muted-foreground">
              {fmtTime(total)}
            </span>
          </div>
        </div>

        {/* Queue, volume, expand */}
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle queue"
            onClick={() => setQueueOpen(!queueOpen)}
            className={cn(
              "size-8 rounded-full text-muted-foreground",
              queueOpen && "text-primary hover:text-primary"
            )}
          >
            <ListMusic className="size-4" />
          </Button>
          <div className="hidden items-center gap-1.5 lg:flex">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle mute"
              onClick={toggleMute}
              className="size-8 rounded-full text-muted-foreground"
            >
              <VolumeIcon className="size-4" />
            </Button>
            <Slider
              aria-label="Volume"
              className="w-20 shrink-0"
              value={[Math.round(volume * 100)]}
              max={100}
              step={1}
              onValueChange={(v) => setVolume((v[0] ?? 0) / 100)}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open now playing"
            onClick={() => setNowPlayingOpen(true)}
            className="size-8 rounded-full text-muted-foreground"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile */}
      <div className="relative pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* Tap-to-seek progress bar with a generous invisible hit area */}
        <button
          type="button"
          aria-label="Seek — tap to jump"
          disabled={!current}
          onPointerDown={(e) => {
            if (!current) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.min(
              1,
              Math.max(0, (e.clientX - rect.left) / rect.width)
            );
            seek(ratio * (duration || current.duration || 0));
          }}
          className="group block w-full touch-none py-2.5"
        >
          <span
            aria-hidden="true"
            className="relative mx-3 block h-1 rounded-full bg-white/10"
          >
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-primary"
              style={{ width: `${pct}%` }}
            />
            {/* Thumb becomes visible/enlarged while pressed */}
            <span
              className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-active:opacity-100"
              style={{ left: `${pct}%` }}
            />
          </span>
        </button>
        <div className="flex items-center gap-1 px-2 pb-1">
          <button
            type="button"
            onClick={() => setNowPlayingOpen(true)}
            aria-label="Open now playing"
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-white/5"
          >
            {current ? (
              <Art
                src={current.image}
                alt={`Album art for ${current.album || current.title}`}
                seed={current.id}
                className="size-12 rounded-md"
              />
            ) : (
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-white/10">
                <Music2
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </span>
            )}
            <span className="min-w-0 flex-1">
              {current ? (
                <span className="block truncate text-sm font-medium">
                  {current.title}
                </span>
              ) : (
                <span className="block truncate text-sm text-muted-foreground">
                  Nothing playing
                </span>
              )}
              {current ? (
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {current.artists}
                </span>
              ) : null}
            </span>
            {current && isPlaying ? (
              <Equalizer className="ml-auto shrink-0" />
            ) : null}
          </button>
          {current && !isPlaying ? (
            <TrackMenu track={current} className="shrink-0" />
          ) : null}
          <Button
            size="icon"
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={playPause}
            className="size-11 shrink-0 rounded-full bg-foreground text-background"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="size-5 fill-current" />
            ) : (
              <Play className="size-5 fill-current" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next track"
            onClick={() => next()}
            className="size-11 shrink-0 rounded-full text-muted-foreground"
          >
            <SkipForward className="size-5 fill-current" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open queue"
            onClick={() => setQueueOpen(!queueOpen)}
            className={cn(
              "size-11 shrink-0 rounded-full text-muted-foreground",
              queueOpen && "text-primary"
            )}
          >
            <ListMusic className="size-5" />
          </Button>
        </div>
      </div>
    </footer>
  );
}
