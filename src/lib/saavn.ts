import { DES } from "des.js";

/**
 * Tiny server-side client for JioSaavn's public web endpoints — the same
 * ones the jiosaavn.com web player talks to. No auth required.
 */

const SAAVN_API = "https://www.jiosaavn.com/api.php";

export const SAAVN_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** CDN hosts we are willing to proxy media from. */
export const ALLOWED_MEDIA_HOSTS = new Set([
  "aac.saavncdn.com",
  "h.saavncdn.com",
  "ia.saavncdn.com",
]);

export type SongQuality = "96" | "160" | "320";

export interface SaavnSong {
  id: string;
  title: string;
  subtitle: string;
  artists: string;
  album: string;
  albumId?: string;
  image: string;
  year: string;
  /** seconds */
  duration: number;
  language: string;
  permaUrl: string;
  /** decrypted 96 kbps master URL — swap the bitrate for other qualities */
  downloadUrl: string;
  has320: boolean;
}

/** Album card data. */
export interface SaavnAlbumSummary {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  year: string;
  songCount: number;
}

/** Playlist card data (JioSaavn editorial lists). */
export interface SaavnPlaylistSummary {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  songCount: number;
}

/** Album or playlist detail, tracks included. */
export interface SaavnCollectionDetail {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  year: string;
  songCount: number;
  description: string;
  tracks: SaavnSong[];
}

/** Strip PKCS#7 block padding (des.js processes raw blocks only). */
function stripPadding(buf: Buffer): Buffer {
  if (buf.length === 0) return buf;
  const last = buf[buf.length - 1];
  if (last > 0 && last <= 8) {
    let valid = true;
    for (let i = buf.length - last; i < buf.length; i++) {
      if (buf[i] !== last) {
        valid = false;
        break;
      }
    }
    if (valid) return buf.subarray(0, buf.length - last);
  }
  return buf;
}

/** des.js returns byte arrays in Node and Buffers elsewhere — normalise. */
function toBuffer(chunk: Buffer | number[]): Buffer {
  return Array.isArray(chunk) ? Buffer.from(chunk) : chunk;
}

/** JioSaavn encrypts media paths with DES-ECB using this well-known key. */
export function decryptMediaUrl(encrypted: string): string {
  const key = Buffer.from("38346591", "utf8");
  // Pure-JS DES — Node's OpenSSL 3 has moved DES into its legacy provider,
  // so node:crypto can't be relied on here.
  const decipher = new DES({ type: "decrypt", key });
  const buf = Buffer.concat([
    toBuffer(decipher.update(Buffer.from(encrypted, "base64"))),
    toBuffer(decipher.final()),
  ]);
  const decrypted = stripPadding(buf)
    .toString("utf8")
    .replace(/\x00/g, "")
    .trim();

  let url = decrypted;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://aac.saavncdn.com/${url}`;
  }
  return url.replace(/^http:\/\//i, "https://");
}

/** Turn a 96 kbps master URL into the requested bitrate variant. */
export function qualityUrl(base: string, quality: SongQuality): string {
  return base.replace(/_96\.mp4$/i, `_${quality}.mp4`);
}

