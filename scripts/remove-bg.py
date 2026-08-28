#!/usr/bin/env python3
"""
Remove background from an image using rembg.

Usage:
  python scripts/remove-bg.py assets/photo.jpg
  python scripts/remove-bg.py assets/photo.jpg -o assets/photo-nobg.png

Requires: pip install "rembg[cli]" Pillow
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Remove background from an image")
    parser.add_argument("input", help="Path to input image")
    parser.add_argument("-o", "--output", help="Output path (default: <input>-nobg.png)")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: {input_path} not found")
        sys.exit(1)

    if args.output:
        output_path = Path(args.output)
    else:
        output_path = input_path.with_name(f"{input_path.stem}-nobg.png")

    try:
        from rembg import remove
        from PIL import Image
    except ImportError:
        print("rembg is not installed. Install it with:")
        print('  pip install "rembg[cli]" Pillow')
        sys.exit(1)

    print(f"Processing {input_path}...")
    input_image = Image.open(input_path)
    output_image = remove(input_image)
    output_image.save(output_path)
    print(f"Done → {output_path}")

if __name__ == "__main__":
    main()
