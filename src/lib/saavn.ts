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
    duration?: string | number;
    encrypted_media_url?: string;
    "320kbps"?: string | boolean;
    artistMap?: {
      primary_artists?: { name?: string }[];
    };
  };
}

export async function searchSongs(
  query: string,
  limit = 12
): Promise<SaavnSong[]> {
  const params = new URLSearchParams({
    __call: "search.getResults",
    q: query,
    _format: "json",
    _marker: "0",
    api_version: "4",
    ctx: "web6dot0",
    p: "1",
    n: String(Math.min(Math.max(limit, 1), 30)),
  });

  const res = await fetch(`${SAAVN_API}?${params.toString()}`, {
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

  const data = (await res.json()) as { results?: SaavnRawResult[] };
  const results = Array.isArray(data.results) ? data.results : [];

  const songs: SaavnSong[] = [];
  for (const r of results) {
    const info = r.more_info ?? {};
    if (!r.id || !info.encrypted_media_url) continue;

    let downloadUrl: string;
    try {
      downloadUrl = decryptMediaUrl(info.encrypted_media_url);
    } catch {
      continue;
    }
    // Only keep classic single-file media paths (…_96.mp4) — those are downloadable.
    if (!/_96\.mp4$/i.test(downloadUrl)) continue;

    const artists = (info.artistMap?.primary_artists ?? [])
      .map((a) => decodeEntities(a.name ?? ""))
      .filter(Boolean)
      .join(", ");
    const subtitle = decodeEntities(r.subtitle ?? "");

    songs.push({
      id: r.id,
      title: decodeEntities(r.title ?? "Unknown title"),
      subtitle,
      artists: artists || subtitle.split(" - ")[0] || "Unknown artist",
      album: decodeEntities(info.album ?? ""),
      image: (r.image ?? "").replace(/(50x50|96x96|150x150)/g, "500x500"),
      year: String(r.year ?? ""),
      duration: Number(info.duration ?? 0) || 0,
      language: decodeEntities(r.language ?? ""),
      permaUrl: r.perma_url ?? "",
      downloadUrl,
      has320: String(info["320kbps"] ?? "") === "true",
    });
  }
  return songs;
}
