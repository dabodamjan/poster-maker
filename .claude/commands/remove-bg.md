---
description: Remove background from an image
---

Remove the background from an image so it can be used in posters with transparent backgrounds.

### Steps

1. If the user specified an image in their message ($ARGUMENTS), use that. Otherwise, list images in `assets/` and let them pick one.
2. Check if `rembg` is installed: `python3 -c "import rembg" 2>/dev/null`
   - If not installed, run: `pip3 install "rembg[cli]" Pillow` (quotes matter in zsh) and confirm with the user first
3. Run: `python3 scripts/remove-bg.py <image-path>`
   - Output will be saved as `<name>-nobg.png` in the same directory
4. Report the output path
5. Open the result with `open <output-path>`
