# Quick Screen Recorder (quick-rec) 🎥

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20X11-orange.svg)](#)

A minimal, blazingly fast screen region recorder for Linux (Linux Mint, Ubuntu, Debian).
Toggle with a single shortcut, see a glowing red highlight box around the recorded area, and have the video path copied directly to your clipboard the moment you stop.

---

## ✨ Features

- ⚡ **Instant 1-Hotkey Recording**: Press once to select area and start recording, press again to stop.
- 📋 **Auto Clipboard Path**: Video path is automatically copied to your clipboard on finish (`Ctrl + V` to paste anywhere).
- 🔴 **Visual Highlight Border**: Clean 3px red bounding box framing the recorded area (visible on screen, but **never appears in the output MP4 video**).
- ⏱️ **Floating REC Badge**: A non-intrusive floating pill showing live recording duration (`REC 00:05`) and a clickable `[ ⏹ Stop ]` button.
- 🖱️ **Click-Through Support**: The entire recorded region is click-through — interact with your browser, editor, or terminal with zero interference.
- 🔊 **Audio Feedback**: Subtle sound chimes when recording begins and ends.
- 🌐 **Web & Messenger Ready**: Encoded in `H.264 / yuv420p` for 100% compatibility across Telegram, Discord, Slack, and web browsers.

---

## 📦 Requirements

- Linux with **X11** desktop session (Linux Mint Cinnamon, Ubuntu Xorg, Debian, etc.).
- Packages: `ffmpeg`, `slop`, `xclip`, `python3`, `python3-gi`, `python3-cairo`.

---

## 🚀 Installation

### Option 1: Automatic Installer (Recommended)

Clone the repository and run:
```bash
git clone https://github.com/your-username/quick-rec.git
cd quick-rec
./install.sh
```
*`install.sh` builds the `.deb` package, installs dependencies via `apt`, and registers the `Super + Shift + R` shortcut.*

### Option 2: Build and Install with Make
```bash
make
sudo apt install ./dist/quick-rec_1.0.0_all.deb
```

---

## ⌨️ Default Shortcut

| Action | Shortcut |
|---|---|
| **Toggle Record / Stop** | <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (Windows + Shift + R) |
| **Stop Recording** | Click the floating **⏹ Stop** button OR press the shortcut again |

*You can also launch it directly from the Application Menu by searching for **"Quay màn hình nhanh"** or **"Quick Screen Recorder"**.*

---

## 🗑️ Uninstallation

```bash
sudo apt remove quick-rec
```

---

## 📄 License

[MIT](LICENSE) © 2026 Hao
