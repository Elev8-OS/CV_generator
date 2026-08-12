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

function renderPdfBuffer(docDefinition) {
  return new Promise((resolve, reject) => {
    try {
      const doc = printer.createPdfKitDocument(docDefinition);
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

module.exports = { renderPdfBuffer };
