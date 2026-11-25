import { NextRequest } from "next/server";
import { getPlaylistDetails } from "@/lib/saavn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * JioSaavn editorial playlist detail with full track list.
 *
 * GET /api/player/playlist?id=<listId>
 */
export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();

  if (!id || id.length > 64) {
    return Response.json(
      { error: "Missing or invalid ?id= playlist parameter" },
      { status: 400 }
    );
  }

  try {
    const detail = await getPlaylistDetails(id);
    return Response.json(
      { kind: "playlist" as const, ...detail },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Playlist lookup failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
