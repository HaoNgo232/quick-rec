#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
DEB_FILE="${DIR}/dist/quick-rec_${VERSION}_all.deb"

# Build if package does not exist
if [ ! -f "$DEB_FILE" ]; then
    echo "==> Package not found, building first..."
    "${DIR}/build.sh"
fi

echo "============================================="
echo "   CÀI ĐẶT QUICK SCREEN RECORDER             "
echo "============================================="

echo "[1/2] Đang cài đặt gói ứng dụng và các phần mềm phụ thuộc..."
sudo apt update || true
sudo apt install -y "$DEB_FILE"

# Đăng ký phím tắt Super+Shift+R nếu đang chạy Cinnamon Desktop
if command -v gsettings >/dev/null 2>&1 && [ "$XDG_CURRENT_DESKTOP" = "X-Cinnamon" ]; then
    echo "[2/2] Đang cấu hình phím tắt Super+Shift+R cho Cinnamon..."
    CURRENT_LIST=$(gsettings get org.cinnamon.desktop.keybindings custom-list)
    if [[ "$CURRENT_LIST" != *"quick-rec"* ]]; then
        NEW_LIST=$(echo "$CURRENT_LIST" | sed "s/]/, 'quick-rec']/")
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ name 'Quay màn hình nhanh'
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ command '/usr/bin/quick-rec'
        gsettings set org.cinnamon.desktop.keybindings.custom-keybinding:/org/cinnamon/desktop/keybindings/custom-keybindings/quick-rec/ binding "['<Super><Shift>r']"
        gsettings set org.cinnamon.desktop.keybindings custom-list "$NEW_LIST"
        if command -v cinnamon-dbus-command >/dev/null 2>&1; then
            cinnamon-dbus-command RestartCinnamon 0 >/dev/null 2>&1 || true
        fi
    fi
fi

echo "============================================="
echo "   ✅ CÀI ĐẶT THÀNH CÔNG!                     "
echo "============================================="
echo "Cách sử dụng:"
echo "1. Bấm phím tắt: Super + Shift + R (Windows + Shift + R)"
echo "   (Hoặc mở 'Quay màn hình nhanh' từ Menu ứng dụng)"
echo "2. Kéo chọn vùng màn hình."
echo "3. Bấm nút [⏹ Dừng quay] trên thanh nổi hoặc bấm lại Super + Shift + R."
echo "4. Đường dẫn video tự động nằm sẵn trong Clipboard (Ctrl + V để dán)!"
