# AGENTS.md

Operating guide for autonomous AI agents working in `quick-rec`.

## Project Overview

Quick Rec is a minimal, fast region screen recorder with a built-in History Vault for Linux (X11) built with Tauri v2, Rust, and React (TypeScript + Tailwind CSS).

## Invariants & Guardrails

- **Language**: All user-facing UI copy, tooltips, modal dialogs, code comments, and commit messages must be strictly in **English**.
- **WebKitGTK MP4 Playback**: WebKitGTK GStreamer requires HTTP 206 Partial Content for MP4 playback, which fails on custom `asset://` protocols. Video playback in UI must fetch raw bytes via `get_video_data` IPC and instantiate an in-memory blob URL (`URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }))`).
- **WebKitGTK Font Rendering**: Avoid transparent backgrounds on dynamically toggled buttons. Use solid classes (`bg-red-600`, `bg-zinc-800`), `relative isolate`, and unique React `key` props on dynamic text spans to prevent glyph ghosting.
- **Audio & Visual Feedback**: Recording starts and stops with audio chimes (`paplay`). The red border overlay uses `X11_BYPASS_WM` for click-through support and never leaks into the output video. Do not introduce intrusive desktop popup notifications.
- **Single Instance Control**: The background daemon communicates via a Unix domain socket at runtime (`quick-rec-<uid>.sock`). Invoking `quick-rec` sends `show\n` to restore the Vault window; `quick-rec --toggle` sends `toggle\n`.

## Architecture & Platform Seams

- **Frontend (`src/`)**: React 18 + Vite + Tailwind CSS. Single unified `VaultContext` coordinates recordings state, search queries, IPC invocations, and live event listeners (`recordings-updated`, `recording-status-changed`).
- **Backend (`src-tauri/src/`)**:
  - `main.rs`: Tauri application lifecycle, global shortcut (`Super+Shift+R`), system tray, and single-instance socket listener.
  - `recorder.rs`: Region selection via `slop`, ffmpeg invocation (`x11grab`, `libx264`, `yuv420p`, `ultrafast`), overlay process lifecycle.
  - `vault.rs`: SQLite database (`vault.db`), thumbnail generation via ffmpeg, record querying, and physical file deletion (`clear_all`).
  - `deskboard.rs`: Clipboard path propagation (`xclip` and `arboard`) and audio feedback (`paplay`).
- **Cross-Platform Roadmap**: Windows support issues (#2 - #6) use a compile-time platform seam behind `platform::*` preserving Linux X11 100% backward compatibility.

## Verification & Build Workflows

- **Frontend Typecheck & Build**:
  ```bash
  bun run build
  ```
- **Backend Unit Tests**:
  ```bash
  cd src-tauri && cargo test
  ```
- **Release Packaging**:
  ```bash
  ./build.sh
  ```
  Generates `dist/quick-rec_1.0.0_all.deb` and updates release binaries.
- **Local Binary Deployment**:
  ```bash
  install -m 755 src-tauri/target/release/quick-rec ~/.local/bin/quick-rec
  ```

## Definition of Done

A task or feature is complete when:
1. `cargo test` passes in `src-tauri` with zero test failures or regressions.
2. `bun run build` compiles clean without TypeScript or Vite errors.
3. `./build.sh` finishes with exit code 0.
4. Git commits follow conventional commits format (`feat(...)`, `fix(...)`, `refactor(...)`) in English.
