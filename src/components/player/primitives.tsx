"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import {
  Disc3,
  Heart,
  ListEnd,
  ListPlus,
  ListStart,
  MoreHorizontal,
  Music2,
  Pause,
  Play,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import { fmtTime, gradientFor } from "@/lib/player-api";
import type { PlayerTrack } from "@/lib/player-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/* Artwork                                                             */
/* ------------------------------------------------------------------ */

export function Art({
  src,
  alt,
  seed,
  className,
}: {
  src?: string | null;
  alt: string;
  seed?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-gradient-to-br",
        gradientFor(seed ?? alt),
        !showImg && "flex items-center justify-center",
        className
      )}
    >
      {showImg ? (
        <img
          src={src ?? ""}
          alt={alt}
          loading="lazy"
          draggable={false}
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Music2 className="size-1/3 text-white/60" aria-hidden="true" />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small shared bits                                                   */
/* ------------------------------------------------------------------ */

export function Equalizer({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex h-3 items-end gap-[2px]", className)}
      role="img"
      aria-label="Playing"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="eq-bar h-full w-[2.5px] rounded-[1px] bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

export function SectionHeader({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
          {title}
        </h2>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <CardGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-white/[0.03] p-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="mt-3 h-3.5 w-4/5" />
          <Skeleton className="mt-2 h-3 w-3/5" />
        </div>
      ))}
    </CardGrid>
  );
}

export function TrackListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 sm:px-3">
          <Skeleton className="size-11 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="hidden h-3 w-24 lg:block" />
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Like button                                                         */
/* ------------------------------------------------------------------ */

export function LikeButton({
  track,
  className,
}: {
  track: PlayerTrack;
  className?: string;
}) {
  const liked = usePlayer((s) => s.liked.some((t) => t.id === track.id));
  const toggleLike = usePlayer((s) => s.toggleLike);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        liked
          ? `Remove ${track.title} from liked songs`
          : `Save ${track.title} to liked songs`
      }
      onClick={(e: MouseEvent) => {
        e.stopPropagation();
        toggleLike(track);
      }}
      className={cn(
        "size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground",
        liked && "text-primary hover:text-primary",
        className
      )}
    >
      <Heart className={cn("size-4", liked && "fill-primary")} />
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* New playlist dialog                                                 */
/* ------------------------------------------------------------------ */

export function NewPlaylistDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the new playlist id. */
  onCreated?: (id: string) => void;
}) {
  const createPlaylist = usePlayer((s) => s.createPlaylist);
  const [name, setName] = useState("");

  const submit = () => {
    const id = createPlaylist(name.trim() || "My playlist");
    setName("");
    onOpenChange(false);
    onCreated?.(id);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setName("");
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create playlist</DialogTitle>
          <DialogDescription>
            Give your playlist a name — it lives in this browser only.
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My playlist"
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Track context menu (row overflow)                                   */
/* ------------------------------------------------------------------ */

export function TrackMenu({
  track,
  className,
}: {
  track: PlayerTrack;
  className?: string;
}) {
  const addToQueue = usePlayer((s) => s.addToQueue);
  const playNext = usePlayer((s) => s.playNext);
  const toggleLike = usePlayer((s) => s.toggleLike);
  const liked = usePlayer((s) => s.liked.some((t) => t.id === track.id));
  const playlists = usePlayer((s) => s.playlists);
  const addToPlaylist = usePlayer((s) => s.addToPlaylist);
  const push = useViewRouter((s) => s.push);
  const [newOpen, setNewOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`More options for ${track.title}`}
            onClick={(e: MouseEvent) => e.stopPropagation()}
            className={cn(
              "size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground",
              className
            )}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52"
          onClick={(e: MouseEvent) => e.stopPropagation()}
        >
          <DropdownMenuItem onClick={() => playNext(track)}>
            <ListStart aria-hidden="true" /> Play next
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => addToQueue(track)}>
            <ListEnd aria-hidden="true" /> Add to queue
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toggleLike(track)}>
            <Heart
              aria-hidden="true"
              className={cn(liked && "fill-primary text-primary")}
            />
            {liked ? "Remove from liked" : "Save to liked songs"}
          </DropdownMenuItem>
          {track.albumId ? (
            <DropdownMenuItem
              onClick={() =>
                push({
                  name: "collection",
                  source: { kind: "album", id: track.albumId as string },
                })
              }
            >
              <Disc3 aria-hidden="true" /> Go to album
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListPlus aria-hidden="true" /> Add to playlist
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="max-h-64 w-48 overflow-y-auto scrollbar-thin">
                <DropdownMenuItem onClick={() => setNewOpen(true)}>
                  <Plus aria-hidden="true" /> New playlist
                </DropdownMenuItem>
                {playlists.length > 0 ? <DropdownMenuSeparator /> : null}
                {playlists.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => {
                      addToPlaylist(p.id, track);
                      toast.success(`Added to ${p.name}`, {
                        description: track.title,
                      });
                    }}
                  >
                    <span className="truncate">{p.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <NewPlaylistDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) => {
          addToPlaylist(id, track);
          toast.success("Playlist created", {
            description: `Added ${track.title}`,
          });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Track row + list                                                    */
/* ------------------------------------------------------------------ */

export function TrackRow({
  track,
  context,
  contextLabel,
  index,
  showAlbum = true,
  showIndex = false,
  onRemove,
}: {
  track: PlayerTrack;
  /** the list this row belongs to — clicking plays it in this context */
  context: PlayerTrack[];
  contextLabel?: string | null;
  index: number;
  showAlbum?: boolean;
  showIndex?: boolean;
  onRemove?: (track: PlayerTrack) => void;
}) {
  const active = usePlayer((s) => s.current?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);

  const play = () => {
    if (active) {
      usePlayer.getState().playPause();
      return;
    }
    const idx = context.findIndex((t) => t.id === track.id);
    playContext(context, idx < 0 ? 0 : idx, contextLabel);
  };

  return (
    <li className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.06] sm:px-3">
      {showIndex ? (
        <button
          type="button"
          onClick={play}
          aria-label={active ? `Toggle ${track.title}` : `Play ${track.title}`}
          className="relative flex size-10 shrink-0 items-center justify-center"
        >
          {active ? (
            isPlaying ? (
              <Equalizer className="group-hover:hidden" />
            ) : (
              <span className="font-mono text-sm text-primary group-hover:hidden">
                {index + 1}
              </span>
            )
          ) : (
            <span className="font-mono text-sm text-muted-foreground group-hover:hidden">
              {index + 1}
            </span>
          )}
          <Play className="hidden size-3.5 fill-current text-foreground group-hover:block" />
        </button>
      ) : (
        <button
          type="button"
          onClick={play}
          aria-label={active ? `Toggle ${track.title}` : `Play ${track.title}`}
          className="relative size-11 shrink-0"
        >
          <Art
            src={track.image}
            alt={`Album art for ${track.album || track.title}`}
            seed={track.id}
            className="size-11 rounded-md"
          />
          <span className="absolute inset-0 hidden items-center justify-center rounded-md bg-black/55 group-hover:flex">
            {active && isPlaying ? (
              <Pause className="size-4 fill-white text-white" />
            ) : (
              <Play className="size-4 fill-white text-white" />
            )}
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={play}
        className="min-w-0 flex-1 text-left"
        title={track.title}
      >
        <span
          className={cn(
            "block truncate text-sm font-medium",
            active ? "text-primary" : "text-foreground"
          )}
        >
          {track.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {track.artists}
        </span>
      </button>

      {showAlbum ? (
        <span
          className="hidden w-40 shrink-0 truncate text-xs text-muted-foreground lg:block"
          title={track.album}
        >
          {track.album}
        </span>
      ) : null}

      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {fmtTime(track.duration)}
      </span>

      <LikeButton
        track={track}
        className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      />
      <TrackMenu
        track={track}
        className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
      />

      {onRemove ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Remove ${track.title} from this list`}
          onClick={(e: MouseEvent) => {
            e.stopPropagation();
            onRemove(track);
          }}
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </li>
  );
}

export function TrackList({
  tracks,
  contextLabel,
  showAlbum = true,
  showIndex = false,
  onRemove,
  className,
}: {
  tracks: PlayerTrack[];
  contextLabel?: string | null;
  showAlbum?: boolean;
  showIndex?: boolean;
  onRemove?: (track: PlayerTrack) => void;
  className?: string;
}) {
  if (tracks.length === 0) {
    return (
      <EmptyState
        icon={Music2}
        title="Nothing here yet"
        description="Songs you play will show up here."
      />
    );
  }
  return (
    <ul role="list" className={cn("flex flex-col", className)}>
      {tracks.map((track, i) => (
        <TrackRow
          key={`${track.id}-${i}`}
          track={track}
          context={tracks}
          contextLabel={contextLabel}
          index={i}
          showAlbum={showAlbum}
          showIndex={showIndex}
          onRemove={onRemove}
        />
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

export function TrackCard({
  track,
  context,
  contextLabel,
}: {
  track: PlayerTrack;
  context: PlayerTrack[];
  contextLabel?: string | null;
}) {
  const active = usePlayer((s) => s.current?.id === track.id);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const playContext = usePlayer((s) => s.playContext);

  const play = () => {
    if (active) {
      usePlayer.getState().playPausePause();
      return;
    }
    const idx = context.findIndex((t) => t.id === track.id);
    playContext(context, idx < 0 ? 0 : idx, contextLabel);
  };

  return (
    <button
      type="button"
      onClick={play}
      className="group w-full rounded-xl bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative mb-3">
        <Art
          src={track.image}
          alt={`Album art for ${track.album || track.title}`}
          seed={track.id}
          className="aspect-square w-full rounded-lg"
        />
        <span
          className={cn(
            "absolute bottom-2 right-2 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-200",
            active
              ? "translate-y-0 opacity-100"
              : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          )}
          aria-hidden="true"
        >
          {active && isPlaying ? (
            <Pause className="size-4 fill-current" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
        </span>
      </div>
      <p className={cn("truncate text-sm font-medium", active && "text-primary")}>
        {track.title}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {track.artists}
      </p>
    </button>
  );
}

export function CollectionCard({
  title,
  subtitle,
  image,
  onClick,
  seed,
}: {
  title: string;
  subtitle: string;
  image: string;
  onClick: () => void;
  seed?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full rounded-xl bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Art
        src={image}
        alt={title}
        seed={seed ?? title}
        className="mb-3 aspect-square w-full rounded-lg"
      />
      <p className="truncate text-sm font-medium">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {subtitle}
      </p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Big play button (collection headers)                                */
/* ------------------------------------------------------------------ */

export function BigPlayButton({
  playing,
  onClick,
  label,
  className,
}: {
  playing: boolean;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="icon"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "size-12 rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-105 sm:size-14",
        className
      )}
    >
      {playing ? (
        <Pause className="size-5 fill-current" />
      ) : (
        <Play className="size-5 fill-current" />
      )}
    </Button>
  );
}
