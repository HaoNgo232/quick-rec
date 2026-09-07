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
            placeholder="Tìm kiếm video..."
            value={state.searchQuery}
            onChange={(e) => actions.setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 placeholder-zinc-500 focus:outline-none focus:border-red-500/60 transition"
          />
        </div>
      </div>

      {/* Record CTA Button */}
      <button
        onClick={actions.toggleRecord}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm ${
          state.isRecording
            ? "bg-red-600 text-white hover:bg-red-700 animate-pulse"
            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            state.isRecording ? "bg-white" : "bg-red-500"
          }`}
        />
        {state.isRecording ? "Đang quay... (Bấm dừng)" : "Quay ngay"}
        <kbd className="ml-1 px-1 py-0.2 text-[10px] bg-zinc-900/60 rounded text-zinc-400 font-mono">
          Super+Shift+R
        </kbd>
      </button>
    </header>
  );
}
