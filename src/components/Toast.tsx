import { X } from "lucide-react";
import { useVault } from "../context/VaultContext";

export function Toast() {
  const { state, actions } = useVault();
  const toast = state.toast;

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2.5 shadow-xl flex items-center gap-3 text-xs">
        <span className="font-medium">{toast.message}</span>
        {toast.actionLabel && toast.onAction && (
          <button
            onClick={toast.onAction}
            className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors ml-1"
          >
            {toast.actionLabel}
          </button>
        )}
        <button
          onClick={actions.dismissToast}
          aria-label="Dismiss notification"
          className="text-zinc-400 hover:text-zinc-200 ml-1 p-0.5 rounded hover:bg-zinc-800 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
