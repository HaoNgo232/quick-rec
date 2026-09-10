import { useEffect, useState, useRef } from "react";
import { X, Loader2, FolderOpen } from "lucide-react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { useVault } from "../context/VaultContext";

export function PreviewModal() {
  const { state, actions } = useVault();
  const clip = state.previewClip;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

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

  useEffect(() => {
    if (!clip) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        actions.setPreviewClip(null);
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [clip, actions]);

  if (!clip) return null;

  const filename = clip.filePath.split("/").pop() || clip.filePath;

  const handleRevealInFolder = async () => {
    try {
      await invoke("reveal_file_in_folder", { path: clip.filePath });
    } catch (err) {
      console.error("Failed to reveal file in folder:", err);
    }
  };

  return (
    <div
      onClick={() => actions.setPreviewClip(null)}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div
            className="text-xs font-mono text-zinc-300 font-semibold truncate max-w-md"
            title={clip.filePath}
          >
            {filename}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRevealInFolder}
              title="Reveal in folder"
              aria-label="Reveal in folder"
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => actions.setPreviewClip(null)}
              title="Close preview (Esc)"
              aria-label="Close preview"
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {videoUrl || clip.thumbnailPath ? (
            <video
              ref={videoRef}
              src={videoUrl || undefined}
              poster={clip.thumbnailPath ? convertFileSrc(clip.thumbnailPath) : undefined}
              controls={!!videoUrl}
              autoPlay={!!videoUrl}
              className="w-full h-full object-contain"
            />
          ) : !loading ? (
            <span className="text-xs text-zinc-500 font-mono">Unable to load preview</span>
          ) : null}

          {loading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 text-zinc-300">
              <Loader2 className="w-6 h-6 animate-spin text-red-500" />
              <span className="text-xs font-mono">Loading preview...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
