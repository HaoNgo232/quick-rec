# quick-rec

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20X11-orange.svg)](#)

A minimal region screen recorder with a built-in History Vault for Linux (X11). Built with Tauri v2, Rust, and React.

When toggled, it prompts for a screen region, records video, and copies the resulting MP4 path directly to the clipboard upon completion. Recorded clips are indexed in a local SQLite vault with thumbnail previews and in-app playback.

---

## Features

- **Region capture**: Select any screen area using `slop` before recording begins.
- **Immediate clipboard integration**: The absolute path to the output `.mp4` file is copied to the clipboard when recording stops.
- **History Vault**: Local SQLite-backed database of past recordings with search, thumbnail previews, playback, and deletion.
- **Visual boundary overlay**: Red bounding border frames the active recording area on-screen without being captured into the video stream.
- **Live timer badge**: Small floating widget displaying duration with a stop button.
- **Input pass-through**: The recorded area remains fully interactive during capture.
- **Standard encoding**: Output is encoded in H.264 (`yuv420p`) for compatibility with web browsers, Slack, Discord, and Telegram.
- **Daemon architecture**: Background daemon with Unix domain socket control and system tray integration.

---

## Installation

### Script installation

Run the automated installer:

```bash
curl -fsSL https://raw.githubusercontent.com/HaoNgo232/quick-rec/main/install.sh | bash
```

The script verifies build dependencies, compiles the package if no pre-built package exists, installs the `.deb` package via `apt`, and configures the default Cinnamon shortcut if applicable.

### Manual package installation

If `dist/quick-rec_1.0.0_all.deb` is present:

```bash
sudo apt update
sudo apt install -y ./dist/quick-rec_1.0.0_all.deb
```

---

## Usage

### Shortcuts

| Action | Binding |
|---|---|
| Toggle recording (Start / Stop) | <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> |
| Stop active recording | Click **Stop** on the floating badge or press the shortcut again |
| Open History Vault | Click system tray icon or launch `quick-rec` from menu |

### Command Line Interface

The application daemon listens on a local Unix domain socket (`quick-rec-<uid>.sock`). External tools and desktop keybindings can control the recorder directly:

```bash
# Toggle recording state (region selection -> record -> stop)
quick-rec --toggle

# Focus or open the History Vault window
quick-rec

# Stop recording immediately if active
quick-rec --stop
```

---

## Building from Source

### Requirements

- `bun` (1.0+)
- `cargo` / `rustc` (1.75+)
- Linux packages: `build-essential`, `ffmpeg`, `slop`, `xclip`, `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`

### Build process

```bash
# Clone repository
git clone https://github.com/HaoNgo232/quick-rec.git
cd quick-rec

# Install dependencies and build release Debian package
./build.sh
```

The compiled package will be placed in `dist/quick-rec_1.0.0_all.deb`.

---

## Troubleshooting

- **Wayland environments**: Currently, `quick-rec` targets X11 sessions (`x11grab` and `slop`). On Wayland systems, select an X11 / Xorg session at login.
- **Video playback in Vault**: WebKitGTK requires HTTP byte-range support for MP4 playback. If videos fail to play, ensure GStreamer H.264 plugins are installed:
  ```bash
  sudo apt install -y gstreamer1.0-plugins-good gstreamer1.0-plugins-bad gstreamer1.0-libav
  ```
- **Custom shortcut**: If <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> is reserved by another application, bind your preferred shortcut in desktop settings to run `quick-rec --toggle`.

---

## Uninstallation

```bash
sudo apt remove quick-rec
```

---

## License

MIT License. See [LICENSE](LICENSE).
