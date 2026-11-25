"use client";

import { useEffect } from "react";
import { useAppMode } from "@/lib/view-store";
import { pausePlayback } from "@/lib/player-store";
import { PlayerApp } from "@/components/player/player-app";

/**
 * Switches the single `/` route between the marketing site and the
 * full-screen web player. Deep link: `#player` (also survives reloads and
 * manual hash edits via the hashchange listener below).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const mode = useAppMode((s) => s.mode);
  const openPlayer = useAppMode((s) => s.openPlayer);
  const exitPlayer = useAppMode((s) => s.exitPlayer);

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#player") {
        openPlayer();
      } else {
        exitPlayer();
      }
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  /* Leaving the player pauses music — the site has no playback controls. */
  useEffect(() => {
    if (mode === "site") pausePlayback();
  }, [mode]);

  if (mode === "player") {
    return <PlayerApp />;
  }
  return <>{children}</>;
}
