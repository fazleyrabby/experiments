#!/usr/bin/env bash
# Assemble exported frames (and audio.wav, if present) into an H.264/AAC MP4.
# Usage: tools/export.sh [frames_dir] [output.mp4]
set -euo pipefail
cd "$(dirname "$0")/.."

FRAMES="${1:-renders/frames}"
OUT="${2:-renders/the-last-storm-1080p.mp4}"

EXT=png
[ -f "$FRAMES/frame_00000.png" ] || EXT=jpg
if [ ! -f "$FRAMES/frame_00000.$EXT" ]; then
  echo "No frames found in $FRAMES (expected frame_00000.png or .jpg)." >&2
  exit 1
fi

AUDIO=()
if [ -f "$FRAMES/audio.wav" ]; then
  AUDIO=(-i "$FRAMES/audio.wav" -c:a aac -b:a 192k)
else
  echo "No audio.wav found; writing a silent video." >&2
fi

mkdir -p "$(dirname "$OUT")"
ffmpeg -hide_banner -y \
  -framerate 24 -i "$FRAMES/frame_%05d.$EXT" \
  ${AUDIO[@]+"${AUDIO[@]}"} \
  -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r 24 \
  -movflags +faststart -shortest \
  "$OUT"

echo "Wrote $OUT"
