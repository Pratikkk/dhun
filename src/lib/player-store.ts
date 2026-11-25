"use client";

import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { toast } from "sonner";
import { streamUrl } from "./player-api";
import type { PlayerTrack, RepeatMode, UserPlaylist } from "./player-types";

/* ------------------------------------------------------------------ */
/* Audio engine (single lazily-created element)                        */
/* ------------------------------------------------------------------ */

let audioEl: HTMLAudioElement | null = null;
let engineReady = false;
let errorStreak = 0;
let lastPositionSync = -1;

function audio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "none";
  }
  return audioEl;
}

function syncPositionState(a: HTMLAudioElement) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
  const sec = Math.floor(a.currentTime);
  if (sec === lastPositionSync) return;
  lastPositionSync = sec;
  try {
    navigator.mediaSession.setPositionState({
      duration: Number.isFinite(a.duration) ? a.duration : 0,
      playbackRate: a.playbackRate,
      position: a.currentTime,
    });
  } catch {
    /* position state is best-effort */
  }
}

/**
 * Wire up the singleton audio element. Idempotent — call from the player
 * app's mount effect.
 */
export function initAudio() {
  if (engineReady || typeof window === "undefined") return;
  engineReady = true;

  const a = audio();
  const s = usePlayer.getState();
  a.volume = s.volume;
  a.muted = s.muted;

  a.addEventListener("loadedmetadata", () => {
    const dur = Number.isFinite(a.duration) ? a.duration : 0;
    if (dur > 0) usePlayer.setState({ duration: dur });
  });
  a.addEventListener("timeupdate", () => {
    usePlayer.setState({ position: a.currentTime });
    syncPositionState(a);
  });
  a.addEventListener("playing", () => {
    errorStreak = 0;
    usePlayer.setState({ isPlaying: true, isLoading: false });
  });
  a.addEventListener("pause", () => usePlayer.setState({ isPlaying: false }));
  a.addEventListener("waiting", () => usePlayer.setState({ isLoading: true }));
  a.addEventListener("canplay", () => usePlayer.setState({ isLoading: false }));
  a.addEventListener("ended", () => usePlayer.getState().next(true));
  a.addEventListener("error", () => {
    const { current } = usePlayer.getState();
    if (!current || !a.src) return;
    errorStreak += 1;
    if (errorStreak < 4 && usePlayer.getState().hasNext()) {
      toast.error("Track unavailable — skipping", {
        description: current.title,
      });
      usePlayer.getState().next(true);
    } else {
      usePlayer.setState({ isPlaying: false, isLoading: false });
      toast.error("Couldn't stream this track", {
        description: "JioSaavn's CDN didn't respond — try another track.",
      });
    }
  });

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", () =>
        usePlayer.getState().playPause()
      );
      navigator.mediaSession.setActionHandler("pause", () =>
        usePlayer.getState().playPause()
      );
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        usePlayer.getState().prev()
      );
      navigator.mediaSession.setActionHandler("nexttrack", () =>
        usePlayer.getState().next()
      );
      navigator.mediaSession.setActionHandler("seekbackward", () =>
        usePlayer.getState().seekBy(-10)
      );
      navigator.mediaSession.setActionHandler("seekforward", () =>
        usePlayer.getState().seekBy(10)
      );
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime != null) usePlayer.getState().seek(details.seekTime);
      });
    } catch {
      /* media session handlers are optional */
    }
  }
}

/** Pause playback without touching anything else (used when leaving the player). */
export function pausePlayback() {
  if (!engineReady || typeof window === "undefined") return;
  audio().pause();
}

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

export interface PlayerState {
  /* playback */
  current: PlayerTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  /** seconds into the current track */
  position: number;
  /** seconds; falls back to the track's API duration while loading */
  duration: number;
  /** 0..1 */
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;

  /* context + queue */
  contextTracks: PlayerTrack[];
  contextLabel: string | null;
  /** play order (indices into contextTracks); first entry is "now" when shuffling */
  order: number[];
  orderPos: number;
  /** manually queued tracks, played before continuing the context */
  queue: PlayerTrack[];

  /* library (persisted) */
  liked: PlayerTrack[];
  recent: PlayerTrack[];
  playlists: UserPlaylist[];

