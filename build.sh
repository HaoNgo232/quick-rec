#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION="1.0.0"
PKG_DIR="${DIR}/build/quick-rec_${VERSION}_all"
DIST_DIR="${DIR}/dist"

echo "==> Building Frontend & Tauri Release Binary..."
bun run build
cd src-tauri && cargo build --release && cd ..

echo "==> Packaging quick-rec version ${VERSION}..."
rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/bin"
mkdir -p "${PKG_DIR}/usr/share/applications"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/scalable/apps"
mkdir -p "${DIST_DIR}"

# Copy files
cp "${DIR}/debian/control" "${PKG_DIR}/DEBIAN/"
cp "${DIR}/debian/postinst" "${PKG_DIR}/DEBIAN/"
cp "${DIR}/src-tauri/target/release/quick-rec" "${PKG_DIR}/usr/bin/"
strip "${PKG_DIR}/usr/bin/quick-rec" || true
cp "${DIR}/scripts/quick-rec-overlay" "${PKG_DIR}/usr/bin/" || true
cp "${DIR}/data/quick-rec.desktop" "${PKG_DIR}/usr/share/applications/"
cp "${DIR}/data/quick-rec.svg" "${PKG_DIR}/usr/share/icons/hicolor/scalable/apps/"

# Fix permissions
find "${PKG_DIR}" -type d -exec chmod 755 {} +
chmod 755 "${PKG_DIR}/DEBIAN/postinst"
chmod 644 "${PKG_DIR}/DEBIAN/control"
chmod 755 "${PKG_DIR}/usr/bin/"*
chmod 644 "${PKG_DIR}/usr/share/applications/"*
chmod 644 "${PKG_DIR}/usr/share/icons/hicolor/scalable/apps/"*

# Build Debian package
dpkg-deb --root-owner-group --build "${PKG_DIR}" "${DIST_DIR}/quick-rec_${VERSION}_all.deb"

echo "==> Package built successfully at: ${DIST_DIR}/quick-rec_${VERSION}_all.deb"
