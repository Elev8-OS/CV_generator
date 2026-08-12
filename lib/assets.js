const fs = require("fs");
const path = require("path");

// The two reference PDFs (Lehrzeugnis, EFZ) are binary files. To keep them
// safely inside a text-based git repo, they're committed as base64 (.b64)
// and decoded to real PDFs on disk once at startup.
const B64_DIR = path.join(__dirname, "..", "assets", "documents-b64");
const OUT_DIR = path.join(__dirname, "..", "assets", "documents");

const MAP = {
  "lehrzeugnis.pdf.b64": "Lehrzeugnis_R_Nussbaum_AG.pdf",
  "efz.pdf.b64": "Faehigkeitszeugnis_EFZ_Polymechaniker.pdf"
};

function ensureDocuments() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const [b64Name, outName] of Object.entries(MAP)) {
    const outPath = path.join(OUT_DIR, outName);
    if (fs.existsSync(outPath)) continue;
    const b64Path = path.join(B64_DIR, b64Name);
    if (!fs.existsSync(b64Path)) {
      console.warn(`Fehlt: ${b64Path} — Download für ${outName} wird nicht funktionieren.`);
      continue;
    }
    const b64 = fs.readFileSync(b64Path, "utf8");
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  }
}

module.exports = { ensureDocuments, OUT_DIR };
