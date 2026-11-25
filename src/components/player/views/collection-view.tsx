"use client";

import { useEffect, useState } from "react";
import { ListEnd, Music2, Shuffle, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";
import { useCurrentView, type CollectionSource } from "@/lib/view-store";
import { collectionMeta, getCollection, songWord } from "@/lib/player-api";
import type { CollectionDetail, PlayerTrack } from "@/lib/player-types";
import {
  Art,
  BigPlayButton,
  EmptyState,
  TrackList,
  TrackListSkeleton,
} from "@/components/player/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DetailState {
  /** which request this state belongs to ("kind:id:attempt") */
  key: string;
  data: CollectionDetail | null;
  error: string | null;
}

/** Fetches album/playlist detail with loading, error and retry support. */
function useCollectionDetail(
  kind: "album" | "playlist" | null,
  id: string | null
) {
  const [attempt, setAttempt] = useState(0);
  const key = kind && id ? `${kind}:${id}:${attempt}` : "";
  const [state, setState] = useState<DetailState>({
    key: "",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (!kind || !id) return;
    let cancelled = false;
    getCollection(kind, id)
      .then((data) => {
        if (!cancelled) setState({ key, data, error: null });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setState({ key, data: null, error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [kind, id, key]);

  /* State from a previous request counts as "loading" for the current one. */
  const current = state.key === key;
  return {
    data: current ? state.data : null,
    loading: !current || (state.data === null && state.error === null),
    error: current ? state.error : null,
    retry: () => setAttempt((n) => n + 1),
  };
}

function CollectionBody({ source }: { source: CollectionSource }) {
  const isFetched = source.kind === "album" || source.kind === "playlist";

  const detail = useCollectionDetail(
    source.kind === "album" || source.kind === "playlist" ? source.kind : null,
    source.kind === "album" || source.kind === "playlist" ? source.id : null
  );
  const liked = usePlayer((s) => s.liked);
  const recent = usePlayer((s) => s.recent);
  const playlists = usePlayer((s) => s.playlists);

  /* Resolve view data (pure derivation, no hooks). */
  let tracks: PlayerTrack[] = [];
  let title = "";
  let subtitle = "";
  let image = "";
  let year = "";
  let description: string | undefined;
  let notFound = false;

  if (isFetched) {
    if (detail.data) {
      tracks = detail.data.tracks;
      title = detail.data.title;
      subtitle = detail.data.subtitle;
      image = detail.data.image;
      year = detail.data.year;
      description = detail.data.description;
    }
  } else if (source.kind === "liked") {
    tracks = liked;
    title = "Liked Songs";
    subtitle = "Songs you loved";
    image = liked[0]?.image ?? "";
  } else if (source.kind === "recent") {
    tracks = recent;
    title = "Recently played";
    subtitle = "Your latest spins";
    image = recent[0]?.image ?? "";
  } else {
    const playlist = playlists.find((p) => p.id === source.id);
    if (!playlist) {
      notFound = true;
    } else {
      tracks = playlist.tracks;
      title = playlist.name;
      subtitle = "Your playlist";
      image = playlist.tracks[0]?.image ?? "";
    }
  }

  /* Hooks below depend on the resolved title — the hook count is stable
     because `title` is derived deterministically before them. */
  const isThisPlaying = usePlayer(
    (s) => s.isPlaying && s.contextLabel === title
  );
  const shuffle = usePlayer((s) => s.shuffle);
  const toggleShuffle = usePlayer((s) => s.toggleShuffle);
  const playContext = usePlayer((s) => s.playContext);
  const playPause = usePlayer((s) => s.playPause);
  const removeFromPlaylist = usePlayer((s) => s.removeFromPlaylist);

  const userId = source.kind === "user" ? source.id : null;
  const kindLabel =
    source.kind === "album"
      ? "Album"
      : source.kind === "playlist" || source.kind === "user"
        ? "Playlist"
        : "Collection";
  const meta = [
    subtitle,
    year,
    tracks.length > 0 ? collectionMeta(tracks.length, tracks) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const emptyDescription =
    source.kind === "liked"
      ? "Tap the heart on any song to save it here."
      : source.kind === "recent"
        ? "Play something and it will show up here."
        : source.kind === "user"
          ? "Add songs from any track menu to build this playlist."
          : "This collection has no songs yet.";

  if (notFound) {
    return (
      <EmptyState
        icon={Music2}
        title="Playlist not found"
        description="This playlist doesn&rsquo;t exist in this browser anymore."
      />
    );
  }

  if (isFetched && detail.error) {
    return (
      <EmptyState
        icon={WifiOff}
        title="Couldn&rsquo;t load this collection"
        description={detail.error}
        action={
          <Button variant="outline" onClick={detail.retry}>
            Retry
          </Button>
        }
      />
    );
  }

  if (isFetched && detail.loading) {
    return (
      <div>
        <div className="relative mb-2 overflow-hidden rounded-t-xl">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.09] to-transparent"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 px-0 pb-4 pt-2 sm:flex-row sm:items-end sm:gap-6 sm:pb-6">
            <Skeleton className="aspect-square w-32 rounded-lg sm:w-44 lg:w-52" />
            <div className="min-w-0 flex-1 space-y-3 py-1 sm:py-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-9 w-3/4 sm:h-11" />
              <Skeleton className="h-3.5 w-1/2" />
            </div>
          </div>
        </div>
        <div className="py-3">
          <Skeleton className="size-12 rounded-full sm:size-14" />
        </div>
        <TrackListSkeleton />
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative mb-2 overflow-hidden rounded-t-xl">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.09] to-transparent"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 px-0 pb-4 pt-2 sm:flex-row sm:items-end sm:gap-6 sm:pb-6">
          <Art
            src={image}
            alt={title}
            seed={title}
            className="aspect-square w-32 rounded-lg shadow-2xl sm:w-44 lg:w-52"
          />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {kindLabel}
            </p>
            <h1 className="mt-1 break-words text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {meta ? (
              <p className="mt-2 text-sm text-muted-foreground">{meta}</p>
            ) : null}
            {description ? (
              <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-muted-foreground/90">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Action bar */}
      {tracks.length > 0 ? (
        <div className="flex items-center gap-3 py-3">
          <BigPlayButton
            playing={isThisPlaying}
            onClick={() =>
              isThisPlaying ? playPause() : playContext(tracks, 0, title)
            }
            label={`Play ${title}`}
          />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle shuffle"
            onClick={toggleShuffle}
            className={cn(
              "size-10 rounded-full text-muted-foreground",
              shuffle && "text-primary hover:text-primary"
            )}
          >
            <Shuffle className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Add all to queue"
            onClick={() => {
              usePlayer.getState().addManyToQueue(tracks);
              toast.success(`Added ${tracks.length} ${songWord(tracks.length)} to queue`);
            }}
            className="size-10 rounded-full text-muted-foreground"
          >
            <ListEnd className="size-4" />
          </Button>
        </div>
      ) : null}

      {/* Tracks */}
      {tracks.length > 0 ? (
        <TrackList
          tracks={tracks}
          contextLabel={title}
          showIndex
          showAlbum={source.kind === "album"}
          onRemove={
            userId
              ? (t) => {
                  removeFromPlaylist(userId, t.id);
                  toast.success("Removed from playlist", {
                    description: t.title,
                  });
                }
              : undefined
          }
        />
      ) : (
        <EmptyState
          icon={Music2}
          title="Nothing here yet"
          description={emptyDescription}
        />
      )}
    </div>
  );
}

export function CollectionView() {
  const view = useCurrentView();
  if (view.name !== "collection") return null;
  const source = view.source;
  const key = "id" in source ? `${source.kind}-${source.id}` : source.kind;
  return <CollectionBody key={key} source={source} />;
}
