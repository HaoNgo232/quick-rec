import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { ClipRecord } from "../types";

export interface VaultState {
  records: ClipRecord[];
  filteredRecords: ClipRecord[];
  searchQuery: string;
  isRecording: boolean;
  copiedId: number | null;
  previewClip: ClipRecord | null;
}

export interface VaultActions {
  setSearchQuery: (query: string) => void;
  toggleRecord: () => Promise<void>;
  copyPath: (clip: ClipRecord) => Promise<void>;
  openFile: (clip: ClipRecord) => Promise<void>;
  deleteRecord: (id: number) => Promise<void>;
  setPreviewClip: (clip: ClipRecord | null) => void;
  fetchRecords: () => Promise<void>;
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

  const fetchRecords = async () => {
    try {
      const list = await invoke<ClipRecord[]>("list_records", { limit: 100, offset: 0 });
      setRecords(list);
      const isRec = await invoke<boolean>("is_recording");
      setIsRecording(isRec);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    }
  };

  useEffect(() => {
    fetchRecords();

    const unlistenPromise = listen("recordings-updated", () => {
      fetchRecords();
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
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
    if (!confirm("Are you sure you want to delete this recording?")) return;
    try {
      await invoke("delete_record", { id, removeFile: true });
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (previewClip?.id === id) setPreviewClip(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.filePath.toLowerCase().includes(q) ||
        r.createdAt.toLowerCase().includes(q),
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
    },
    actions: {
      setSearchQuery,
      toggleRecord,
      copyPath,
      openFile,
      deleteRecord,
      setPreviewClip,
      fetchRecords,
    },
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}
