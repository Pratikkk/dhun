import type { SaavnSong } from "./saavn";

/**
 * Shared types for the dhun web player.
 *
 * These are the contracts between the JioSaavn backend routes and every
 * player UI component. Keep them in sync with `src/lib/saavn.ts`.
 */

/** One playable track. Mirrors the normalised SaavnSong from the server lib. */
export type PlayerTrack = SaavnSong;

/** Album card as returned by search + home endpoints. */
export interface AlbumSummary {
  id: string;
  title: string;
  /** e.g. "Sachin-Jigar" or "2023 · Hindi" */
  subtitle: string;
  image: string;
  year: string;
  songCount: number;
}

/** Playlist card (JioSaavn editorial or user-created wrapper). */
export interface PlaylistSummary {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  songCount: number;
}

/** Combined search response. */
export interface SearchResults {
  songs: PlayerTrack[];
  albums: AlbumSummary[];
  playlists: PlaylistSummary[];
}

/** A curated row on the player home page. */
export interface HomeSection {
  label: string;
  query: string;
  tracks: PlayerTrack[];
}

/** Full home payload: curated song sections + trending playlists. */
export interface HomeData {
  sections: HomeSection[];
  playlists: PlaylistSummary[];
}

/** Album or playlist detail with its full track list. */
export interface CollectionDetail {
  kind: "album" | "playlist";
  id: string;
  title: string;
  subtitle: string;
  image: string;
  year: string;
  songCount: number;
  description?: string;
  tracks: PlayerTrack[];
}

/** A user-created playlist, persisted in localStorage. */
export interface UserPlaylist {
  id: string;
  name: string;
  createdAt: number;
  tracks: PlayerTrack[];
}

export type RepeatMode = "off" | "all" | "one";
