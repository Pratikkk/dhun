import type {
  AlbumSummary,
  CollectionDetail,
  HomeData,
  PlayerTrack,
  PlaylistSummary,
  SearchResults,
} from "./player-types";

/**
 * Client-side helpers for the player: typed fetchers for the
 * /api/player/* routes plus small formatting utilities.
 */

/** Proxied stream URL for a track (320 kbps with automatic quality fallback). */
export function streamUrl(track: PlayerTrack): string {
  return `/api/download?u=${encodeURIComponent(
    track.downloadUrl
  )}&q=320&inline=1`;
}

/** "3:41" style formatting for durations / positions. */
export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Warm gradient palette used for artwork fallbacks and hero backdrops. */
const GRADIENTS = [
  "from-orange-600 via-red-800 to-neutral-950",
  "from-emerald-600 via-teal-900 to-neutral-950",
  "from-amber-500 via-orange-800 to-neutral-950",
  "from-rose-600 via-red-900 to-neutral-950",
  "from-lime-600 via-emerald-900 to-neutral-950",
  "from-red-500 via-rose-900 to-neutral-950",
];

/** Deterministic gradient for a seed (track id, title, ...). */
export function gradientFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[h % GRADIENTS.length];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/** Unified search: songs + albums + playlists. */
export function searchAll(q: string): Promise<SearchResults> {
  return getJson<SearchResults>(
    `/api/player/search?q=${encodeURIComponent(q)}`
  );
}

/** Curated home sections + trending playlists. */
export function getHome(): Promise<HomeData> {
  return getJson<HomeData>("/api/player/home");
}

/** Album or playlist detail with full track list. */
export function getCollection(
  kind: "album" | "playlist",
  id: string
): Promise<CollectionDetail> {
  return getJson<CollectionDetail>(
    `/api/player/${kind}?id=${encodeURIComponent(id)}`
  );
}

/** "song" / "songs" helper for counts. */
export function songWord(n: number): string {
  return n === 1 ? "song" : "songs";
}

/** Subtitle helper: "N songs · total runtime". */
export function collectionMeta(
  songCount: number,
  tracks: PlayerTrack[]
): string {
  const total = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const mins = Math.round(total / 60);
  const runtime =
    mins >= 60
      ? `${Math.floor(mins / 60)} hr ${mins % 60} min`
      : `${mins} min`;
  return `${songCount} ${songWord(songCount)} · ${runtime}`;
}

export type { AlbumSummary, PlaylistSummary };