  /* actions */
  playContext: (tracks: PlayerTrack[], startIndex?: number, label?: string | null) => void;
  playPause: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (sec: number) => void;
  seekBy: (delta: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (track: PlayerTrack) => void;
  addManyToQueue: (tracks: PlayerTrack[]) => void;
  playNext: (track: PlayerTrack) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleLike: (track: PlayerTrack) => void;
  createPlaylist: (name: string) => string;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, track: PlayerTrack) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;

  /* helpers */
  hasNext: () => boolean;
  upNext: () => PlayerTrack | null;
}

/** Fisher-Yates shuffle of all indices except `keepFirst`, which leads. */
function shuffledOrder(n: number, keepFirst: number): number[] {
  const rest: number[] = [];
  for (let i = 0; i < n; i++) if (i !== keepFirst) rest.push(i);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [keepFirst, ...rest];
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => {
      const applyVolume = () => {
        const a = audio();
        const { volume, muted } = get();
        a.volume = volume;
        a.muted = muted;
      };

      const pushRecent = (track: PlayerTrack) => {
        const { recent } = get();
        set({
          recent: [track, ...recent.filter((t) => t.id !== track.id)].slice(0, 30),
        });
      };

      const updateMediaSession = (track: PlayerTrack) => {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artists,
            album: track.album,
            artwork: [{ src: track.image, sizes: "500x500", type: "image/jpeg" }],
          });
        } catch {
          /* metadata is best-effort */
        }
      };

      const loadTrack = (track: PlayerTrack | undefined) => {
        if (!track) return;
        const a = audio();
        set({
          current: track,
          isLoading: true,
          isPlaying: false,
          position: 0,
          duration: track.duration || 0,
        });
        a.src = streamUrl(track);
        void a.play().catch(() => {
          set({ isPlaying: false, isLoading: false });
          toast.error("Playback was blocked", {
            description: "Tap the play button once so the browser allows audio.",
          });
        });
        pushRecent(track);
        updateMediaSession(track);
      };

      return {
        current: null,
        isPlaying: false,
        isLoading: false,
        position: 0,
        duration: 0,
        volume: 0.9,
        muted: false,
        shuffle: false,
        repeat: "off",

        contextTracks: [],
        contextLabel: null,
        order: [],
        orderPos: 0,
        queue: [],

        liked: [],
        recent: [],
        playlists: [],

        playContext: (tracks, startIndex = 0, label) => {
          if (tracks.length === 0) return;
          const idx = Math.min(Math.max(startIndex, 0), tracks.length - 1);
          const shuffling = get().shuffle;
          set({
            contextTracks: tracks,
            contextLabel: label ?? null,
            order: shuffling
              ? shuffledOrder(tracks.length, idx)
              : tracks.map((_, i) => i),
            orderPos: shuffling ? 0 : idx,
          });
          loadTrack(tracks[idx]);
        },

        playPause: () => {
          const a = audio();
          const { current, contextTracks, liked, contextLabel } = get();
          if (!current) {
            const pool = contextTracks.length > 0 ? contextTracks : liked;
            if (pool.length > 0) {
              get().playContext(pool, 0, pool === liked ? "Liked Songs" : contextLabel ?? undefined);
            }
            return;
          }
          if (a.paused || !a.src) {
            if (!a.src) a.src = streamUrl(current);
            void a.play().catch(() => {
              set({ isPlaying: false });
              toast.error("Playback was blocked by the browser");
            });
          } else {
            a.pause();
          }
        },

        next: (auto = false) => {
          const { queue, order, orderPos, contextTracks, repeat } = get();
          if (auto && repeat === "one") {
            const a = audio();
            a.currentTime = 0;
            void a.play().catch(() => {});
            return;
          }
          if (queue.length > 0) {
            const [nextUp, ...rest] = queue;
            set({ queue: rest });
            loadTrack(nextUp);
            return;
          }
          if (orderPos < order.length - 1) {
            const pos = orderPos + 1;
            set({ orderPos: pos });
            loadTrack(contextTracks[order[pos]]);
            return;
          }
          if (repeat === "all" && contextTracks.length > 0) {
            set({ orderPos: 0 });
            loadTrack(contextTracks[order[0]]);
            return;
          }
          audio().pause();
          set({ isPlaying: false });
        },

        prev: () => {
          const { current, position, order, orderPos, contextTracks } = get();
          if (!current) return;
          const a = audio();
          if (position > 3 || orderPos <= 0) {
            try {
              a.currentTime = 0;
            } catch {
              /* not seekable yet */
            }
            set({ position: 0 });
            if (a.paused) void a.play().catch(() => {});
            return;
          }
          const pos = orderPos - 1;
          set({ orderPos: pos });
          loadTrack(contextTracks[order[pos]]);
        },

        seek: (sec) => {
          const a = audio();
          const d = get().duration || (Number.isFinite(a.duration) ? a.duration : 0);
          const t = Math.min(Math.max(sec, 0), d > 0 ? d - 0.2 : sec);
          try {
            a.currentTime = t;
          } catch {
            /* not seekable yet */
          }
          set({ position: t });
        },

        seekBy: (delta) => get().seek(get().position + delta),

        setVolume: (v) => {
          const vol = Math.min(Math.max(v, 0), 1);
          set({ volume: vol, muted: vol === 0 ? get().muted : false });
          applyVolume();
        },

        toggleMute: () => {
          set({ muted: !get().muted });
          applyVolume();
        },

        toggleShuffle: () => {
          const { shuffle, order, orderPos, contextTracks, current } = get();
          const nextShuffle = !shuffle;
          if (contextTracks.length === 0) {
            set({ shuffle: nextShuffle });
            return;
          }
          if (nextShuffle) {
            const curIdx = order[orderPos] ?? 0;
            set({ shuffle: true, order: shuffledOrder(contextTracks.length, curIdx), orderPos: 0 });
          } else {
            const curIdx = current
              ? contextTracks.findIndex((t) => t.id === current.id)
              : (order[orderPos] ?? 0);
            set({
              shuffle: false,
              order: contextTracks.map((_, i) => i),
              orderPos: curIdx >= 0 ? curIdx : 0,
            });
          }
        },

        cycleRepeat: () => {
          const { repeat } = get();
          set({ repeat: repeat === "off" ? "all" : repeat === "all" ? "one" : "off" });
        },

        addToQueue: (track) => {
          set((s) => ({ queue: [...s.queue, track] }));
          toast.success("Added to queue", { description: track.title });
        },

        addManyToQueue: (tracks) => {
          if (tracks.length === 0) return;
          set((s) => ({ queue: [...s.queue, ...tracks] }));
        },

        playNext: (track) => {
          set((s) => ({ queue: [track, ...s.queue] }));
          toast.success("Playing next", { description: track.title });
        },

        removeFromQueue: (index) => {
          set((s) => ({ queue: s.queue.filter((_, i) => i !== index) }));
        },

        clearQueue: () => set({ queue: [] }),

        toggleLike: (track) => {
          const { liked } = get();
          if (liked.some((t) => t.id === track.id)) {
            set({ liked: liked.filter((t) => t.id !== track.id) });
          } else {
            set({ liked: [track, ...liked] });
          }
        },

        createPlaylist: (name) => {
          const id = `up-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
          const playlist: UserPlaylist = {
            id,
            name: name.trim() || "My playlist",
            createdAt: Date.now(),
            tracks: [],
          };
          set((s) => ({ playlists: [...s.playlists, playlist] }));
          return id;
        },

        deletePlaylist: (id) => {
          set((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
        },

        renamePlaylist: (id, name) => {
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === id ? { ...p, name: name.trim() || p.name } : p
            ),
          }));
        },

        addToPlaylist: (playlistId, track) => {
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === playlistId && !p.tracks.some((t) => t.id === track.id)
                ? { ...p, tracks: [...p.tracks, track] }
                : p
            ),
          }));
        },

        removeFromPlaylist: (playlistId, trackId) => {
          set((s) => ({
            playlists: s.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
                : p
            ),
          }));
        },

        hasNext: () => {
          const { queue, order, orderPos, contextTracks, repeat } = get();
          return (
            queue.length > 0 ||
            orderPos < order.length - 1 ||
            (repeat === "all" && contextTracks.length > 0)
          );
        },

        upNext: () => {
          const { queue, order, orderPos, contextTracks } = get();
          if (queue.length > 0) return queue[0];
          if (orderPos < order.length - 1) return contextTracks[order[orderPos + 1]] ?? null;
          return null;
        },
      };
    },
    {
      name: "dhun-player-v1",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return noopStorage;
        return window.localStorage;
      }),
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
        liked: s.liked,
        recent: s.recent,
        playlists: s.playlists,
        queue: s.queue,
        contextTracks: s.contextTracks,
        contextLabel: s.contextLabel,
        order: s.order,
        orderPos: s.orderPos,
        current: s.current,
      }),
    }
  )
);
