import { NextRequest } from "next/server";
import { searchSongs } from "@/lib/saavn";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const query = (req.nextUrl.searchParams.get("q") ?? "").trim();

  if (!query) {
    return Response.json(
      { error: "Missing ?q= search parameter" },
      { status: 400 }
    );
  }
  if (query.length > 120) {
    return Response.json({ error: "Query is too long" }, { status: 400 });
  }

  try {
    const songs = await searchSongs(query, 12);
    return Response.json(
      { query, count: songs.length, songs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Search failed unexpectedly";
    return Response.json(
      { error: `Could not reach JioSaavn: ${message}` },
      { status: 502 }
    );
  }
}
