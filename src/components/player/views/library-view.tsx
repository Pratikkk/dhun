"use client";

import { useState } from "react";
import {
  Heart,
  History,
  Library,
  MoreVertical,
  Music2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/player-store";
import { useViewRouter } from "@/lib/view-store";
import { gradientFor, songWord } from "@/lib/player-api";
import type { UserPlaylist } from "@/lib/player-types";
import {
  Art,
  EmptyState,
  NewPlaylistDialog,
  SectionHeader,
  TrackList,
} from "@/components/player/primitives";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface DialogState {
  type: "rename" | "delete" | null;
  playlist: UserPlaylist | null;
}

export function LibraryView() {
  const liked = usePlayer((s) => s.liked);
  const recent = usePlayer((s) => s.recent);
  const playlists = usePlayer((s) => s.playlists);
  const renamePlaylist = usePlayer((s) => s.renamePlaylist);
  const deletePlaylist = usePlayer((s) => s.deletePlaylist);
  const push = useViewRouter((s) => s.push);

  const [newOpen, setNewOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({
    type: null,
    playlist: null,
  });
  const [renameName, setRenameName] = useState("");

  const closeDialog = () => setDialog({ type: null, playlist: null });

  const submitRename = () => {
    if (!dialog.playlist) return;
    renamePlaylist(dialog.playlist.id, renameName);
    closeDialog();
  };

  const confirmDelete = () => {
    if (!dialog.playlist) return;
    const name = dialog.playlist.name;
    deletePlaylist(dialog.playlist.id);
    toast.success(`Deleted ${name}`);
    closeDialog();
  };

  const isEmpty =
    liked.length === 0 && recent.length === 0 && playlists.length === 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Your Library
        </h1>
        <Button
          size="sm"
          aria-label="Create playlist"
          onClick={() => setNewOpen(true)}
        >
          <Plus className="size-4" aria-hidden="true" /> New playlist
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Library}
          title="Your library is empty"
          description="Like songs, build playlists — everything stays in this browser."
        />
      ) : (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {/* Liked songs */}
          <button
            type="button"
            onClick={() =>
              push({ name: "collection", source: { kind: "liked" } })
            }
            className="group flex flex-col gap-3 rounded-xl bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid aspect-square w-full place-items-center rounded-lg bg-gradient-to-br from-rose-500 via-red-600 to-neutral-900">
              <Heart
                className="size-8 fill-white text-white"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Liked Songs
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {liked.length} {songWord(liked.length)}
              </span>
            </span>
          </button>

          {/* Recently played */}
          <button
            type="button"
            onClick={() =>
              push({ name: "collection", source: { kind: "recent" } })
            }
            className="group flex flex-col gap-3 rounded-xl bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="grid aspect-square w-full place-items-center rounded-lg bg-white/10">
              <History
                className="size-8 text-white/90"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">
                Recently played
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {recent.length} {songWord(recent.length)}
              </span>
            </span>
          </button>

          {/* User playlists */}
          {playlists.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.07]"
            >
              <button
                type="button"
                onClick={() =>
                  push({
                    name: "collection",
                    source: { kind: "user", id: p.id },
                  })
                }
                className="flex w-full flex-col gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {p.tracks[0]?.image ? (
                  <Art
                    src={p.tracks[0].image}
                    alt={`Cover art for ${p.name}`}
                    seed={p.id}
                    className="aspect-square w-full rounded-lg"
                  />
                ) : (
                  <span
                    className={cn(
                      "grid aspect-square w-full place-items-center rounded-lg bg-gradient-to-br",
                      gradientFor(p.id)
                    )}
                  >
                    <Music2
                      className="size-8 text-white/80"
                      aria-hidden="true"
                    />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {p.name}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {p.tracks.length} {songWord(p.tracks.length)}
                  </span>
                </span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Playlist options for ${p.name}`}
                    className="absolute right-2 top-2 size-7 rounded-full bg-black/45 text-white opacity-100 transition-opacity hover:bg-black/60 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  >
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => {
                      setDialog({ type: "rename", playlist: p });
                      setRenameName(p.name);
                    }}
                  >
                    <Pencil aria-hidden="true" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDialog({ type: "delete", playlist: p })}
                  >
                    <Trash2 aria-hidden="true" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Recently played tracks */}
      {recent.length > 0 ? (
        <section>
          <SectionHeader title="Recently played" />
          <div className="max-h-96 overflow-y-auto scrollbar-thin pr-1">
            <TrackList
              tracks={recent.slice(0, 10)}
              contextLabel="Recently played"
              showAlbum={false}
            />
          </div>
        </section>
      ) : null}

      {/* New playlist */}
      <NewPlaylistDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(id) =>
          push({ name: "collection", source: { kind: "user", id } })
        }
      />

      {/* Rename playlist */}
      <Dialog
        open={dialog.type === "rename"}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename playlist</DialogTitle>
            <DialogDescription>
              Give this playlist a new name.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            placeholder="Playlist name"
            maxLength={60}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={submitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete playlist */}
      <AlertDialog
        open={dialog.type === "delete"}
        onOpenChange={(v) => {
          if (!v) closeDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete playlist</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog.playlist
                ? `This removes “${dialog.playlist.name}” from this browser. This can’t be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
