import { useEffect, useState, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Video,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Clock,
  Play,
  X,
} from "lucide-react";
import type { ClipRecord } from "./types";

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr.replace(" ", "T") + "Z");
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " • " +
      d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function App() {
  const [records, setRecords] = useState<ClipRecord[]>([]);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewClip, setPreviewClip] = useState<ClipRecord | null>(null);
  const [recording, setRecording] = useState(false);

  const fetchRecords = async () => {
    try {
      const list = await invoke<ClipRecord[]>("list_records", { limit: 100, offset: 0 });
      setRecords(list);
      const isRec = await invoke<boolean>("is_recording");
      setRecording(isRec);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();

    // Listen for backend updates when a new recording is finished
    const unlistenPromise = listen("recordings-updated", () => {
      fetchRecords();
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const handleCopy = async (id: number, filePath: string) => {
    try {
      await invoke("copy_path", { path: filePath });
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleOpen = async (filePath: string) => {
    try {
      await invoke("open_file", { path: filePath });
    } catch (err) {
      console.error("Open file failed:", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc muốn xoá video này không?")) return;
    try {
      await invoke("delete_record", { id, removeFile: true });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (previewClip?.id === id) setPreviewClip(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleToggleRecord = async () => {
    try {
      const isNowRec = await invoke<boolean>("toggle_record");
      setRecording(isNowRec);
    } catch (err) {
      console.error("Toggle record failed:", err);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!search.trim()) return records;
    const q = search.toLowerCase();
    return records.filter(
      (r) =>
        r.filePath.toLowerCase().includes(q) ||
        r.createdAt.toLowerCase().includes(q),
    );
  }, [records, search]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500 selection:text-white">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 shadow-md shadow-red-950">
            <Video className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Quick Rec
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                Vault
              </span>
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Tìm kiếm video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition"
            />
          </div>
        </div>

        {/* Record Shortcut CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
              recording
                ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${recording ? "bg-white" : "bg-red-500"}`}
            />
            {recording ? "Đang quay... (Bấm dừng)" : "Quay ngay"}
            <kbd className="ml-1 px-1 py-0.2 text-[10px] bg-zinc-900/60 rounded text-zinc-400 font-mono">
              Super+Shift+R
            </kbd>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-5">
        {filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-zinc-500" />
            </div>
            <p className="text-sm font-medium text-zinc-300">Chưa có clip nào trong Vault</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Bấm phím tắt <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">Super + Shift + R</kbd> để chọn vùng và quay clip đầu tiên!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredRecords.map((clip) => {
              const thumbSrc = clip.thumbnailPath ? convertFileSrc(clip.thumbnailPath) : null;
              const isCopied = copiedId === clip.id;

              return (
                <div
                  key={clip.id}
                  className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/50 hover:bg-zinc-900 hover:border-zinc-700 transition shadow-sm overflow-hidden"
                >
                  {/* Thumbnail / Preview Click Area */}
                  <div
                    onClick={() => setPreviewClip(clip)}
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
                        <span className="text-[10px] font-mono">Không có ảnh xem trước</span>
                      </div>
                    )}

                    {/* Play Overlay icon on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-black/50 scale-90 group-hover:scale-100 transition">
                        <Play className="w-4 h-4 ml-0.5 fill-white" />
                      </div>
                    </div>

                    {/* Duration Badge */}
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-[11px] font-mono bg-black/80 backdrop-blur rounded text-zinc-300 flex items-center gap-1 border border-zinc-800">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDuration(clip.durationMs)}
                    </span>
                  </div>

                  {/* Card Meta & Actions */}
                  <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                      <span>{clip.width}x{clip.height}</span>
                      <span>{formatBytes(clip.fileSizeBytes)}</span>
                      <span>{formatDate(clip.createdAt)}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/60">
                      <button
                        onClick={() => handleCopy(clip.id, clip.filePath)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs rounded-lg font-medium transition ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã copy!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Copy Path</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleOpen(clip.filePath)}
                        title="Mở video bằng trình phát hệ thống"
                        className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700/40 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(clip.id)}
                        title="Xoá video"
                        className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-zinc-700/40 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Video Preview Modal */}
      {previewClip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <div className="text-xs font-mono text-zinc-400 truncate max-w-md">
                {previewClip.filePath}
              </div>
              <button
                onClick={() => setPreviewClip(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black aspect-video flex items-center justify-center">
              <video
                src={convertFileSrc(previewClip.filePath)}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
