#!/usr/bin/env bash
# Export Pravadh Labs investor pitch deck to a 16:9 PowerPoint.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$ROOT/investor/export-pptx.py"
