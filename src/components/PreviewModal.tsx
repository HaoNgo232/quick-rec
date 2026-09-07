import { X } from "lucide-react";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useVault } from "../context/VaultContext";

export function PreviewModal() {
  const { state, actions } = useVault();
  const clip = state.previewClip;

  if (!clip) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="text-xs font-mono text-zinc-400 truncate max-w-md">
            {clip.filePath}
          </div>
          <button
            onClick={() => actions.setPreviewClip(null)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="bg-black aspect-video flex items-center justify-center">
          <video
            src={convertFileSrc(clip.filePath)}
            controls
            autoPlay
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
