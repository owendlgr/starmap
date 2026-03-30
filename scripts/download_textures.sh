#!/bin/bash
# Download planet textures from Solar System Scope
# License: CC-BY 4.0 — Attribution: Solar System Scope (solarsystemscope.com)
#
# Usage: bash scripts/download_textures.sh
#
# If the automated download fails (URLs may change), download manually from:
#   https://www.solarsystemscope.com/textures/
# and place the files in public/textures/ with the filenames listed below.

set -e

DEST="public/textures"
mkdir -p "$DEST"

BASE="https://www.solarsystemscope.com/textures/download"

echo "Downloading planet textures to $DEST ..."
echo "Source: Solar System Scope (CC-BY 4.0)"
echo ""

# Sun
echo "  sun.jpg"
curl -L --fail -o "$DEST/sun.jpg" "$BASE/2k_sun.jpg" 2>/dev/null || echo "    WARN: Failed to download sun.jpg — download manually from solarsystemscope.com/textures/"

# Mercury
echo "  mercury.jpg"
curl -L --fail -o "$DEST/mercury.jpg" "$BASE/2k_mercury.jpg" 2>/dev/null || echo "    WARN: Failed to download mercury.jpg"

# Venus (surface)
echo "  venus.jpg"
curl -L --fail -o "$DEST/venus.jpg" "$BASE/2k_venus_surface.jpg" 2>/dev/null || echo "    WARN: Failed to download venus.jpg"

# Earth (day map)
echo "  earth_day.jpg"
curl -L --fail -o "$DEST/earth_day.jpg" "$BASE/2k_earth_daymap.jpg" 2>/dev/null || echo "    WARN: Failed to download earth_day.jpg"

# Mars
echo "  mars.jpg"
curl -L --fail -o "$DEST/mars.jpg" "$BASE/2k_mars.jpg" 2>/dev/null || echo "    WARN: Failed to download mars.jpg"

# Jupiter
echo "  jupiter.jpg"
curl -L --fail -o "$DEST/jupiter.jpg" "$BASE/2k_jupiter.jpg" 2>/dev/null || echo "    WARN: Failed to download jupiter.jpg"

# Saturn
echo "  saturn.jpg"
curl -L --fail -o "$DEST/saturn.jpg" "$BASE/2k_saturn.jpg" 2>/dev/null || echo "    WARN: Failed to download saturn.jpg"

# Uranus
echo "  uranus.jpg"
curl -L --fail -o "$DEST/uranus.jpg" "$BASE/2k_uranus.jpg" 2>/dev/null || echo "    WARN: Failed to download uranus.jpg"

# Neptune
echo "  neptune.jpg"
curl -L --fail -o "$DEST/neptune.jpg" "$BASE/2k_neptune.jpg" 2>/dev/null || echo "    WARN: Failed to download neptune.jpg"

# Moon
echo "  moon.jpg"
curl -L --fail -o "$DEST/moon.jpg" "$BASE/2k_moon.jpg" 2>/dev/null || echo "    WARN: Failed to download moon.jpg"

echo ""
echo "Done. Check $DEST for downloaded files."
echo "Missing files can be downloaded manually from https://www.solarsystemscope.com/textures/"
