import { Video, Search, Trash2, X } from "lucide-react";
import { useVault } from "../context/VaultContext";
import { formatBytes } from "../utils/format";

export function Header() {
  const { state, actions } = useVault();

  return (
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
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Search recordings..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
          {state.searchQuery && (
            <button
              onClick={() => actions.setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 p-0.5 rounded hover:bg-zinc-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {state.records.length > 0 && (
          <button
            onClick={actions.clearVault}
            title={`Clear vault and free up ${formatBytes(state.totalSizeBytes)} (5s undo available)`}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 transition shadow-sm select-none"
          >
            <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-red-400 transition-colors" />
            <span>Clear All</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 group-hover:bg-red-950/60 text-zinc-400 group-hover:text-red-300 border border-zinc-700/50 group-hover:border-red-900/50 transition-colors">
              {formatBytes(state.totalSizeBytes)}
            </span>
          </button>
        )}

        {/* Record CTA Button */}
        <button
          onClick={actions.toggleRecord}
          className={`relative isolate flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm select-none ${
            state.isRecording
              ? "bg-red-600 hover:bg-red-700 text-white border border-red-500 animate-pulse"
              : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              state.isRecording ? "bg-white" : "bg-red-500"
            }`}
          />
          <span key={state.isRecording ? "rec-active" : "rec-idle"}>
            {state.isRecording ? "Stop Recording" : "Record Region"}
          </span>
          <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-black/40 rounded text-zinc-300 font-mono">
            Super+Shift+R
          </kbd>
        </button>
      </div>
    </header>
  );
}
