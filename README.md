# quick-rec

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Linux%20X11-orange.svg)](#)

A screen recorder and recording manager for Linux (X11), built with Tauri v2, Rust, and React.

`quick-rec` allows recording the full desktop or selected screen regions via hotkeys or the command line. Upon completion, recordings are encoded as MP4 files, their paths are copied to the system clipboard, and records are stored in a local SQLite-backed history vault.

---

## Features

- **Fullscreen and Region Recording**: Record the entire display or select an arbitrary desktop region with `slop`.
- **Click-Through Visual Overlay**: Displays a red border around the capture area along with a duration badge and a stop button. The overlay does not appear in the exported video.
- **Automatic Clipboard Integration**: Copies the absolute file path of the completed recording directly to the clipboard.
- **History Vault**: Local interface to browse recordings, view generated thumbnails, preview video playback, filter clips, copy paths, or delete entries.
- **Single-Instance Daemon**: Runs in the background with system tray integration and communicates with additional CLI invocations via a local Unix domain socket.
- **Standard Video Encoding**: Uses FFmpeg (`x11grab`, H.264, `yuv420p`) for broad compatibility across players and web platforms.

---

## Requirements

The application requires an active **X11** desktop session and the following system packages:

- `ffmpeg` (video encoding and thumbnail extraction)
- `slop` (interactive screen region selection)
- `xclip` (clipboard management)
- `python3`, `python3-gi`, `python3-cairo`, `gir1.2-gtk-3.0`, `gir1.2-pangocairo-1.0` (recording overlay window)

On Debian and Ubuntu-based distributions, these can be installed with:

```bash
sudo apt install ffmpeg slop xclip python3 python3-gi python3-cairo gir1.2-gtk-3.0 gir1.2-pangocairo-1.0
```

---

## Installation

### Automated Installer (Debian / Ubuntu / Linux Mint)

The repository provides an installation script that resolves dependencies, builds or installs the Debian package, and sets up desktop shortcuts:

```bash
curl -fsSL https://raw.githubusercontent.com/HaoNgo232/quick-rec/main/install.sh | bash
```

Alternatively, clone the repository and run the script locally:

```bash
git clone https://github.com/HaoNgo232/quick-rec.git
cd quick-rec
./install.sh
```

### Building from Source

Prerequisites:
- [Rust](https://www.rust-lang.org/) (stable toolchain)
- [Bun](https://bun.sh/) or Node.js (v18+)
- Tauri system dependencies (`libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`)

1. Install frontend dependencies:
   ```bash
   bun install
   ```

2. Build the frontend and release binary:
   ```bash
   bun run build
   cd src-tauri && cargo build --release
   ```

3. To generate a Debian package:
   ```bash
   ./build.sh
   ```
   The `.deb` installer will be located in `dist/`.

---

## Usage

### Shortcuts

| Action | Default Shortcut | Description |
|---|---|---|
| **Toggle Region Recording** | `Super` + `Shift` + `R` | Prompts for a selection box and starts recording. Pressing again stops recording. |
| **Toggle Fullscreen Recording** | `Super` + `Shift` + `F` | Starts recording the entire primary display immediately. Pressing again stops recording. |

Recording can also be stopped at any time by clicking the **Stop** button on the floating screen badge.

### Command-Line Interface

If an instance is already running in the background, invoking `quick-rec` with CLI flags sends commands to the active daemon via its Unix domain socket:

```bash
# Open or focus the History Vault window
quick-rec

# Toggle region recording (select area or stop active session)
quick-rec --toggle

# Toggle fullscreen recording (start or stop)
quick-rec --fullscreen
```

### System Tray & History Vault

- **System Tray Icon**: Left-click toggles the History Vault window visibility. Right-click provides actions to start recording, open the vault, or quit the application.
- **Closing the Vault**: Closing the History Vault window minimizes the application to the system tray rather than terminating it.
- **Playback**: Selecting a recording in the Vault opens an in-app player. The file can also be revealed in the system file manager or opened in default desktop applications.

---

## File Storage Locations

- **Recordings**: Saved to `~/Videos/quick-rec/` (or `$XDG_VIDEOS_DIR/quick-rec/`) as `clip_YYYYMMDD_HHMMSS.mp4`.
- **Database & Thumbnails**: Stored in `~/.local/share/quick-rec/` (`vault.db` and `thumbnails/`).
- **Runtime Socket**: Created at `$XDG_RUNTIME_DIR/quick-rec-<uid>.sock` for single-instance inter-process communication.

---

## Uninstallation

To remove the Debian package:

```bash
sudo apt remove quick-rec
```

To remove application database files and thumbnails:

```bash
rm -rf ~/.local/share/quick-rec
```

---

## License

[MIT](LICENSE) © 2026 Hao
