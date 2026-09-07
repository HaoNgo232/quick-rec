import React, { createContext, useContext } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Video, Copy, Check, Trash2, ExternalLink, Clock, Play } from "lucide-react";
import type { ClipRecord } from "../../types";
import { useVault } from "../../context/VaultContext";

interface ClipCardContextValue {
  clip: ClipRecord;
}

const ClipCardContext = createContext<ClipCardContextValue | null>(null);

function useClipCard(): ClipCardContextValue {
  const context = useContext(ClipCardContext);
  if (!context) {
    throw new Error("ClipCard compound components must be used within ClipCard.Root");
  }
  return context;
}

function ClipCardRoot({ clip, children }: { clip: ClipRecord; children: React.ReactNode }) {
  return (
    <ClipCardContext.Provider value={{ clip }}>
      <div className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition shadow-sm overflow-hidden">
        {children}
      </div>
    </ClipCardContext.Provider>
  );
}

function ClipCardThumbnail({ onPreview }: { onPreview?: () => void }) {
  const { clip } = useClipCard();
  const thumbSrc = clip.thumbnailPath ? convertFileSrc(clip.thumbnailPath) : null;

  return (
    <div
      onClick={onPreview}
      className="relative aspect-video bg-zinc-950 flex items-center justify-center cursor-pointer overflow-hidden"
    >
      {thumbSrc ? (
        <img
          src={thumbSrc}
          alt="Thumbnail"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      ) : (
        <div className="flex flex-col items-center text-zinc-600">
          <Video className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-mono">No thumbnail</span>
        </div>
      )}

      {/* Play Overlay icon on hover */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
        <div className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-black/50 scale-90 group-hover:scale-100 transition">
          <Play className="w-4 h-4 ml-0.5 fill-white" />
        </div>
      </div>

      <ClipCardDuration />
    </div>
  );
}

function ClipCardDuration() {
  const { clip } = useClipCard();
  const totalSeconds = Math.max(1, Math.round(clip.durationMs / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[11px] font-mono bg-black/80 backdrop-blur rounded text-zinc-300 flex items-center gap-1 border border-zinc-800">
      <Clock className="w-2.5 h-2.5" />
      {timeStr}
    </span>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T") + "Z");
    return (
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " • " +
      d.toLocaleDateString([], { month: "short", day: "numeric" })
    );
  } catch {
    return dateStr;
  }
}

function ClipCardMeta() {
  const { clip } = useClipCard();

  return (
    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
      <span>{clip.width}x{clip.height}</span>
      <span>{formatBytes(clip.fileSizeBytes)}</span>
      <span>{formatDate(clip.createdAt)}</span>
    </div>
  );
}

function ClipCardActions({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/60">
      {children}
    </div>
  );
}

function ClipCardCopyButton() {
  const { clip } = useClipCard();
  const { state, actions } = useVault();
  const isCopied = state.copiedId === clip.id;

  return (
    <button
      onClick={() => actions.copyPath(clip)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-lg font-medium transition ${
        isCopied
          ? "bg-emerald-600 text-white"
          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
      }`}
    >
      {isCopied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-zinc-400" />
          <span>Copy Path</span>
        </>
      )}
    </button>
  );
}

function ClipCardOpenButton() {
  const { clip } = useClipCard();
  const { actions } = useVault();

  return (
    <button
      onClick={() => actions.openFile(clip)}
      title="Open with default media player"
      className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/40 transition"
    >
      <ExternalLink className="w-3.5 h-3.5" />
    </button>
  );
}

function ClipCardDeleteButton() {
  const { clip } = useClipCard();
  const { actions } = useVault();

  return (
    <button
      onClick={() => actions.deleteRecord(clip.id)}
      title="Delete recording"
      className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700/40 transition"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

export const ClipCard = {
  Root: ClipCardRoot,
  Thumbnail: ClipCardThumbnail,
  Duration: ClipCardDuration,
  Meta: ClipCardMeta,
  Actions: ClipCardActions,
  CopyButton: ClipCardCopyButton,
  OpenButton: ClipCardOpenButton,
  DeleteButton: ClipCardDeleteButton,
};
