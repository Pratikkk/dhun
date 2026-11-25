import { NextRequest } from "next/server";
import { getAlbumDetails } from "@/lib/saavn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Album detail with full track list.
 *
 * GET /api/player/album?id=<albumId>
 */
export async function GET(req: NextRequest) {
  const id = (req.nextUrl.searchParams.get("id") ?? "").trim();

  if (!id || id.length > 64) {
    return Response.json(
      { error: "Missing or invalid ?id= album parameter" },
      { status: 400 }
    );
  }

  try {
    const detail = await getAlbumDetails(id);
    return Response.json(
      { kind: "album" as const, ...detail },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Album lookup failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
