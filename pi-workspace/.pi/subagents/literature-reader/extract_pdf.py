from __future__ import annotations

import argparse
import sys
from pathlib import Path

from pypdf import PdfReader


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract page-numbered text from a PDF")
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int)
    args = parser.parse_args()

    reader = PdfReader(str(args.pdf))
    total = len(reader.pages)
    start = max(1, args.start)
    end = min(total, args.end if args.end is not None else total)
    if start > total:
        raise ValueError(f"start page {start} exceeds document length {total}")
    if end < start:
        raise ValueError("end page must be greater than or equal to start page")

    sys.stdout.reconfigure(encoding="utf-8")
    print(f"[PDF: {args.pdf.name}; pages: {start}-{end} of {total}]")
    for page_number in range(start, end + 1):
        text = reader.pages[page_number - 1].extract_text() or ""
        print(f"\n--- Page {page_number} ---\n")
        print(text.strip() or "[No extractable text on this page]")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
