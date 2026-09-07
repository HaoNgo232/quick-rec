#!/bin/bash
set -e

# Support running directly via: curl -fsSL https://.../install.sh | bash
if [ -z "${BASH_SOURCE[0]}" ] || [ ! -f "${BASH_SOURCE[0]}" ]; then
    TMP_DIR=$(mktemp -d /tmp/quick-rec-XXXXXX)
    echo "==> Cloning quick-rec repository..."
    git clone --depth 1 https://github.com/HaoNgo232/quick-rec.git "$TMP_DIR"
    (cd "$TMP_DIR" && ./install.sh)
    rm -rf "$TMP_DIR"
    exit 0
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
DEB_FILE="${DIR}/dist/quick-rec_${VERSION}_all.deb"

# Build if package does not exist
if [ ! -f "$DEB_FILE" ]; then
    echo "==> Package not found, building first..."
    "${DIR}/build.sh"
fi

echo "============================================="
echo "   QUICK SCREEN RECORDER INSTALLATION        "
echo "============================================="

echo "[1/2] Installing application package and dependencies..."
sudo apt update || true
sudo apt install -y "$DEB_FILE"

# Configure Super+Shift+R shortcut for Cinnamon Desktop
if command -v gsettings >/dev/null 2>&1 && [ "$XDG_CURRENT_DESKTOP" = "X-Cinnamon" ]; then
    echo "[2/2] Configuring Super+Shift+R shortcut for Cinnamon..."
    CURRENT_LIST=$(gsettings get org.cinnamon.desktop.keybindings custom-list)
    if [[ "$CURRENT_LIST" != *"quick-rec"* ]]; then
        NEW_LIST=$(echo "$CURRENT_LIST" | sed "s/]/, 'quick-rec']/")
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ name 'Quick Screen Recorder'
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ command 'quick-rec --toggle'
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ binding "['<Super><Shift>r']"
        gsettings set org.cinnamon.desktop.keybindings custom-list "$NEW_LIST"
        if command -v cinnamon-dbus-command >/dev/null 2>&1; then
            cinnamon-dbus-command RestartCinnamon 0 >/dev/null 2>&1 || true
        fi
    else
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ command 'quick-rec --toggle'
    fi
fi

echo "============================================="
echo "   ✅ INSTALLATION COMPLETE!                 "
echo "============================================="
echo "Usage:"
echo "1. Press hotkey: Super + Shift + R"
echo "   (Or launch 'Quick Screen Recorder' from the Application Menu)"
echo "2. Drag to select the screen region."
echo "3. Click [⏹ Stop] on the floating badge OR press Super + Shift + R again."
echo "4. Video path is automatically copied to your clipboard (Ctrl + V to paste)!"
echo "5. History Vault window opens automatically to view your clips."
