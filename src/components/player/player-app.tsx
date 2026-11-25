"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { initAudio, usePlayer } from "@/lib/player-store";
import { useCurrentView } from "@/lib/view-store";
import { LibraryView } from "@/components/player/views/library-view";
import { CollectionView } from "@/components/player/views/collection-view";
import { HomeView } from "@/components/player/views/home-view";
import { SearchView } from "@/components/player/views/search-view";
import { MobileNav } from "@/components/player/mobile-nav";
import { NowPlaying } from "@/components/player/now-playing";
import { PlayerBar } from "@/components/player/player-bar";
import { QueuePanel } from "@/components/player/queue-panel";
import { Sidebar } from "@/components/player/sidebar";
import { Topbar } from "@/components/player/topbar";

/** Global player shortcuts (skipped while typing in fields). */
function usePlayerShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (
        e.target instanceof HTMLElement &&
        e.target.closest('input, textarea, [contenteditable="true"]')
      ) {
        return;
      }
      const s = usePlayer.getState();
      switch (e.code) {
        case "Space":
          e.preventDefault();
          s.playPause();
          break;
        case "ArrowRight":
          e.preventDefault();
          s.seekBy(5);
          break;
        case "ArrowLeft":
          e.preventDefault();
          s.seekBy(-5);
          break;
        case "ArrowUp":
          e.preventDefault();
          s.setVolume(s.volume + 0.05);
          break;
        case "ArrowDown":
          e.preventDefault();
          s.setVolume(s.volume - 0.05);
          break;
        case "KeyM":
          s.toggleMute();
          break;
        case "KeyS":
          s.toggleShuffle();
          break;
        case "KeyR":
          s.cycleRepeat();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function PlayerApp() {
  const view = useCurrentView();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    initAudio();
  }, []);

  usePlayerShortcuts();

  /* New view -> scroll the content pane back to the top. */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 flex-1 gap-2 p-2 pb-0 md:pb-2">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-card/40 md:bg-card">
          <Topbar />
          <div
            ref={scrollRef}
            className="min-h-0 flex-1 overflow-y-auto scrollbar-thin"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={JSON.stringify(view)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="px-4 pb-10 pt-4 sm:px-6 lg:px-8"
              >
                {view.name === "home" && <HomeView />}
                {view.name === "search" && <SearchView />}
                {view.name === "library" && <LibraryView />}
                {view.name === "collection" && <CollectionView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <QueuePanel />
      </div>
      <PlayerBar />
      <MobileNav />
      <NowPlaying />
    </div>
  );
}
