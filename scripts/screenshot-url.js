#!/usr/bin/env node
// Screenshot a LIVE URL at one or more device viewports, saving PNGs into
// assets/<slug>/ for use in device-showcase posters (see
// posters/releaserocket-device-showcase.html).
//
// Usage:
//   node scripts/screenshot-url.js <url> <slug> [options]
//
//   <url>   Live page to capture, INCLUDING scheme (e.g. https://example.com)
//   <slug>  Output folder under assets/ (e.g. mysite  ->  assets/mysite/)
//
// Options:
//   --viewports <list>   Comma-separated preset names. Default: desktop,mobile
//                        Presets: desktop (1440x900), mobile (390x844),
//                                 tablet (834x1112), full-hd (1920x1080)
//   --viewport <n:WxH>   Add/override a custom viewport, repeatable.
//                        e.g. --viewport hero:1280x720  (treated as desktop-class)
//   --name <page>        Filename prefix ("page" name). Default: derived from the
//                        URL path ("home" for root, else the last path segment).
//   --wait <ms>          Extra settle time after load, for entry animations,
//                        lazy images, web fonts. Default: 4000
//   --scale <n>          Device scale factor (retina). Default: 2
//   --full-page          Capture the whole scrollable page, not just the viewport.
//
// Output: assets/<slug>/<page>-<viewport>.png  (one file per requested viewport)
//
// WHY THIS EXISTS (vs scripts/screenshot.js): screenshot.js shoots a LOCAL
// poster HTML file at its own declared dimensions. This one shoots a REMOTE
// live site at real device viewports, the raw material for the browser-window
// and phone frames of a device-showcase poster.
//
// GPU note: Chromium is launched with the GPU forced on so WebGL/Three.js
// sites render their canvas instead of the no-GPU (blank) fallback. Headless
// Chromium's default software GL reads as "no GPU" on WebGL2 sites and paints
// blank. On macOS, WebGL is routed through Metal via ANGLE.

const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

// width/height are CSS pixels; deviceScaleFactor is applied on top (so desktop
// @2x => 2880x1800 raw pixels). isMobile makes responsive sites emit their
// phone/tablet layout rather than a shrunk desktop one.
const PRESETS = {
  desktop: { width: 1440, height: 900, isMobile: false },
  "full-hd": { width: 1920, height: 1080, isMobile: false },
  tablet: { width: 834, height: 1112, isMobile: true },
  mobile: { width: 390, height: 844, isMobile: true },
};

const GPU_ARGS = [
  "--ignore-gpu-blocklist",
  "--enable-gpu",
  "--enable-webgl",
  "--enable-accelerated-2d-canvas",
  ...(process.platform === "darwin" ? ["--use-gl=angle", "--use-angle=metal"] : []),
];

function parseArgs(argv) {
  const args = {
    positional: [],
    viewports: null,
    custom: {},
    name: null,
    wait: 4000,
    scale: 2,
    fullPage: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--viewports") args.viewports = argv[++i];
    else if (a === "--name") args.name = argv[++i];
    else if (a === "--wait") args.wait = parseInt(argv[++i], 10);
    else if (a === "--scale") args.scale = parseInt(argv[++i], 10);
    else if (a === "--full-page") args.fullPage = true;
    else if (a === "--viewport") {
      // name:WxH adds a one-off viewport (desktop-class by default).
      const spec = argv[++i] || "";
      const m = spec.match(/^([\w-]+):(\d+)x(\d+)$/);
      if (!m) throw new Error(`Bad --viewport "${spec}", expected name:WxH (e.g. hero:1280x720)`);
      args.custom[m[1]] = { width: parseInt(m[2], 10), height: parseInt(m[3], 10), isMobile: false };
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown option: ${a}`);
    } else {
      args.positional.push(a);
    }
  }
  return args;
}

// Derive a filename-safe "page" label from a URL path. Root -> "home".
function pageNameFromUrl(rawUrl) {
  let pathname = "/";
  try {
    pathname = new URL(rawUrl).pathname;
  } catch {
    // leave as "/"
  }
  const seg = pathname.split("/").filter(Boolean).pop();
  if (!seg) return "home";
  return seg.replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "home";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [url, slug] = args.positional;

  if (!url || !slug) {
    console.error(
      "Usage: node scripts/screenshot-url.js <url> <slug> [--viewports desktop,mobile] " +
        "[--viewport name:WxH] [--name page] [--wait ms] [--scale n] [--full-page]",
    );
    process.exit(1);
  }

  if (!Number.isFinite(args.wait) || args.wait < 0) {
    console.error("--wait must be a non-negative number of milliseconds.");
    process.exit(1);
  }
  if (!Number.isInteger(args.scale) || args.scale < 1) {
    console.error("--scale must be an integer >= 1.");
    process.exit(1);
  }

  // Resolve the requested viewport set: named presets + any custom --viewport.
  const requested = (args.viewports || "desktop,mobile").split(",").map((s) => s.trim()).filter(Boolean);
  const viewports = {};
  for (const name of requested) {
    const vp = PRESETS[name] || args.custom[name];
    if (!vp) {
      console.error(
        `Unknown viewport "${name}". Presets: ${Object.keys(PRESETS).join(", ")} (or define via --viewport ${name}:WxH)`,
      );
      process.exit(1);
    }
    viewports[name] = vp;
  }
  // Any custom viewports not already listed in --viewports are added too.
  for (const [name, vp] of Object.entries(args.custom)) {
    if (!viewports[name]) viewports[name] = vp;
  }

  const page_ = args.name || pageNameFromUrl(url);
  // assets/<slug>/ resolved against the repo root, not the cwd, so shots land
  // in this repo's assets even when the script is run from elsewhere.
  const outDir = path.resolve(__dirname, "..", "assets", slug);
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
  const saved = [];

  try {
    for (const [vpName, vp] of Object.entries(viewports)) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: args.scale,
        isMobile: !!vp.isMobile,
        hasTouch: !!vp.isMobile,
      });
      const page = await context.newPage();

      // "load" first, then a best-effort wait for network idle: live marketing
      // sites keep analytics/long-poll connections open that can stop the idle
      // signal from ever firing, so it must not be able to fail the run.
      await page.goto(url, { waitUntil: "load", timeout: 60000 });
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      // Settle: entry animations, lazy images, late web fonts.
      await page.waitForTimeout(args.wait);

      // Diagnostic: did a canvas render with a live WebGL context, or did the
      // page hit the no-GPU fallback? Stderr only, stdout stays machine-readable.
      const diag = await page.evaluate(() => {
        const c = document.querySelector("canvas");
        if (!c) return null;
        const gl = c.getContext("webgl2") || c.getContext("webgl");
        return { canvas: true, width: c.width, height: c.height, webgl: !!gl };
      });
      if (diag) console.error(`  GPU check (${vpName}): ${JSON.stringify(diag)}`);

      const file = path.join(outDir, `${page_}-${vpName}.png`);
      await page.screenshot({ path: file, fullPage: args.fullPage });
      await context.close();

      const raw = `${vp.width * args.scale}x${vp.height * args.scale}`;
      saved.push({ viewport: vpName, css: `${vp.width}x${vp.height}`, raw, fullPage: args.fullPage, file });
      console.error(`  done ${vpName.padEnd(8)} ${raw.padEnd(11)} -> ${path.relative(process.cwd(), file)}`);
    }
  } finally {
    await browser.close();
  }

  // Machine-readable summary on stdout (progress lines go to stderr above).
  console.log(JSON.stringify({ url, slug, page: page_, outDir, shots: saved }, null, 2));
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
