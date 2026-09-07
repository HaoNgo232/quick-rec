import { Video, Search } from "lucide-react";
import { useVault } from "../context/VaultContext";

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
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            placeholder="Search recordings..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
          />
        </div>
      </div>

      {/* Record CTA Button */}
      <button
        onClick={actions.toggleRecord}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
          state.isRecording
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 animate-pulse"
            : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            state.isRecording ? "bg-amber-400" : "bg-red-500"
          }`}
        />
        {state.isRecording ? "Recording... (Click to stop)" : "Record Region"}
        <kbd className="ml-1 px-1 py-0.2 text-[10px] bg-zinc-900/60 rounded text-zinc-400 font-mono">
          Super+Shift+R
        </kbd>
      </button>
    </header>
  );
}
