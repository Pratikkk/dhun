"use client";

import { create } from "zustand";

/**
 * Client-side navigation for the player app + the site <-> player switch.
 * The player is a single-route app, so views are managed here instead of
 * via the URL (the site keeps its hash anchors untouched).
 */

export type CollectionSource =
  | { kind: "album"; id: string }
  | { kind: "playlist"; id: string }
  | { kind: "liked" }
  | { kind: "recent" }
  | { kind: "user"; id: string };

export type PlayerView =
  | { name: "home" }
  | { name: "search" }
  | { name: "library" }
  | { name: "collection"; source: CollectionSource };

interface ViewRouterState {
  stack: PlayerView[];
  index: number;
  push: (view: PlayerView) => void;
  back: () => void;
  forward: () => void;
  /** right-side queue panel / mobile queue sheet */
  queueOpen: boolean;
  setQueueOpen: (open: boolean) => void;
  /** fullscreen now-playing overlay */
  nowPlayingOpen: boolean;
  setNowPlayingOpen: (open: boolean) => void;
}

export const useViewRouter = create<ViewRouterState>()((set, get) => ({
  stack: [{ name: "home" }],
  index: 0,
  push: (view) => {
    const { stack, index } = get();
    const current = stack[index];
    if (JSON.stringify(current) === JSON.stringify(view)) return;
    set({
      stack: [...stack.slice(0, index + 1), view],
      index: index + 1,
      nowPlayingOpen: false,
    });
  },
  back: () => {
    const { index } = get();
    if (index > 0) set({ index: index - 1, nowPlayingOpen: false });
  },
  forward: () => {
    const { stack, index } = get();
    if (index < stack.length - 1) set({ index: index + 1, nowPlayingOpen: false });
  },
  queueOpen: false,
  setQueueOpen: (open) => set({ queueOpen: open }),
  nowPlayingOpen: false,
  setNowPlayingOpen: (open) => set({ nowPlayingOpen: open }),
}));

/** Currently visible player view. */
export const useCurrentView = () =>
  useViewRouter((s) => s.stack[s.index] ?? { name: "home" as const });

export const useCanBack = () => useViewRouter((s) => s.index > 0);
export const useCanForward = () =>
  useViewRouter((s) => s.index < s.stack.length - 1);

/* ------------------------------------------------------------------ */
/* Site <-> player app mode                                            */
/* ------------------------------------------------------------------ */

interface AppModeState {
  mode: "site" | "player";
  openPlayer: () => void;
  exitPlayer: () => void;
}

export const useAppMode = create<AppModeState>()((set) => ({
  mode: "site",
  openPlayer: () => {
    set({ mode: "player" });
    if (typeof window !== "undefined" && window.location.hash !== "#player") {
      window.history.replaceState(null, "", "#player");
    }
  },
  exitPlayer: () => {
    set({ mode: "site" });
    if (typeof window !== "undefined" && window.location.hash === "#player") {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  },
}));
