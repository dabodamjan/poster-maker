// Shared poster dimension parsing for export.js and screenshot.js.
//
// Reads the poster's body { ... } CSS block and returns:
//   cssWidth / cssHeight  - viewport size in CSS pixels
//   physical              - true when the body is sized in mm or in
//   pdfWidth / pdfHeight  - values to pass to page.pdf() ("210mm" stays
//                           physical so the PDF page has the true print size)
//   transparent           - body declares `background: transparent`
//
// Physical units (mm, cm, in) convert at the CSS standard 96 px per inch.
// Posters with no parseable body dimensions fall back to 1080x1920.

const CSS_PX_PER_IN = 96;
const MM_PER_IN = 25.4;
const CM_PER_IN = 2.54;

function toCssPx(value, unit) {
  if (unit === "mm") return Math.round((value / MM_PER_IN) * CSS_PX_PER_IN);
  if (unit === "cm") return Math.round((value / CM_PER_IN) * CSS_PX_PER_IN);
  if (unit === "in") return Math.round(value * CSS_PX_PER_IN);
  return Math.round(value);
}

function parseSide(block, side) {
  // (?<![-\w]) keeps min-width/max-width from matching as width,
  // and line-height from matching as height.
  const match = block.match(
    new RegExp(`(?<![-\\w])${side}\\s*:\\s*(\\d*\\.?\\d+)(px|mm|cm|in)\\b`, "i")
  );
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2].toLowerCase();
  return {
    cssPx: toCssPx(value, unit),
    physical: unit !== "px",
    declaration: `${value}${unit}`,
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

  // (?<![.#\w-]) keeps class/id selectors like .body or #somebody from matching.
  // Of all body blocks, use the first one that declares a dimension, so a
  // plain reset like `html, body { margin: 0 }` does not shadow the sizing rule.
  const bodyBlocks = html.match(/(?<![.#\w-])body\s*\{[^}]*\}/gi) || [];
  const sized =
    bodyBlocks.find((b) => parseSide(b, "width") || parseSide(b, "height")) ||
    bodyBlocks[0];
  if (!sized) return result;

  const width = parseSide(sized, "width");
  const height = parseSide(sized, "height");

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

  result.transparent = /background\s*:\s*transparent/.test(sized);
  return result;
}

module.exports = { parseDimensions };
