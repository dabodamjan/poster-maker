#!/usr/bin/env node
// Take a screenshot of a poster HTML file using Playwright
// Usage: node scripts/screenshot.js posters/my-poster.html [output.png]

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { parseDimensions } = require('./dimensions');

async function screenshot(htmlPath, outputPath) {
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

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(`file://${absoluteHtml}`, { waitUntil: 'networkidle' });

  // Disable the fit-to-window scaling for screenshot. The fit script sets
  // inline transform, position, left, and top; remove all four (rather
  // than override them) so stylesheet-authored values still apply.
  await page.evaluate(() => {
    for (const prop of ['transform', 'position', 'left', 'top']) {
      document.body.style.removeProperty(prop);
    }
    document.documentElement.style.background = 'transparent';
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  await page.screenshot({ path: absoluteOutput, fullPage: false, clip: { x: 0, y: 0, width, height }, omitBackground: dims.transparent });
  await browser.close();

  console.log(`Screenshot saved: ${absoluteOutput} (${width * 2}×${height * 2} at 2x)`);
  return absoluteOutput;
}

const args = process.argv.slice(2);
if (!args[0]) {
  console.error('Usage: node scripts/screenshot.js <poster.html> [output.png]');
  process.exit(1);
}

screenshot(args[0], args[1]).catch(err => {
  console.error(err);
  process.exit(1);
});