export function decodeEntities(input: string): string {
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/* ------------------------------------------------------------------ */
/* Transport + caching                                                 */
/* ------------------------------------------------------------------ */

async function saavnGet<T>(params: Record<string, string>): Promise<T> {
  const search = new URLSearchParams({
    _format: "json",
    _marker: "0",
    api_version: "4",
    ctx: "web6dot0",
    ...params,
  });

  const res = await fetch(`${SAAVN_API}?${search.toString()}`, {
    headers: {
      "User-Agent": SAAVN_UA,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    throw new Error(`JioSaavn responded with HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

const memCache = new Map<string, { expires: number; value: unknown }>();

/** Tiny TTL cache — rejections are never cached. */
async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const hit = memCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const value = await fn();
  if (memCache.size > 120) {
    const oldest = memCache.keys().next().value;
    if (oldest !== undefined) memCache.delete(oldest);
  }
  memCache.set(key, { expires: Date.now() + ttlMs, value });
  return value;
}

/** Swap tiny artwork variants for the 500x500 one (editorial art is untouched). */
function bigImage(url: string): string {
  return url.replace(/(50x50|96x96|150x150)/g, "500x500");
}

/* ------------------------------------------------------------------ */
/* Raw shapes                                                          */
/* ------------------------------------------------------------------ */

interface SaavnRawResult {
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  year?: string;
  language?: string;
  perma_url?: string;
  more_info?: {
    album?: string;
    album_id?: string;
    duration?: string | number;
    encrypted_media_url?: string;
    "320kbps"?: string | boolean;
    artistMap?: {
      primary_artists?: { name?: string }[];
    };
  };
}

interface SaavnSearchEnvelope<T> {
  total?: number;
  results?: T[];
}

interface SaavnAlbumRaw {
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  year?: string;
  more_info?: { song_count?: string | number };
}

interface SaavnPlaylistRaw {
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  more_info?: { song_count?: string | number };
}

interface SaavnTrendingRaw {
  id?: string;
  title?: string;
  subtitle?: string;
  image?: string;
  more_info?: {
    listid?: string;
    song_count?: string | number;
  };
}

interface SaavnDetailRaw {
  id?: string;
  title?: string;
  subtitle?: string;
  header_desc?: string;
  image?: string;
  year?: string;
  list_count?: string;
  list?: SaavnRawResult[];
}

/* ------------------------------------------------------------------ */
/* Normalisers                                                         */
/* ------------------------------------------------------------------ */

/** Map one raw song object (search / album / playlist payloads) to SaavnSong. */
export function normalizeSong(r: SaavnRawResult): SaavnSong | null {
  const info = r.more_info ?? {};
  if (!r.id || !info.encrypted_media_url) return null;

  let downloadUrl: string;
  try {
    downloadUrl = decryptMediaUrl(info.encrypted_media_url);
  } catch {
    return null;
  }
  // Only keep classic single-file media paths (…_96.mp4) — those are streamable.
  if (!/_96\.mp4$/i.test(downloadUrl)) return null;

  const artists = (info.artistMap?.primary_artists ?? [])
    .map((a) => decodeEntities(a.name ?? ""))
    .filter(Boolean)
    .join(", ");
  const subtitle = decodeEntities(r.subtitle ?? "");

  return {
    id: r.id,
    title: decodeEntities(r.title ?? "Unknown title"),
    subtitle,
    artists: artists || subtitle.split(" - ")[0] || "Unknown artist",
    album: decodeEntities(info.album ?? ""),
    albumId: info.album_id || undefined,
    image: bigImage(r.image ?? ""),
    year: String(r.year ?? ""),
    duration: Number(info.duration ?? 0) || 0,
    language: decodeEntities(r.language ?? ""),
    permaUrl: r.perma_url ?? "",
    downloadUrl,
    has320: String(info["320kbps"] ?? "") === "true",
  };
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function searchSongs(
  query: string,
  limit = 12
): Promise<SaavnSong[]> {
  const n = Math.min(Math.max(limit, 1), 30);
  return cached(`songs:${query.toLowerCase()}:${n}`, 5 * 60_000, async () => {
    const data = await saavnGet<SaavnSearchEnvelope<SaavnRawResult>>({
      __call: "search.getResults",
      q: query,
      p: "1",
      n: String(n),
    });
    const results = Array.isArray(data.results) ? data.results : [];
    return results
      .map(normalizeSong)
      .filter((s): s is SaavnSong => s !== null);
  });
}

export async function searchAlbums(
  query: string,
  limit = 8
): Promise<SaavnAlbumSummary[]> {
  const n = Math.min(Math.max(limit, 1), 30);
  return cached(`albums:${query.toLowerCase()}:${n}`, 10 * 60_000, async () => {
    const data = await saavnGet<SaavnSearchEnvelope<SaavnAlbumRaw>>({
      __call: "search.getAlbumResults",
      q: query,
      p: "1",
      n: String(n),
    });
    const results = Array.isArray(data.results) ? data.results : [];
    const albums: SaavnAlbumSummary[] = [];
    for (const r of results) {
      if (!r.id || !r.title) continue;
      albums.push({
        id: r.id,
        title: decodeEntities(r.title),
        subtitle: decodeEntities(r.subtitle ?? ""),
        image: bigImage(r.image ?? ""),
        year: String(r.year ?? ""),
        songCount: Number(r.more_info?.song_count ?? 0) || 0,
      });
    }
    return albums;
  });
}

export async function searchPlaylists(
  query: string,
  limit = 8
): Promise<SaavnPlaylistSummary[]> {
  const n = Math.min(Math.max(limit, 1), 30);
  return cached(
    `playlists:${query.toLowerCase()}:${n}`,
    10 * 60_000,
    async () => {
      const data = await saavnGet<SaavnSearchEnvelope<SaavnPlaylistRaw>>({
        __call: "search.getPlaylistResults",
        q: query,
        p: "1",
        n: String(n),
      });
      const results = Array.isArray(data.results) ? data.results : [];
      const playlists: SaavnPlaylistSummary[] = [];
      for (const r of results) {
        if (!r.id || !r.title) continue;
        const count = Number(r.more_info?.song_count ?? 0) || 0;
        playlists.push({
          id: r.id,
          title: decodeEntities(r.title),
          subtitle: count > 0 ? `${count} songs` : decodeEntities(r.subtitle ?? ""),
          image: bigImage(r.image ?? ""),
          songCount: count,
        });
      }
      return playlists;
    }
  );
}

/** JioSaavn's trending editorial playlists. */
export async function getTrendingPlaylists(
  limit = 12
): Promise<SaavnPlaylistSummary[]> {
  return cached(`trending:${limit}`, 60 * 60_000, async () => {
    const data = await saavnGet<SaavnTrendingRaw[]>({
      __call: "content.getTrending",
    });
    const arr = Array.isArray(data) ? data : [];
    const playlists: SaavnPlaylistSummary[] = [];
    for (const r of arr) {
      const id = r.more_info?.listid ?? r.id;
      const count = Number(r.more_info?.song_count ?? 0) || 0;
      if (!id || !r.title || !r.image || count <= 0) continue;
      playlists.push({
        id,
        title: decodeEntities(r.title),
        subtitle: `${count} songs`,
        image: bigImage(r.image),
        songCount: count,
      });
      if (playlists.length >= limit) break;
    }
    return playlists;
  });
}

export async function getAlbumDetails(
  albumId: string
): Promise<SaavnCollectionDetail> {
  return cached(`album:${albumId}`, 30 * 60_000, async () => {
    const data = await saavnGet<SaavnDetailRaw>({
      __call: "content.getAlbumDetails",
      albumid: albumId,
    });
    if (!data.id || !data.title) {
      throw new Error("Album not found on JioSaavn");
    }
    const tracks = (data.list ?? [])
      .map(normalizeSong)
      .filter((s): s is SaavnSong => s !== null);
    return {
      id: data.id,
      title: decodeEntities(data.title),
      subtitle: decodeEntities(data.subtitle ?? ""),
      image: bigImage(data.image ?? ""),
      year: String(data.year ?? ""),
      songCount: Number(data.list_count ?? 0) || tracks.length,
      description: decodeEntities(data.header_desc ?? ""),
      tracks,
    };
  });
}

export async function getPlaylistDetails(
  listId: string
): Promise<SaavnCollectionDetail> {
  return cached(`playlist:${listId}`, 30 * 60_000, async () => {
    const data = await saavnGet<SaavnDetailRaw>({
      __call: "playlist.getDetails",
      listid: listId,
      includeYouTubeParams: "0",
    });
    if (!data.id || !data.title) {
      throw new Error("Playlist not found on JioSaavn");
    }
    const tracks = (data.list ?? [])
      .map(normalizeSong)
      .filter((s): s is SaavnSong => s !== null);
    return {
      id: data.id,
      title: decodeEntities(data.title),
      subtitle: decodeEntities(data.subtitle ?? ""),
      image: bigImage(data.image ?? ""),
      year: String(data.year ?? ""),
      songCount: Number(data.list_count ?? 0) || tracks.length,
      description: decodeEntities(data.header_desc ?? ""),
      tracks,
    };
  });
}
