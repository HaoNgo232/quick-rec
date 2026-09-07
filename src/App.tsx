import { VaultProvider } from "./context/VaultContext";
import { Header } from "./components/Header";
import { VaultGrid } from "./components/VaultGrid";
import { PreviewModal } from "./components/PreviewModal";

export default function App() {
  return (
    <VaultProvider>
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500 selection:text-white">
        <Header />
        <main className="flex-1 overflow-y-auto p-5">
          <VaultGrid />
        </main>
        <PreviewModal />
      </div>
    </VaultProvider>
  );
}
