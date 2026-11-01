#!/bin/sh
# usage: run.sh script.py — runs lib.py + script in headless Blender
here=$(cd "$(dirname "$0")" && pwd)
out="$here/.combined_$(basename "$1")"
{ cat "$here/lib.py"; printf '\n'; cat "$1"; printf '\n%s\n' 'for _l in LOG: print("LOG " + _l)'; } > "$out"
/Applications/Blender.app/Contents/MacOS/Blender -b --factory-startup --python-exit-code 1 --python "$out" 2>&1 | grep -E "^LOG |Error|error|Traceback|line [0-9]+" | head -40
