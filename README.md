# Quick Screen Recorder (quick-rec) 🎥

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20X11-orange.svg)](#)

A minimal, blazingly fast screen region recorder with a built-in History Vault for Linux (Linux Mint, Ubuntu, Debian).
Toggle with a single shortcut, see a glowing red highlight box around the recorded area, have the video path copied directly to your clipboard the moment you stop, and manage all your clips in the History Vault.

---

## ✨ Features

- ⚡ **Instant 1-Hotkey Recording**: Press once to select area and start recording, press again to stop.
- 📋 **Auto Clipboard Path**: Video path is automatically copied to your clipboard on finish (`Ctrl + V` to paste anywhere).
- 🗄️ **History Vault**: Modern dark-themed vault with video preview thumbnails, 1-click path copy, search filtering, and built-in video player.
- 🔄 **Auto Hide & Focus**: The Vault window automatically hides while you select and record your region, and smoothly re-opens with your new clip when finished.
- 🔴 **Visual Highlight Border**: Clean 3px red bounding box framing the recorded area (visible on screen, but **never appears in the output MP4 video**).
- ⏱️ **Floating REC Badge**: A non-intrusive floating pill showing live recording duration (`REC 00:05`) and a clickable `[ ⏹ Stop ]` button.
- 🖱️ **Click-Through Support**: The entire recorded region is click-through — interact with your browser, editor, or terminal with zero interference.
- 🔊 **Audio Feedback**: Subtle sound chimes when recording begins and ends.
- 🌐 **Web & Messenger Ready**: Encoded in `H.264 / yuv420p` for 100% compatibility across Telegram, Discord, Slack, and web browsers.

---

## 📦 Requirements

- Linux with **X11** desktop session (Linux Mint Cinnamon, Ubuntu Xorg, Debian, etc.).
- Base tools: `git`, `curl` (the installer automatically handles the rest).

---

## 🚀 Installation

Run this single batch command to clone, build, install, and configure the shortcut automatically:

```bash
git clone https://github.com/HaoNgo232/quick-rec.git && cd quick-rec && ./install.sh
```

*`./install.sh` automatically installs system dependencies (`ffmpeg`, `slop`, `xclip`, etc.), builds the Debian package, installs it via `apt`, and registers the `Super + Shift + R` shortcut.*

---

## ⌨️ Default Shortcut & Usage

| Action | Shortcut / Control |
|---|---|
| **Toggle Record / Stop** | <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> (Windows + Shift + R) |
| **Stop Recording** | Click the floating **⏹ Stop** button OR press the shortcut again |
| **Open History Vault** | Search for **"Quick Screen Recorder"** in the Application Menu OR click the System Tray icon |

---

## 🗑️ Uninstallation

```bash
sudo apt remove quick-rec
```

---

## 📄 License

[MIT](LICENSE) © 2026 Hao
