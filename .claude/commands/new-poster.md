---
description: Generate a marketing poster
---

Create a visually striking poster as a single self-contained HTML file.

### Input (from user message)

The user will provide some or all of:
- **Poster type** (e.g., "DJ gig flyer", "product launch", "conference talk", "sale announcement", "meetup invite")
- **Headline / event name** (e.g., "SOLAR FREQUENCIES", "Summer Sale — 50% Off", "Launch Week")
- **Key names / speakers / artists** (e.g., "DJ GLANZ", "Jane Smith — CTO at Acme")
- **Date & time** (e.g., "Saturday, March 15 · 23:00")
- **Location / venue** (e.g., "Club Elysium, Zagreb" or "Online — Zoom")
- **Style / mood** (e.g., "euphoric EDM", "clean corporate", "playful", "brutalist", "retro 80s", "luxury minimal")
- **Color palette** (e.g., "neon green on black", "sunset gradient", "brand blue #1a73e8") — or let AI choose based on mood
- **Extra details** (e.g., "21+", "Free entry", "Tickets: 15€", "Use code SAVE20", a URL, tagline)
- **Images** (optional — one or more paths to photos, logos, or artwork to incorporate. Place files in `assets/` or provide absolute paths)
- **Format** — defaults to Instagram story (1080×1920), but user can request:
  - `story` — 1080×1920 (9:16)
  - `square` — 1080×1080 (1:1)
  - `landscape` — 1920×1080 (16:9)
  - `github` — 1280×640 (2:1, GitHub social preview)
  - `og` — 1200×630 (blog cover / social link preview)
  - `youtube` — 1280×720 (YouTube thumbnail)
  - `a3` — 297×420mm print poster
  - `a4` — 210×297mm print poster
  - `business-card` — 3.5×2in print card
  - any custom `WxH` in pixels (e.g., `1024x1024` app icon)

  For print formats (`a4`, `a3`, `business-card`), size the body in physical units (`width: 210mm`, `width: 3.5in`). The export and screenshot scripts convert physical units to CSS pixels at 96 per inch, render print PNGs at 4x device scale (roughly 384 DPI), and give PDFs the true physical page size. In the fit-to-window script, use the CSS pixel equivalents (210mm ≈ 794px).

### Design Principles

Follow these rules to make posters that look professional, not like generic AI output:

1. **Typography is king** — Use bold, expressive type. Mix weights aggressively (thin + ultra bold). Use Google Fonts — pick fonts that match the mood:
   - Techno/minimal: `Space Grotesk`, `DM Mono`, `Bebas Neue`, `Outfit`
   - Disco/party: `Playfair Display`, `Syne`, `Unbounded`
   - Loud/rave/bold: `Rubik Mono One`, `Bungee`, `Press Start 2P`
   - Elegant/luxury: `Cormorant Garamond`, `Italiana`, `Cinzel`
   - Clean/modern: `Inter`, `Plus Jakarta Sans`, `Manrope`, `General Sans`
   - Retro/vintage: `Abril Fatface`, `Lobster`, `Righteous`
   - Corporate/professional: `DM Sans`, `Outfit`, `Source Sans 3`
   - General bold: `Oswald`, `Anton`, `Archivo Black`

2. **Visual hierarchy** — Most important info biggest (headline, name, key offer). Supporting info (date, location, details) progressively smaller. The eye should flow naturally top to bottom.

3. **Atmosphere over information** — The poster should FEEL like the thing it's promoting. Use CSS effects aggressively:
   - `mix-blend-mode` for layered textures
   - CSS gradients (radial, conic, layered) for depth
   - `backdrop-filter: blur()` for glassmorphism
   - `text-shadow` and `box-shadow` for glow effects
   - CSS `filter` for color grading
   - Subtle CSS animations (optional — pulse, glow, grain) for digital versions
   - `background-image` with CSS patterns or SVG noise textures

