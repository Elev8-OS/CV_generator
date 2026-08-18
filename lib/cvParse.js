// Best-effort plain-text extraction from an uploaded CV file, so its content
// can be handed to lib/ai.js's extractProfileFromCv. Supports the two
// realistic formats people actually have an existing CV in: PDF and Word
// (.docx). Anything else (or pasted text) skips this module entirely.
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const PDF_MIMES = new Set(["application/pdf"]);
const DOCX_MIMES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

function looksLikePdf(mimetype, filename) {
  return PDF_MIMES.has(mimetype) || /\.pdf$/i.test(filename || "");
}

function looksLikeDocx(mimetype, filename) {
  return DOCX_MIMES.has(mimetype) || /\.docx$/i.test(filename || "");
}

/**
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} filename
 * @returns {Promise<string>} extracted plain text
 */
async function extractTextFromFile(buffer, mimetype, filename) {
  if (looksLikePdf(mimetype, filename)) {
    const result = await pdfParse(buffer);
    return result.text || "";
  }
  if (looksLikeDocx(mimetype, filename)) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }
  throw new Error("Nicht unterstütztes Dateiformat — bitte PDF oder Word (.docx) hochladen, oder den Text direkt einfügen.");
}

module.exports = { extractTextFromFile };
