"use client";

import { useEffect, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import {
  ChevronDown,
  Loader2,
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
import { fmtTime, gradientFor } from "@/lib/player-api";
import {
  Art,
  EmptyState,
  LikeButton,
  TrackMenu,
} from "@/components/player/primitives";
import { SeekSlider } from "@/components/player/player-bar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export function NowPlaying() {
  const open = useViewRouter((s) => s.nowPlayingOpen);
  const setNowPlayingOpen = useViewRouter((s) => s.setNowPlayingOpen);

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
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const cycleRepeat = usePlayer((s) => s.cycleRepeat);
  const setVolume = usePlayer((s) => s.setVolume);
  const toggleMute = usePlayer((s) => s.toggleMute);

  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const nextTrack = usePlayer(
    (s) =>
      s.queue[0] ??
      (s.orderPos < s.order.length - 1
        ? (s.contextTracks[s.order[s.orderPos + 1]] ?? null)
        : null)
  );

  /* Swipe-down dismiss: enough distance or a fast flick. */
  const onDragEnd = (_e: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 800) {
      setNowPlayingOpen(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNowPlayingOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setNowPlayingOpen]);

  const VolumeIcon =
    muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="now-playing"
          role="dialog"
          aria-label="Now playing"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.7 }}
          onDragEnd={onDragEnd}
          className="fixed inset-0 z-50 touch-pan-y"
        >
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              gradientFor(current?.id ?? "dhun")
            )}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-black/45" aria-hidden="true" />

          <div className="relative mx-auto flex h-full w-full max-w-2xl flex-col px-4 pb-8 pt-2 sm:px-8 sm:pt-4">
            {/* Top row — drag here (or the grabber) to swipe the sheet away */}
            <div
              className="flex shrink-0 touch-none flex-col"
              onPointerDown={(e) => dragControls.start(e)}
            >
              {/* Grabber affordance (mobile) */}
              <span
                aria-hidden="true"
                className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-white/30 sm:hidden"
              />
              <div className="flex items-center gap-2">
                <div className="flex w-11 justify-start">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Close now playing"
                    onClick={() => setNowPlayingOpen(false)}
                    className="size-11 rounded-full text-white/80 hover:text-white"
                  >
                    <ChevronDown className="size-6" />
                  </Button>
                </div>
                <span className="flex-1 text-center font-mono text-[11px] uppercase tracking-widest text-white/70">
                  Now playing
                </span>
                <div className="flex w-11 justify-end">
                  {current ? (
                    <TrackMenu
                      track={current}
                      className="text-white/70 hover:text-white"
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {current ? (
              <>
                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto scrollbar-thin overscroll-contain"
                >
                  <div className="flex min-h-full flex-col justify-center gap-6 py-4">
                    <motion.div
                      animate={{ scale: isPlaying ? 1 : 0.98 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full"
                    >
                      <Art
                        src={current.image}
                        alt={`Album art for ${current.album || current.title}`}
                        seed={current.id}
                        className="mx-auto aspect-square w-full max-w-[min(65vh,22rem)] rounded-2xl shadow-2xl"
                      />
                    </motion.div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-bold">
                          {current.title}
                        </p>
                        <p className="mt-1 truncate text-sm text-white/70">
                          {current.artists}
                        </p>
                      </div>
                      <LikeButton
                        track={current}
                        className="size-10 text-white/80 hover:text-white"
                      />
                    </div>

                    <div>
                      <SeekSlider />
                      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-white/70">
                        <span>{fmtTime(position)}</span>
                        <span>
                          {fmtTime(duration || current.duration || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2 sm:justify-center sm:gap-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle shuffle"
                        onClick={toggleShuffle}
                        className={cn(
                          "size-11 rounded-full text-white/80 hover:text-white",
                          shuffle && "text-primary hover:text-primary"
                        )}
                      >
                        <Shuffle className="size-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Previous track"
                        onClick={() => prev()}
                        className="size-12 rounded-full text-white/90 hover:text-white"
                      >
                        <SkipBack className="size-6 fill-current" />
                      </Button>
                      <Button
                        size="icon"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        onClick={playPause}
                        className="size-[4.5rem] rounded-full bg-white text-black shadow-xl transition-transform hover:scale-105"
                      >
                        {isLoading ? (
                          <Loader2 className="size-7 animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="size-7 fill-current" />
                        ) : (
                          <Play className="size-7 fill-current" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Next track"
                        onClick={() => next()}
                        className="size-12 rounded-full text-white/90 hover:text-white"
                      >
                        <SkipForward className="size-6 fill-current" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Toggle repeat"
                        onClick={cycleRepeat}
                        className={cn(
                          "size-11 rounded-full text-white/80 hover:text-white",
                          repeat !== "off" && "text-primary hover:text-primary"
                        )}
                      >
                        {repeat === "one" ? (
                          <Repeat1 className="size-5" />
                        ) : (
                          <Repeat className="size-5" />
                        )}
                      </Button>
                    </div>

                    {/* Volume — phones use hardware buttons; shown on
                        tablets and desktop-narrow windows */}
                    <div className="hidden items-center justify-center gap-2 sm:flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={muted ? "Unmute" : "Mute"}
                        onClick={toggleMute}
                        className="size-10 rounded-full text-white/80 hover:text-white"
                      >
                        <VolumeIcon className="size-5" />
                      </Button>
                      <Slider
                        aria-label="Volume"
                        className="w-40"
                        value={[Math.round(volume * 100)]}
                        max={100}
                        step={1}
                        onValueChange={(v) => setVolume((v[0] ?? 0) / 100)}
                      />
                    </div>
                  </div>
                </div>

                {nextTrack ? (
                  /* Hidden on phones — the controls must never be crowded;
                     the queue is still reachable from the track menu. */
                  <div className="hidden shrink-0 pt-2 sm:block">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-white/60">
                      Next up
                    </p>
                    <button
                      type="button"
                      onClick={() => next()}
                      aria-label="Skip to next track"
                      className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-3 text-left transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                    >
                      <Art
                        src={nextTrack.image}
                        alt={`Album art for ${
                          nextTrack.album || nextTrack.title
                        }`}
                        seed={nextTrack.id}
                        className="size-11 rounded-md"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">
                          {nextTrack.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-white/70">
                          {nextTrack.artists}
                        </span>
                      </span>
                      <SkipForward
                        className="ml-auto size-4 shrink-0 text-white/70"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  icon={Music2}
                  title="Nothing playing"
                  description="Choose a song from home or search."
                />
              </div>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
