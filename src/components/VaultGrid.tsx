import { Sparkles } from "lucide-react";
import { useVault } from "../context/VaultContext";
import { ClipCard } from "./ClipCard";

export function VaultGrid() {
  const { state, actions } = useVault();
  const records = state.filteredRecords;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
          <Sparkles className="w-5 h-5 text-zinc-500" />
        </div>
        <p className="text-sm font-medium text-zinc-300">Chưa có clip nào trong Vault</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Bấm phím tắt{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[11px]">
            Super + Shift + R
          </kbd>{" "}
          để chọn vùng và quay clip đầu tiên!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {records.map((clip) => (
        <ClipCard.Root key={clip.id} clip={clip}>
          <ClipCard.Thumbnail onPreview={() => actions.setPreviewClip(clip)} />
          <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
            <ClipCard.Meta />
            <ClipCard.Actions>
              <ClipCard.CopyButton />
              <ClipCard.OpenButton />
              <ClipCard.DeleteButton />
            </ClipCard.Actions>
          </div>
        </ClipCard.Root>
      ))}
    </div>
  );
}
