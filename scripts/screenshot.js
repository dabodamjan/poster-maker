#!/usr/bin/env node
// Take a screenshot of a poster HTML file using Playwright
// Usage: node scripts/screenshot.js posters/my-poster.html [output.png|output.jpg] [--scale N]
//
// --scale sets the device scale (default 2). A .jpg output path writes a
// JPEG at quality 85, which is how the README gallery images are made:
//   node scripts/screenshot.js posters/x.html assets/examples/x.jpg --scale 1

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { parseDimensions, renderScale } = require('./dimensions');

async function screenshot(htmlPath, outputPath, requestedScale) {
  const absoluteHtml = path.resolve(htmlPath);

  if (!fs.existsSync(absoluteHtml)) {
    console.error(`File not found: ${absoluteHtml}`);
    process.exit(1);
  }

  // Default output to exports/ directory (same as export.js)
  const basename = path.basename(htmlPath, '.html');
  const defaultOutput = outputPath || path.join('exports', `${basename}-preview.png`);
  const absoluteOutput = path.resolve(defaultOutput);

  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });

  const html = fs.readFileSync(absoluteHtml, 'utf-8');
  const dims = parseDimensions(html);
  const width = dims.cssWidth;
  const height = dims.cssHeight;
  const scale = renderScale(dims, requestedScale || 2);
  const jpeg = /\.jpe?g$/i.test(absoluteOutput);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
  });
  const page = await context.newPage();

  await page.goto(`file://${absoluteHtml}`, { waitUntil: 'networkidle' });

  // Disable the fit-to-window scaling for screenshot. The fit script sets
  // inline transform, transform-origin, position, left, and top; remove them (rather
  // than override them) so stylesheet-authored values still apply.
  await page.evaluate(() => {
    for (const prop of ['transform', 'transform-origin', 'position', 'left', 'top']) {
      document.body.style.removeProperty(prop);
    }
    document.documentElement.style.background = 'transparent';
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({
    path: absoluteOutput,
    fullPage: false,
    clip: { x: 0, y: 0, width, height },
    omitBackground: dims.transparent && !jpeg,
    ...(jpeg ? { quality: 85 } : {}),
  });
  await browser.close();

  console.log(`Screenshot saved: ${absoluteOutput} (${Math.round(width * scale)}×${Math.round(height * scale)} at ${scale}x)`);
  return absoluteOutput;
}

const args = process.argv.slice(2);
const scaleIndex = args.indexOf('--scale');
let requestedScale;
if (scaleIndex !== -1) {
  requestedScale = parseFloat(args[scaleIndex + 1]);
  if (!(requestedScale > 0)) {
    console.error('--scale needs a positive number, e.g. --scale 1');
    process.exit(1);
  }
  args.splice(scaleIndex, 2);
}

if (!args[0]) {
  console.error('Usage: node scripts/screenshot.js <poster.html> [output.png|output.jpg] [--scale N]');
  process.exit(1);
}

screenshot(args[0], args[1], requestedScale).catch(err => {
  console.error(err);
  process.exit(1);
});
