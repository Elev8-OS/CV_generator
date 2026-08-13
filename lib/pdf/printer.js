const fs = require("fs");
const path = require("path");
const PdfPrinter = require("pdfmake");
const vfs = require("pdfmake/build/vfs_fonts");

// pdfmake ships fonts as base64 inside vfs_fonts.js. PdfPrinter/pdfkit needs
// real file paths, so we decode them to disk once at startup.
const FONT_DIR = path.join(__dirname, "..", "..", "assets", "fonts");

function ensureFonts() {
  if (!fs.existsSync(FONT_DIR)) fs.mkdirSync(FONT_DIR, { recursive: true });
  for (const [name, b64] of Object.entries(vfs)) {
    const dest = path.join(FONT_DIR, name);
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, Buffer.from(b64, "base64"));
    }
  }
}

ensureFonts();

const fontDescriptors = {
  Roboto: {
    normal: path.join(FONT_DIR, "Roboto-Regular.ttf"),
    bold: path.join(FONT_DIR, "Roboto-Medium.ttf"),
    italics: path.join(FONT_DIR, "Roboto-Italic.ttf"),
    bolditalics: path.join(FONT_DIR, "Roboto-MediumItalic.ttf")
  }
};

const printer = new PdfPrinter(fontDescriptors);

function bufferPdfKitDoc(doc) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function renderPdfBuffer(docDefinition) {
  const doc = printer.createPdfKitDocument(docDefinition);
  return bufferPdfKitDoc(doc);
}

/**
 * Renders a document that should ideally fit within `maxPages` pages.
 * `buildDocDefinition(level)` is called with an increasing compactness level
 * (0, 1, 2, ...) — the caller should shrink fonts/margins/line-height a bit
 * more at each level. We keep the first attempt that already fits, and fall
 * back to the last (most compact) attempt if it never does.
 */
function renderPdfBufferFit(buildDocDefinition, { maxPages = 1, maxAttempts = 5 } = {}) {
  let lastDoc = null;
  for (let level = 0; level < maxAttempts; level++) {
    const docDefinition = buildDocDefinition(level);
    const doc = printer.createPdfKitDocument(docDefinition);
    const pageCount = Array.isArray(doc._pdfMakePages) ? doc._pdfMakePages.length : 1;
    lastDoc = doc;
    if (pageCount <= maxPages) break;
  }
  return bufferPdfKitDoc(lastDoc);
}

module.exports = { renderPdfBuffer, renderPdfBufferFit };
