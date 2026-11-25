import { NextRequest } from "next/server";
import {
  ALLOWED_MEDIA_HOSTS,
  qualityUrl,
  SAAVN_UA,
  type SongQuality,
} from "@/lib/saavn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QUALITIES: SongQuality[] = ["96", "160", "320"];

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\u0000-\u001f\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 120)
  );
}

/**
 * Streams a song straight from JioSaavn's CDN.
 *
 * GET /api/download?u=<96kbps master url>&q=<96|160|320>&name=<song name>&inline=1
 *
 * - `inline=1` serves the audio without an attachment header (used by the
 *   page's preview player, which relies on HTTP Range requests).
 * - Falls back to lower bitrates when the requested variant is unavailable.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const rawUrl = params.get("u") ?? "";
  const requested = (params.get("q") ?? "320") as SongQuality;
  const inline = params.get("inline") === "1";
  const name = sanitizeFilename(params.get("name") ?? "dhun-song");

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return Response.json({ error: "Invalid media URL" }, { status: 400 });
  }

  if (!ALLOWED_MEDIA_HOSTS.has(target.hostname)) {
    return Response.json({ error: "CDN host not allowed" }, { status: 403 });
  }
  if (!/_96\.mp4$/i.test(target.pathname)) {
    return Response.json(
      { error: "Unexpected media path format" },
      { status: 400 }
    );
  }

  const quality = QUALITIES.includes(requested) ? requested : "320";
  const candidates: SongQuality[] =
    quality === "96"
      ? ["96"]
      : quality === "160"
        ? ["160", "96"]
        : ["320", "160", "96"];

  const range = req.headers.get("range");

  for (const candidate of candidates) {
    let upstream: Response;
    try {
      upstream = await fetch(qualityUrl(target.toString(), candidate), {
        headers: {
          "User-Agent": SAAVN_UA,
          ...(range ? { Range: range } : {}),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      continue;
    }

    if (upstream.status !== 200 && upstream.status !== 206) {
      await upstream.body?.cancel();
      continue;
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      upstream.headers.get("content-type") ?? "audio/mp4"
    );
    headers.set("Accept-Ranges", "bytes");
    for (const header of ["content-length", "content-range", "etag"]) {
      const value = upstream.headers.get(header);
      if (value) headers.set(header, value);
    }
    if (!inline) {
      const fallbackAscii =
        name.replace(/[^\x20-\x7e]/g, "").trim() || "dhun-song";
      headers.set(
        "Content-Disposition",
        `attachment; filename="${fallbackAscii} [${candidate}kbps].m4a"; filename*=UTF-8''${encodeURIComponent(
          `${name} [${candidate}kbps].m4a`
        )}`
      );
    }
    headers.set("Cache-Control", "no-store");
    headers.set("X-Dhun-Quality", candidate);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  }

  return Response.json(
    { error: "This track is not available on JioSaavn's CDN right now" },
    { status: 502 }
  );
}
