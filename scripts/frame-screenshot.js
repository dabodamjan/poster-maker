#!/usr/bin/env node
// Frame a screenshot onto a social-ready canvas with sampled background color.
// Usage:
//   node scripts/frame-screenshot.js --input <path> [--output <path>]
//     [--size 16:9|4:5|1:1] [--bg <css-color>] [--padding-x <px>] [--padding-y <px>]

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SIZES = {
  "16:9": { width: 1600, height: 900, paddingX: 140, paddingY: 90 },
  "4:5": { width: 1080, height: 1350, paddingX: 100, paddingY: 140 },
  "1:1": { width: 1080, height: 1080, paddingX: 110, paddingY: 110 },
};

function parseArgs(argv) {
  const args = { size: "16:9" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--input") args.input = argv[++i];
    else if (a === "--output") args.output = argv[++i];
    else if (a === "--size") args.size = argv[++i];
    else if (a === "--bg") args.bg = argv[++i];
    else if (a === "--padding-x") args.paddingX = Number(argv[++i]);
    else if (a === "--padding-y") args.paddingY = Number(argv[++i]);
    else if (a.startsWith("--")) throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

function imageToDataUrl(absPath) {
  const ext = path.extname(absPath).slice(1).toLowerCase() || "png";
  const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
  const bytes = fs.readFileSync(absPath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function sampleBgColor(browser, dataUrl) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 100, height: 100 });
  await page.setContent(
    "<!doctype html><html><body></body></html>",
    { waitUntil: "load" },
  );
  const rgb = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error("image load failed"));
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const w = canvas.width;
    const h = canvas.height;
    const inset = Math.max(1, Math.round(Math.min(w, h) * 0.01));
    const points = [
      [inset, inset],
      [w - 1 - inset, inset],
      [inset, h - 1 - inset],
      [w - 1 - inset, h - 1 - inset],
      [Math.floor(w / 2), inset],
      [Math.floor(w / 2), h - 1 - inset],
      [inset, Math.floor(h / 2)],
      [w - 1 - inset, Math.floor(h / 2)],
    ];
    let r = 0, g = 0, b = 0;
    for (const [x, y] of points) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      r += d[0];
      g += d[1];
      b += d[2];
    }
    const n = points.length;
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  }, dataUrl);
  await page.close();
  return rgb;
}

function rgbToCss([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

async function render(args) {
  const dims = SIZES[args.size];
  if (!dims) {
    throw new Error(
      `Unknown size: ${args.size}. Use: ${Object.keys(SIZES).join(", ")}`,
    );
  }
  const absInput = path.resolve(args.input);
  if (!fs.existsSync(absInput)) {
    throw new Error(`Input not found: ${absInput}`);
  }

  const dataUrl = imageToDataUrl(absInput);
  const browser = await chromium.launch();

  let bgColor = args.bg;
  let sampledRgb = null;
  if (!bgColor) {
    sampledRgb = await sampleBgColor(browser, dataUrl);
    bgColor = rgbToCss(sampledRgb);
  }

  const paddingX = Number.isFinite(args.paddingX) ? args.paddingX : dims.paddingX;
  const paddingY = Number.isFinite(args.paddingY) ? args.paddingY : dims.paddingY;

  const templatePath = path.resolve(__dirname, "screenshot-frame.html");
  const template = fs.readFileSync(templatePath, "utf-8");
  const html = template
    .replace(/\{\{WIDTH\}\}/g, dims.width)
    .replace(/\{\{HEIGHT\}\}/g, dims.height)
    .replace(/\{\{BG_COLOR\}\}/g, bgColor)
    .replace(/\{\{PADDING_X\}\}/g, paddingX)
    .replace(/\{\{PADDING_Y\}\}/g, paddingY)
    .replace(/\{\{IMAGE_DATA_URL\}\}/g, dataUrl);

  const page = await browser.newPage();
  await page.setViewportSize({ width: dims.width, height: dims.height });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const img = document.querySelector("img.screenshot");
        if (!img) return resolve();
        if (img.complete) return resolve();
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      }),
  );

  const output = path.resolve(args.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await page.screenshot({
    path: output,
    clip: { x: 0, y: 0, width: dims.width, height: dims.height },
  });
  await browser.close();

  return {
    output,
    size: args.size,
    dimensions: `${dims.width}x${dims.height}`,
    bg: bgColor,
    sampled_rgb: sampledRgb,
  };
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    console.error(
      "Usage: node scripts/frame-screenshot.js --input <path> [--output <path>] [--size 16:9|4:5|1:1] [--bg <css>] [--padding-x <px>] [--padding-y <px>]",
    );
    process.exit(1);
  }
  if (!args.output) {
    const base = path.basename(args.input, path.extname(args.input));
    args.output = path.join("exports", `${base}-framed.png`);
  }
  try {
    const res = await render(args);
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
