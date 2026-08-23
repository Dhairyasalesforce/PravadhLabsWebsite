#!/usr/bin/env bash
# Export Pravadh Labs investor pitch deck to PDF (16:9, clickable links).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/investor/pitch-deck.html"
PDF="$ROOT/investor/PravadhLabs-Investor-Pitch-Deck-2026.pdf"
DESKTOP_PDF="/Users/dhairyashah/Desktop/PRAVADH LABS/Pravadh Labs Investor /PravadhLabs-Investor-Pitch-Deck-2026.pdf"

CHROME=""
for candidate in \
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  "/Applications/Chromium.app/Contents/MacOS/Chromium" \
  "google-chrome" \
  "chromium"; do
  if command -v "$candidate" >/dev/null 2>&1 || [[ -x "$candidate" ]]; then
    CHROME="$candidate"
    break
  fi
done

if [[ -z "$CHROME" ]]; then
  echo "Chrome not found. Open pitch-deck.html and use Print → Save as PDF (landscape)." >&2
  exit 1
fi

echo "Exporting PDF from: $HTML"
"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-first-run \
  --no-default-browser-check \
  --run-all-compositor-stages-before-draw \
  --virtual-time-budget=20000 \
  --print-to-pdf="$PDF" \
  --no-pdf-header-footer \
  "file://$HTML"

if [[ -f "$PDF" ]]; then
  pages=$(python3 - <<PY
import sys
try:
    from pypdf import PdfReader
    print(len(PdfReader("$PDF").pages))
except Exception:
    try:
        from PyPDF2 import PdfReader
        print(len(PdfReader("$PDF").pages))
    except Exception:
        print("?")
PY
)
  size=$(du -h "$PDF" | cut -f1)
  echo "Created: $PDF ($size, ${pages} pages)"
  mkdir -p "$(dirname "$DESKTOP_PDF")"
  cp "$PDF" "$DESKTOP_PDF"
  echo "Copied:  $DESKTOP_PDF"
else
  echo "PDF export failed." >&2
  exit 1
fi
