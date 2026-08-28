// Shared poster dimension parsing for export.js and screenshot.js.
//
// Reads the poster's body { ... } CSS block and returns:
//   cssWidth / cssHeight  - viewport size in CSS pixels
//   physical              - true when the body is sized in mm or in
//   pdfWidth / pdfHeight  - values to pass to page.pdf() ("210mm" stays
//                           physical so the PDF page has the true print size)
//   transparent           - body declares `background: transparent`
//
// Physical units convert at the CSS standard 96 px per inch (25.4 mm per inch).
// Posters with no parseable body dimensions fall back to 1080x1920.

const CSS_PX_PER_IN = 96;
const MM_PER_IN = 25.4;

function toCssPx(value, unit) {
  if (unit === "mm") return Math.round((value / MM_PER_IN) * CSS_PX_PER_IN);
  if (unit === "in") return Math.round(value * CSS_PX_PER_IN);
  return Math.round(value);
}

function parseSide(block, side) {
  const match = block.match(new RegExp(`${side}\\s*:\\s*([\\d.]+)(px|mm|in)`));
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2];
  return {
    cssPx: toCssPx(value, unit),
    physical: unit !== "px",
    declaration: `${match[1]}${unit}`,
  };
}

function parseDimensions(html) {
  const result = {
    cssWidth: 1080,
    cssHeight: 1920,
    physical: false,
    pdfWidth: "1080px",
    pdfHeight: "1920px",
    transparent: false,
  };

  const bodyBlock = html.match(/body\s*\{[^}]*\}/);
  if (!bodyBlock) return result;

  const width = parseSide(bodyBlock[0], "width");
  const height = parseSide(bodyBlock[0], "height");

  if (width) {
    result.cssWidth = width.cssPx;
    result.pdfWidth = width.physical ? width.declaration : `${width.cssPx}px`;
    result.physical = result.physical || width.physical;
  }
  if (height) {
    result.cssHeight = height.cssPx;
    result.pdfHeight = height.physical ? height.declaration : `${height.cssPx}px`;
    result.physical = result.physical || height.physical;
  }

  result.transparent = /background\s*:\s*transparent/.test(bodyBlock[0]);
  return result;
}

module.exports = { parseDimensions };
