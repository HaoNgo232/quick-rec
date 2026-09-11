# Quick Rec 🎥

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20X11%20%7C%20Windows%20(WIP)-orange.svg)](#)
[![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-red?logo=rust)](https://www.rust-lang.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![Bun](https://img.shields.io/badge/Bun-1.0%2B-black?logo=bun)](https://bun.sh)

A minimal, blazingly fast screen region recorder with a built-in **History Vault** for Linux (Linux Mint, Ubuntu, Debian) and Windows (in progress). Built with **Tauri v2**, **Rust**, and **React**.

Press a single hotkey, drag to select any region on your screen, and let Quick Rec record without cluttering your workflow. The moment you stop, the MP4 video path is instantly copied to your clipboard ready to paste into Telegram, Slack, or GitHub, and your clip is organized neatly in your local History Vault.

---

## ⚡ Why Quick Rec?

Most screen recording tools are either bloated full-screen broadcasters (OBS), slow web-based recorders, or lack quick file sharing integration. Quick Rec is built with a focused Unix philosophy:

- **Zero Friction**: 1 global hotkey to toggle recording on and off.
- **Auto-Clipboard**: No file picker dialogs. As soon as recording completes, the exact file path is in your clipboard (`Ctrl + V`).
- **Clean Output**: Visual borders and timer badge guide your eyes during recording, but **never appear in the final video**.
- **Ultra-Light Daemon**: Sits in your system tray using minimal RAM (< 25 MB) with instant IPC startup.

---

## ✨ Features

- 🎯 **Region Selection**: Fast, pixel-precise screen selection powered by `slop` (Linux) / native picker (Windows).
- 📋 **Automatic Clipboard Path**: Full path to the recorded `.mp4` is automatically placed into your clipboard upon stopping.
- 🗄️ **History Vault**: Dark-themed vault powered by SQLite:
  - Video preview thumbnails generated automatically with ffmpeg.
  - In-app video playback (custom HTTP byte-range streaming for WebKitGTK / WebView2).
  - Search by file name or date.
  - One-click file path copying and bulk cleanup.
- 🔴 **Non-Intrusive Visual Border**: Glowing red bounding box framing the capture area (visible only to you, bypassed by ffmpeg capture).
- ⏱️ **Floating REC Badge**: Draggable badge showing live duration (`REC 00:05`) with a direct `[ ⏹ Stop ]` button.
- 🖱️ **Full Click-Through**: Interact with your browser, IDE, or terminal inside the recorded region with zero latency or mouse blockage.
- 🔊 **Audio Chimes**: Subtle start and stop sound notifications.
- 🌐 **Web-Ready MP4**: Encoded using `H.264 / yuv420p` with even-dimension normalization for guaranteed compatibility across Discord, Slack, browsers, and mobile players.

---

## 🚀 Quick Install (Linux)

Run the one-line installer in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/HaoNgo232/quick-rec/main/install.sh | bash
```

The installer will:
1. Check or build the package from source using Bun and Cargo.
2. Install system dependencies (`ffmpeg`, `slop`, `xclip`, `pulseaudio-utils`).
3. Install the Debian package (`.deb`) via `apt`.
4. Register the default global shortcut (<kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>) on Cinnamon / X11.

---

## ⌨️ Shortcuts & Controls

| Action | Control | Description |
|---|---|---|
| **Toggle Record / Stop** | <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> | Starts region selection or stops active recording |
| **Stop via GUI** | Click `[ ⏹ Stop ]` | Stop button located on the floating duration badge |
| **Open History Vault** | System Tray Icon | Click Quick Rec tray icon or launch from app menu |
| **Copy Video Path** | Automatic / Vault | Path copied immediately on stop, or click clip card in Vault |

---

## 💻 CLI Commands & Single-Instance IPC

Quick Rec runs a lightweight daemon socket (`quick-rec-<uid>.sock`). You can control the app from external scripts, terminal aliases, or desktop environment keybindings:

```bash
# Toggle recording (select region -> record -> stop)
quick-rec --toggle

# Bring the History Vault window to the front
quick-rec

# Stop active recording without toggling new one
quick-rec --stop
```

---

## 🛠️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Quick Rec App                          │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │     React Frontend    │       │     Tauri v2 Core     │  │
│  │   (Vault UI / Video)  │◄─────►│    (Rust Commands)    │  │
│  └───────────────────────┘       └───────────┬───────────┘  │
│                                              │              │
│                  Platform Abstraction Seam   │              │
│       ┌──────────────────────────────────────┴──────────┐   │
│       ▼                                                 ▼   │
│  ┌────────────────────────┐                   ┌──────────┐  │
│  │      Linux (X11)       │                   │ Windows  │  │
│  │ - slop (region picker) │                   │ - GDI    │  │
│  │ - ffmpeg (x11grab)     │                   │ - gdigrab│  │
│  │ - Unix domain socket   │                   │ - Pipes  │  │
│  │ - xclip & paplay       │                   │ - arboard│  │
│  └────────────────────────┘                   └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Vite.
- **Backend Core**: Tauri v2, Rust, SQLite (`vault.db`), system tray listener.
- **Platform Seam**: Platform-agnostic traits (`platform::*`) isolating OS-specific screen capture, audio feedback, and IPC socket mechanisms.

---

## 🧑‍💻 Developer Guide

### Prerequisites

- **Node / Bun**: [Bun 1.0+](https://bun.sh)
- **Rust Toolchain**: [Rustup / Cargo](https://rustup.rs) (1.75+)
- **Linux Packages**:
  ```bash
  sudo apt install -y build-essential curl ffmpeg slop xclip libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
  ```

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HaoNgo232/quick-rec.git
   cd quick-rec
   ```

2. **Install frontend dependencies**:
   ```bash
   bun install
   ```

3. **Run development mode** (hot-reload UI + Rust backend):
   ```bash
   bun run tauri dev
   ```

4. **Run backend unit tests**:
   ```bash
   cd src-tauri && cargo test
   ```

5. **Typecheck & Frontend build**:
   ```bash
   bun run build
   ```

### Packaging & Release

To compile the release binary and generate a standalone Debian (`.deb`) package:

```bash
./build.sh
```

Output package will be generated at:
```
dist/quick-rec_1.0.0_all.deb
```

To install your locally built package:
```bash
sudo apt install -y ./dist/quick-rec_1.0.0_all.deb
```

---

## ❓ Troubleshooting

<details>
<summary><b>1. Recording does not start after pressing shortcut</b></summary>

- Ensure `slop` and `ffmpeg` are installed: `which slop ffmpeg`.
- If you are running Wayland, Quick Rec currently targets X11 sessions. Log in to an "Ubuntu on Xorg" or "X11" desktop session.
</details>

<details>
<summary><b>2. Video playback in History Vault shows blank or loading</b></summary>

- WebKitGTK requires HTTP 206 Partial Content for MP4 streaming. Quick Rec uses an internal streaming protocol to feed video bytes into an in-memory blob URL. If you encounter issues, ensure your system has GStreamer H.264 plugins installed:
  ```bash
  sudo apt install -y gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav
  ```
</details>

<details>
<summary><b>3. Shortcut conflict</b></summary>

- If `Super + Shift + R` is reserved by your system or another tool (like GNOME screenshot), customize the keybinding in your desktop environment's Keyboard Settings and map your desired shortcut to command:
  ```bash
  quick-rec --toggle
  ```
</details>

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 Hao.
