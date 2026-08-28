#!/usr/bin/env node

// Usage: node scripts/export.js posters/my-poster.html [--pdf]
// Exports to exports/ folder as PNG (default) or PDF.
//
// PNG resolution: 2x device scale for pixel-sized posters, 4x for posters
// sized in physical units (96 CSS px per inch x 4 = 384 DPI).
// PDF: posters sized in physical units get a true physical page size.

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { parseDimensions } = require("./dimensions");

async function main() {
  const args = process.argv.slice(2);
  const pdfMode = args.includes("--pdf");
  const htmlFile = args.find((a) => a.endsWith(".html"));

  if (!htmlFile) {
    console.error("Usage: node scripts/export.js <path-to-poster.html> [--pdf]");
    process.exit(1);
  }

  const absolutePath = path.resolve(htmlFile);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const html = fs.readFileSync(absolutePath, "utf-8");
  const dims = parseDimensions(html);
  const width = dims.cssWidth;
  const height = dims.cssHeight;
  const scale = dims.physical ? 4 : 2;

  const basename = path.basename(htmlFile, ".html");
  const ext = pdfMode ? "pdf" : "png";
  const outputPath = path.join("exports", `${basename}.${ext}`);

  fs.mkdirSync("exports", { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();

  await page.goto(`file://${absolutePath}`, { waitUntil: "networkidle" });

  // Disable the fit-to-window scaling for export. The fit script sets
  // transform, position, left, and top; all four must be reset or the
  // capture is offset and cropped.
  await page.evaluate(() => {
    document.body.style.transform = "none";
    document.body.style.position = "static";
    document.body.style.left = "0";
    document.body.style.top = "0";
    document.documentElement.style.background = "transparent";
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  if (pdfMode) {
    await page.pdf({
      path: outputPath,
      width: dims.pdfWidth,
      height: dims.pdfHeight,
      printBackground: true,
    });
    console.log(`Exported: ${outputPath} (${dims.pdfWidth} × ${dims.pdfHeight})`);
  } else {
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      clip: { x: 0, y: 0, width, height },
      omitBackground: dims.transparent,
    });
    console.log(`Exported: ${outputPath} (${width * scale}×${height * scale} at ${scale}x)`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
