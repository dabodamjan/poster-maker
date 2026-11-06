# Poster Maker

## Project Purpose

A marketing poster generator powered by Claude Code. Creates visually striking posters as single HTML/CSS files, exportable to PNG/PDF. Works for any type of poster — event flyers, product launches, conference talks, DJ gigs, meetups, sale announcements, or anything else.

## Project Structure

```
posters/           HTML poster files (the output)
exports/           Exported PNG/PDF files (gitignored)
assets/            Images, logos, photos for use in posters
scripts/
  export.js        Playwright PNG/PDF export (auto-detects dimensions)
  screenshot.js    Playwright preview screenshots (auto-detects dimensions)
  dimensions.js    Shared body-CSS dimension parsing (px, mm, in) and the render-scale cap for very large formats
  screenshot-url.js  Capture a LIVE URL at device viewports into assets/<slug>/ (GPU forced on for WebGL sites)
  frame-screenshot.js  Frame a screenshot on a social-ready canvas (screenshot-frame.html is its template)
  remove-bg.py     Background removal (requires rembg)
.claude/commands/
  setup.md         /setup — install dependencies and verify setup
  new-poster.md    /new-poster — generate a poster
  export-poster.md /export-poster — export to PNG/PDF
  remove-bg.md     /remove-bg — remove image background
```

## Commands

- `/new-poster` — main command. Generates a poster from a description. See the command file for full design principles, font pairings, and image handling.
- `/export-poster` — export a poster to PNG or PDF using Playwright.
- `/remove-bg` — remove background from an image using rembg (Python). Installs on first use.

## Key Rules

- Posters are **single HTML files with all CSS inline** — the only external references are Google Fonts and images from `assets/`.
- Body dimensions are the poster size (default 1080x1920) with no scroll/margin.
- Images go in `assets/`, organized in subfolders per project (e.g., `assets/deep-frequencies/`, `assets/nexus-launch/`). Referenced via relative paths from poster files (`../assets/project-name/photo.jpg`).
- Always include `@media print` with `-webkit-print-color-adjust: exact`.
- After creating/editing a poster, open it with `open posters/<filename>.html`.
- **Always take a Playwright screenshot** after creating/editing a poster: `node scripts/screenshot.js posters/<filename>.html` — then read the PNG to visually verify the result before presenting to user.
- Iterate with the user until they're happy, then offer export.

## Social Media First

- **Default format is Instagram Story (1080x1920)** — optimized for social media viewing on phones, not print.
- **Always ask the user** at the start whether the poster is for social media or print — this determines safe zones and text sizing.
- For social media posters, follow the **Instagram Safe Zone** rules (see new-poster.md).
- **Minimum text size: 24px** for social media posters — anything smaller is unreadable on phone screens. Labels, captions, taglines all must be at least 24px.
- Always include the **fit-to-window script** so the poster scales down in the browser for preview.

## Playwright Preview

- Playwright is installed (`npm install` then `npx playwright install chromium`).
- Use `node scripts/screenshot.js posters/<file>.html` to take a screenshot at the poster's dimensions (auto-detected from the HTML).
- Screenshots save to `exports/<name>-preview.png`. Always screenshot after creating/editing a poster — read the PNG to visually verify the layout before showing to the user.
- `--scale N` sets the device scale, and an output path ending in `.jpg` writes a JPEG: `node scripts/screenshot.js posters/<file>.html assets/examples/<file>.jpg --scale 1` is how the README gallery images are made.

## Formats

The base formats (`story`, `square`, `landscape`, `github`, `og`, `youtube`, `a4`, `a3`, `business-card`) are listed in `.claude/commands/new-poster.md`. Business-graphics formats, each with a ReleaseRocket example in `posters/`:

- `linkedin-cover`: 1512x256 px. The Page logo overlaps the lower left on desktop; keep text right of ~440px.
- `email-header`: 600x200 px, exports at 1200x400 for high-density screens.
- `a4` as letterhead: 210x297 mm, white sheet, nothing at the trim so it prints without bleed.
- `rollup`: 850x2000 mm. Keep the bottom 150 mm free of content (it can disappear into the stand's base). The PNG export is capped at 64 megapixels (about 155 DPI here); send the PDF.
- `tshirt-front`: 600x600 px, a 4x4 in left-chest print file (2x export = 300 DPI).
- `tshirt-back`: 1800x2400 px, a 12x16 in back print file (2x export = 300 DPI).
- `sticker`: 3x3 in die-cut.
- `mug-11oz`: 200x96 mm sublimation wrap; the two short edges meet at the handle.

Merch print files (`tshirt-*`, `sticker`) set `background: transparent` so the export is an alpha PNG. On a die-cut sticker the transparent area defines the cut line, so draw a solid white border (0.1 in or more). On garments use solid colours only: semi-transparent pixels print unpredictably on DTG. Keep merch restrained and mark-led, legible from a distance. A print file alone shows nothing in a gallery, so pair it with a separate preview poster that draws the design in use (garment, mug, or laptop lid in CSS/SVG).

## Iteration Discipline — IMPORTANT

**Think holistically before making CSS changes.** Do NOT make random incremental margin/padding tweaks hoping something sticks. Instead:

1. **Understand the full layout first** — calculate the total available space, how much each section takes, and where the remaining space goes. Map out the vertical zones (title zone, photo zone, info zone) with actual pixel values.
2. **Make intentional changes** — when the user asks to "move something lower", think about WHY it's in the wrong position. Is it a padding issue? A flex distribution issue? A container size issue? Fix the root cause, not the symptom.
3. **Use flex spacers for layout distribution** — instead of hardcoding margins, use `flex: 1` spacers between major sections so space distributes naturally. Use weighted flex values (e.g., `flex: 1.8` vs `flex: 1`) to bias distribution.
4. **Never make multiple blind tweaks in a row** — if the first tweak didn't work, stop and rethink the approach rather than trying another random value.
5. **Verify with Playwright screenshot** after every change — read the PNG and check it looks right before showing to user.

## Tech Stack

- **HTML + CSS** — poster content (no frameworks; the only JS in a poster is the fit-to-window preview script, which does not affect export)
- **Google Fonts** — typography
- **Playwright** — screenshot previews (`scripts/screenshot.js`) and PNG/PDF export
- **Node.js** — tooling (playwright, serve)
- **Python** — optional, for rembg background removal
- **No build step** — open HTML files directly in a browser

## Example Posters

Users can generate any type of poster. Example styles:
- Euphoric EDM event flyer with bright gradients and light effects
- Clean minimal product launch with bold stats
- Elegant luxury invite with gold on black and serif type
