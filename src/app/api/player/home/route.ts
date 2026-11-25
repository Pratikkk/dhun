import { getTrendingPlaylists, searchSongs } from "@/lib/saavn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Curated home content for the player.
 *
 * GET /api/player/home
 * -> { sections: [{ label, query, tracks }], playlists }
 */
const SECTIONS = [
  { label: "New Hindi hits", query: "New Hindi Songs" },
  { label: "Arijit Singh mix", query: "Arijit Singh" },
  { label: "Punjabi charts", query: "Punjabi Hits" },
  { label: "Bollywood essentials", query: "Bollywood Hits" },
  { label: "90s Bollywood", query: "90s Hindi Songs" },
  { label: "Lofi lounge", query: "Lofi Hindi" },
] as const;

export async function GET() {
  try {
    const [sections, playlists] = await Promise.all([
      Promise.all(
        SECTIONS.map(async (section) => {
          try {
            const tracks = await searchSongs(section.query, 10);
            return { label: section.label, query: section.query, tracks };
          } catch {
            // A single failed section shouldn't sink the whole home page.
            return { label: section.label, query: section.query, tracks: [] };
          }
        })
      ),
      getTrendingPlaylists(12).catch(() => []),
    ]);

    const anyContent =
      sections.some((s) => s.tracks.length > 0) || playlists.length > 0;

    if (!anyContent) {
      return Response.json(
        { error: "Could not reach JioSaavn for home content" },
        { status: 502 }
      );
    }

    return Response.json(
      { sections, playlists },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Home content failed unexpectedly";
    return Response.json(
      { error: `Could not reach JioSaavn: ${message}` },
      { status: 502 }
    );
  }
}
