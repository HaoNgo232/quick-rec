import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useVault } from "../context/VaultContext";

export function PreviewModal() {
  const { state, actions } = useVault();
  const clip = state.previewClip;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    if (clip) {
      setLoading(true);
      invoke<ArrayBuffer>("get_video_data", { path: clip.filePath })
        .then((buf) => {
          if (!active) return;
          const blob = new Blob([buf], { type: "video/mp4" });
          objectUrl = URL.createObjectURL(blob);
          setVideoUrl(objectUrl);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load video data:", err);
          if (active) setLoading(false);
        });
    } else {
      setVideoUrl(null);
    }

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [clip]);

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
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              <span className="text-xs font-mono">Loading preview...</span>
            </div>
          ) : videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          ) : (
            <span className="text-xs text-zinc-500 font-mono">Unable to load preview</span>
          )}
        </div>
      </div>
    </div>
  );
}