4. **Color with intent** — Don't use random colors. Match the mood:
   - Dark/underground → black, deep red, white, neon accents
   - Warm/inviting → warm gradients, gold, amber, coral
   - Minimal/clean → monochrome, one accent color, lots of white
   - Energetic/party → neon, high contrast, saturated hues on dark
   - Professional → navy, slate, white, subtle accent
   - Luxury → black, gold, cream, thin serif type
   - Retro → muted pastels, halftone patterns, warm film tones

5. **Whitespace and breathing room** — Don't cram. Let elements breathe. Generous padding. Restraint is a feature.

6. **No clip art energy** — No emoji, no generic icons, no rounded-corner card layouts. This should look like something designed by a human with taste, not a Canva template.

7. **Noise and texture** — Add subtle grain/noise via CSS or inline SVG to avoid the "too clean digital" look. A poster should feel tactile.

8. **Working with images** — When the user provides photos, logos, or artwork:

   **Placement strategies** — choose based on the design:
   - **Full-bleed background** — `background-image` with `background-size: cover` on body or a container, with gradient/color overlay on top for text readability
   - **Hero section** — large image taking 40-60% of the poster, text above or below
   - **Circular/shaped crop** — use `clip-path` or `border-radius: 50%` for portraits (e.g., artist/speaker headshots)
   - **Side-by-side** — two images (e.g., two DJs, before/after) split with a diagonal `clip-path` or grid
   - **Collage/mosaic** — multiple images in a CSS grid with gap and consistent treatment
   - **Small inset** — logo or badge positioned in a corner or header area

   **Making images look designed, not dropped in:**
   - Always add a gradient overlay on background images: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8))` — adjust opacity and color to match the mood
   - Use `filter` on images to match the poster's color grade: `grayscale(1) contrast(1.2)` for moody, `saturate(1.3) brightness(1.1)` for vibrant, `sepia(0.3)` for warm/vintage
   - Use `mix-blend-mode: multiply/overlay/luminosity` to blend images with background colors
   - Apply `object-fit: cover` and `object-position` to control framing without distortion
   - Add consistent border treatment: thin border, subtle shadow, or no border — match the poster style
   - For portraits/headshots: desaturate slightly, bump contrast, add a subtle color tint that matches the accent color

   **Background removal:**
   - If the user wants a person/object cut out from their photo, use `/remove-bg` or run `python3 scripts/remove-bg.py <image>` to get a transparent PNG
   - Use the `-nobg.png` version in the poster — works great for: artist headshots over colored/gradient backgrounds, product shots floating over designed layouts, speaker portraits on conference posters

   **Technical requirements:**
   - Reference images via relative path from the poster file: `../assets/photo.jpg`
   - Use `<img>` tags for content images (artist photos, product shots) with `alt` text
   - Use CSS `background-image: url(...)` for decorative/background images
   - Never base64-encode large images — use file references (Playwright handles local paths)
   - If the user provides a path outside `assets/`, copy or note the path — it will work locally

9. **Instagram Safe Zone** (for social media posters — the default):

   Instagram Stories overlay UI elements on the poster. All important content MUST stay within the safe zone:
   - **Top 250px** — reserved for profile pic, username, close button. No text here.
   - **Bottom 250px** — reserved for reply bar, stickers, swipe-up. No text here.
   - **Sides 65px** — reserved for edge clipping on some devices.
   - **Safe content area: ~950 × 1420px centered** (from 250px to 1670px vertically, 65px to 1015px horizontally)
   - Use `padding: 260px 75px 260px` on the content container to enforce this.
   - The top/bottom 250px areas can have decorative elements (background glows, photo bleed) — just no text or important info.

10. **Social media text sizing** — minimum **24px** for ANY text on the poster. Labels, captions, taglines — everything. Anything smaller is unreadable on phone screens. Prefer 26px+ for secondary text and 40px+ for key info.

11. **Seamless photo integration on dark backgrounds** — NEVER use rectangular photo containers with gradient edge fades — they create harsh visible borders. Instead:
    - Use CSS `mask-image` with `radial-gradient()` to create a soft vignette that dissolves faces/bodies into the background
    - Example: `mask-image: radial-gradient(ellipse 70% 65% at 50% 40%, black 35%, transparent 75%);`
    - For portraits on dark backgrounds, use individual photos (not group shots in a strip) with radial masks — faces emerge from darkness naturally
    - Be careful with ambient background glows (`radial-gradient` on `.bg-glow`) near photo areas — they create ugly color hazes around faces. Keep glows away from where photos sit, or make them very subtle.
    - Use `filter: contrast(1.15) saturate(0.75) brightness(0.95)` to match photos to the poster mood — adjust per design

12. **Fit-to-window preview script** — ALWAYS include at the end of `<body>` so the poster scales down to fit the browser window. **Use the poster's actual dimensions** (not hardcoded 1080/1920):
    ```html
    <script>
      (function() {
        const w = WIDTH, h = HEIGHT;
        function fit() {
          const s = Math.min(window.innerWidth / w, window.innerHeight / h, 1);
          document.body.style.transform = 'scale(' + s + ')';
          document.body.style.transformOrigin = 'top left';
          document.body.style.position = 'absolute';
          document.body.style.left = ((window.innerWidth - w * s) / 2) + 'px';
          document.body.style.top = ((window.innerHeight - h * s) / 2) + 'px';
        }
        fit();
        window.addEventListener('resize', fit);
      })();
    </script>
    ```
    Also add this CSS for centering:
    ```css
    @media screen {
      html { height: 100vh; display: flex; justify-content: center; align-items: center; background: #0f1010; }
    }
    ```
    This does NOT affect export — Playwright renders at the exact poster dimensions.

### Output

1. **Ask the user upfront**: social media or print? This determines safe zones and text sizing.
2. Generate a single self-contained HTML file in `posters/` named with kebab-case (e.g., `posters/solar-frequencies-2026-03-15.html`, `posters/summer-sale-2026.html`)
3. All CSS must be inline (in a `<style>` tag) — no external stylesheets except Google Fonts
4. All assets (SVG patterns, noise textures) must be inline or CSS-generated — no external files except user-provided images
5. The HTML `<body>` should be exactly the poster dimensions with no scroll, no margin
6. Include the **fit-to-window script** at end of `<body>` and `@media screen` centering CSS (see above)
7. Include a print-friendly `@media print` section that hides nothing and preserves colors (`-webkit-print-color-adjust: exact`)
8. After creating the file, open it with `open posters/[filename].html` (macOS) so the user sees it immediately
9. **Always take a Playwright screenshot**: `node scripts/screenshot.js posters/<filename>.html` — screenshot saves to `exports/<filename>-preview.png` — read that PNG to visually verify the layout before presenting to user
10. Ask if they want adjustments — iterate until they're happy
11. When finalized, offer to export to PNG using Playwright

### Iteration — Do it right

**Think before you change.** When the user asks for a layout adjustment:
1. Understand the current layout structure — what are the vertical zones, how is space distributed, what flex values control positioning?
2. Identify the root cause — if something is "too high", is it because of top padding, missing spacers, or wrong flex distribution? Don't just tweak random margins.
3. Make one intentional change that addresses the root cause.
4. Take a Playwright screenshot and verify the result before showing to user.
5. **Never make multiple blind incremental tweaks** — if the first change didn't work, stop and rethink.

Common iteration requests:
- "make the title bigger"
- "darker / more contrast"
- "add a glow effect"
- "change the font"
- "more minimal"
- "make it feel more underground"
- "more corporate / cleaner"
- "add my logo" (provide path)
- "make the background image darker / more blurred"
- "crop the photo tighter / show more of the image"
- "make the photo black and white"
- "blend the image more with the background"
- "put the two photos side by side"
- "move something up/down" — use flex spacers, not margin hacks
- "try a completely different style"

Apply changes, screenshot, verify, then re-open the file. Keep iterating.
