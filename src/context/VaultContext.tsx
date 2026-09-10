import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { formatBytes } from "../utils/format";
import type { ClipRecord } from "../types";

export interface ToastInfo {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export interface VaultState {
  records: ClipRecord[];
  filteredRecords: ClipRecord[];
  searchQuery: string;
  isRecording: boolean;
  copiedId: number | null;
  previewClip: ClipRecord | null;
  totalSizeBytes: number;
  newlyRecordedId: number | null;
  toast: ToastInfo | null;
}

export interface VaultActions {
  setSearchQuery: (query: string) => void;
  toggleRecord: () => Promise<void>;
  copyPath: (clip: ClipRecord) => Promise<void>;
  openFile: (clip: ClipRecord) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  clearVault: () => Promise<void>;
  setPreviewClip: (clip: ClipRecord | null) => void;
  fetchRecords: () => Promise<void>;
  dismissToast: () => void;
}

export interface VaultContextValue {
  state: VaultState;
  actions: VaultActions;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function useVault(): VaultContextValue {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ClipRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [previewClip, setPreviewClip] = useState<ClipRecord | null>(null);
  const [newlyRecordedId, setNewlyRecordedId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  const recordsRef = useRef<ClipRecord[]>([]);
  recordsRef.current = records;

  const knownIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadedRef = useRef(false);

  const pendingDeletesRef = useRef<Map<number, { timer: ReturnType<typeof setTimeout>; clip: ClipRecord }>>(
    new Map()
  );
  const pendingClearRef = useRef<{ timer: ReturnType<typeof setTimeout>; records: ClipRecord[] } | null>(null);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const newlyRecordedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  };

  const showToast = (toastData: Omit<ToastInfo, "id">, duration = 5000) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const id = Date.now();
    setToast({ ...toastData, id });
    toastTimerRef.current = setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
      toastTimerRef.current = null;
    }, duration);
  };

  const fetchRecords = async (fromRecordingsUpdated = false) => {
    try {
      const list = await invoke<ClipRecord[]>("list_records", { limit: 100, offset: 0 });

      // If clear is currently pending, don't overwrite local optimistic empty state
      if (pendingClearRef.current) {
        return;
      }

      // Filter out any IDs currently in pending deletes
      const activeList = list.filter((r) => !pendingDeletesRef.current.has(r.id));

      if (fromRecordingsUpdated && isInitialLoadedRef.current) {
        const newlyAdded = activeList.filter((r) => !knownIdsRef.current.has(r.id));
        if (newlyAdded.length > 0) {
          const newest = newlyAdded.reduce((max, c) => (c.id > max.id ? c : max), newlyAdded[0]);
          setNewlyRecordedId(newest.id);
          if (newlyRecordedTimerRef.current) {
            clearTimeout(newlyRecordedTimerRef.current);
          }
          newlyRecordedTimerRef.current = setTimeout(() => {
            setNewlyRecordedId(null);
          }, 3000);

          showToast({ message: "Saved to Vault • Path copied to clipboard" }, 4000);
        }
      }

      knownIdsRef.current = new Set(list.map((r) => r.id));
      isInitialLoadedRef.current = true;
      setRecords(activeList);

      const isRec = await invoke<boolean>("is_recording");
      setIsRecording(isRec);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  useEffect(() => {
    fetchRecords(false);

    const handleFocusOrVisible = () => {
      fetchRecords(false);
    };

    window.addEventListener("focus", handleFocusOrVisible);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRecords(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let unlistenUpdated: (() => void) | undefined;
    let unlistenStatus: (() => void) | undefined;
    let unlistenCanceled: (() => void) | undefined;

    listen("recordings-updated", () => {
      fetchRecords(true);
    }).then((unlisten) => {
      unlistenUpdated = unlisten;
    });

    listen<boolean>("recording-status-changed", (event) => {
      setIsRecording(event.payload);
      fetchRecords(false);
    }).then((unlisten) => {
      unlistenStatus = unlisten;
    });

    listen("recording-canceled", () => {
      showToast({ message: "Region selection canceled" }, 3000);
    }).then((unlisten) => {
      unlistenCanceled = unlisten;
    });

    // Fallback sync every 2 seconds when visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchRecords(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
      if (unlistenUpdated) unlistenUpdated();
      if (unlistenStatus) unlistenStatus();
      if (unlistenCanceled) unlistenCanceled();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (newlyRecordedTimerRef.current) clearTimeout(newlyRecordedTimerRef.current);
    };
  }, []);

  const toggleRecord = async () => {
    try {
      const isNowRec = await invoke<boolean>("toggle_record");
      setIsRecording(isNowRec);
    } catch (err) {
      console.error("Toggle record failed:", err);
    }
  };

  const copyPath = async (clip: ClipRecord) => {
    try {
      await invoke("copy_path", { path: clip.filePath });
      setCopiedId(clip.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const openFile = async (clip: ClipRecord) => {
    try {
      await invoke("open_file", { path: clip.filePath });
    } catch (err) {
      console.error("Open file failed:", err);
    }
  };

  const deleteRecord = async (id: number) => {
    const clipToDelete = recordsRef.current.find((r) => r.id === id);
    if (!clipToDelete) return;

    // Optimistically remove from state
    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (previewClip?.id === id) {
      setPreviewClip(null);
    }

    // Cancel existing pending deletion timer if any
    if (pendingDeletesRef.current.has(id)) {
      clearTimeout(pendingDeletesRef.current.get(id)!.timer);
    }

    const timer = setTimeout(async () => {
      try {
        await invoke("delete_record", { id, removeFile: true });
      } catch (err) {
        console.error("Delete failed:", err);
      } finally {
        pendingDeletesRef.current.delete(id);
      }
    }, 5000);

    pendingDeletesRef.current.set(id, { timer, clip: clipToDelete });

    showToast(
      {
        message: "Recording deleted",
        actionLabel: "Undo",
        onAction: () => {
          const pending = pendingDeletesRef.current.get(id);
          if (pending) {
            clearTimeout(pending.timer);
            pendingDeletesRef.current.delete(id);
            setRecords((prev) => {
              if (prev.some((r) => r.id === id)) return prev;
              const updated = [pending.clip, ...prev];
              return updated.sort((a, b) => b.id - a.id);
            });
          }
          dismissToast();
        },
      },
      5000
    );
  };

  const totalSizeBytes = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.fileSizeBytes || 0), 0);
  }, [records]);

  const clearVault = async () => {
    if (records.length === 0) return;

    const savedRecords = [...recordsRef.current];
    const savedSize = totalSizeBytes;

    // Optimistically clear records
    setRecords([]);
    setPreviewClip(null);

    if (pendingClearRef.current) {
      clearTimeout(pendingClearRef.current.timer);
    }

    const timer = setTimeout(async () => {
      try {
        await invoke("clear_vault", { removeFiles: true });
      } catch (err) {
        console.error("Clear vault failed:", err);
      } finally {
        pendingClearRef.current = null;
      }
    }, 5000);

    pendingClearRef.current = { timer, records: savedRecords };

    showToast(
      {
        message: `Vault cleared (${formatBytes(savedSize)})`,
        actionLabel: "Undo",
        onAction: () => {
          if (pendingClearRef.current) {
            clearTimeout(pendingClearRef.current.timer);
            setRecords(pendingClearRef.current.records);
            pendingClearRef.current = null;
          }
          dismissToast();
        },
      },
      5000
    );
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.filePath.toLowerCase().includes(q) ||
        r.createdAt.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  const value: VaultContextValue = {
    state: {
      records,
      filteredRecords,
      searchQuery,
      isRecording,
      copiedId,
      previewClip,
      totalSizeBytes,
      newlyRecordedId,
      toast,
    },
    actions: {
      setSearchQuery,
      toggleRecord,
      copyPath,
      openFile,
      deleteRecord,
      clearVault,
      setPreviewClip,
      fetchRecords: () => fetchRecords(false),
      dismissToast,
    },
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
