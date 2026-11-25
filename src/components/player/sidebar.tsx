"use client";

import { useState, type ReactNode } from "react";
import { Copy, Github, Heart, History, House, Library, Music2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { gradientFor, songWord } from "@/lib/player-api";
import { usePlayer } from "@/lib/player-store";
import { useCurrentView, useViewRouter } from "@/lib/view-store";
import { Button } from "@/components/ui/button";
import {
  EXTERNAL_LINK_PROPS,
  GITHUB_REPO,
  INSTALL_COMMAND,
} from "@/components/site/constants";
import { NewPlaylistDialog } from "@/components/player/primitives";

const NAV_ITEMS = [
  { name: "home", label: "Home", icon: House },
  { name: "search", label: "Search", icon: Search },
  { name: "library", label: "Your Library", icon: Library },
] as const;

function SidebarRow({
  active,
  onClick,
  tile,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  tile: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        active && "bg-white/10 hover:bg-white/10"
      )}
    >
      {tile}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

export function Sidebar() {
  const view = useCurrentView();
  const push = useViewRouter((s) => s.push);
  const liked = usePlayer((s) => s.liked);
  const recent = usePlayer((s) => s.recent);
  const playlists = usePlayer((s) => s.playlists);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const isCollection = view.name === "collection";
  const libraryEmpty =
    liked.length === 0 && recent.length === 0 && playlists.length === 0;

  const copyInstall = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      toast.success("Copied", {
        description: "pip install command ready to paste",
      });
    } catch {
      toast.error("Couldn't copy");
    }
  };

  return (
    <div className="hidden w-60 shrink-0 flex-col gap-2 md:flex lg:w-72">
      <div className="flex items-center gap-2.5 px-1 py-1">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Music2 className="size-4.5" aria-hidden="true" />
        </span>
        <span className="font-mono text-sm font-semibold">
          <span className="lg:hidden">dhun</span>
          <span className="hidden lg:inline">dhun player</span>
        </span>
      </div>

      <nav aria-label="Player menu" className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = view.name === item.name;
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => push({ name: item.name })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white/[0.03]">
        <div className="flex items-center justify-between px-3 py-2.5">
          <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            Your Library
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Create playlist"
            onClick={() => setPlaylistDialogOpen(true)}
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-1.5 pb-2">
          {libraryEmpty ? (
            <p className="px-3 py-4 text-xs text-muted-foreground">
              Nothing saved yet — like a song to start your library.
            </p>
          ) : (
            <div className="flex flex-col gap-0.5">
              {liked.length > 0 ? (
                <SidebarRow
                  active={isCollection && view.source.kind === "liked"}
                  onClick={() =>
                    push({ name: "collection", source: { kind: "liked" } })
                  }
                  tile={
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-rose-500 to-red-700 text-white">
                      <Heart className="size-4.5 fill-current" aria-hidden="true" />
                    </span>
                  }
                  title="Liked Songs"
                  subtitle={`${liked.length} ${songWord(liked.length)}`}
                />
              ) : null}

              {recent.length > 0 ? (
                <SidebarRow
                  active={isCollection && view.source.kind === "recent"}
                  onClick={() =>
                    push({ name: "collection", source: { kind: "recent" } })
                  }
                  tile={
                    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-white/10 text-foreground">
                      <History className="size-4.5" aria-hidden="true" />
                    </span>
                  }
                  title="Recently played"
                  subtitle={`${recent.length} ${songWord(recent.length)}`}
                />
              ) : null}

              {playlists.map((p) => (
                <SidebarRow
                  key={p.id}
                  active={
                    isCollection &&
                    view.source.kind === "user" &&
                    view.source.id === p.id
                  }
                  onClick={() =>
                    push({
                      name: "collection",
                      source: { kind: "user", id: p.id },
                    })
                  }
                  tile={
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-md bg-gradient-to-br text-white",
                        gradientFor(p.id)
                      )}
                    >
                      <Music2 className="size-4.5" aria-hidden="true" />
                    </span>
                  }
                  title={p.name}
                  subtitle={`${p.tracks.length} ${songWord(p.tracks.length)}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/15 via-card to-transparent p-3">
        <p className="text-xs font-medium">Take dhun to the terminal</p>
        <div className="mt-2 flex items-start gap-1">
          <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-snug text-muted-foreground line-clamp-2">
            {INSTALL_COMMAND}
          </code>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Copy install command"
            onClick={() => void copyInstall()}
            className="size-7 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
        <a
          href={GITHUB_REPO}
          {...EXTERNAL_LINK_PROPS}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Github className="size-3" aria-hidden="true" />
          View on GitHub
        </a>
      </div>

      <NewPlaylistDialog
        open={playlistDialogOpen}
        onOpenChange={setPlaylistDialogOpen}
        onCreated={(id) => {
          push({ name: "collection", source: { kind: "user", id } });
          toast.success("Playlist created");
        }}
      />
    </div>
  );
}
