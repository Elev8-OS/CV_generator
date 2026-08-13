const theme = require("./theme");
const { resolveMedia } = require("../media");

function formatDateDE(d = new Date()) {
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
}

// Progressively tighter spacing, used to squeeze the letter onto a single
// page when the generated text runs a bit long. Level 0 is the normal,
// comfortably spaced layout; each level after that trims margins/line-height
// a notch further before we give up and just use the tightest one.
const COMPACT_LEVELS = [
  { margins: [56, 60, 56, 60], fontSize: 10.3, lineHeight: 1.3, blockGap: 30, dateGap: 26, subjectGap: 16, paraGap: 10, signGap: 26, nameGap: 34 },
  { margins: [52, 50, 52, 50], fontSize: 10, lineHeight: 1.24, blockGap: 24, dateGap: 20, subjectGap: 13, paraGap: 8, signGap: 20, nameGap: 26 },
  { margins: [48, 40, 48, 40], fontSize: 9.6, lineHeight: 1.18, blockGap: 18, dateGap: 16, subjectGap: 11, paraGap: 6.5, signGap: 15, nameGap: 20 },
  { margins: [44, 32, 44, 32], fontSize: 9.2, lineHeight: 1.13, blockGap: 14, dateGap: 12, subjectGap: 9, paraGap: 5, signGap: 11, nameGap: 15 },
  { margins: [40, 24, 40, 24], fontSize: 8.8, lineHeight: 1.08, blockGap: 10, dateGap: 9, subjectGap: 7, paraGap: 4, signGap: 8, nameGap: 10 }
];

/**
 * Swiss-style formal cover letter ("Motivationsschreiben") as a pdfmake doc.
 * `level` selects a spacing preset (see COMPACT_LEVELS) — used by
 * renderPdfBufferFit to squeeze the letter onto one page.
 */
function buildCoverDocDefinition(profile, generated, { location = "Obergösgen" } = {}, level = 0) {
  const p = profile.personal;
  const L = COMPACT_LEVELS[Math.min(level, COMPACT_LEVELS.length - 1)];
  const signature = resolveMedia("signature");

  const paragraphs = String(generated.coverLetterBody || "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const recipientLines = [generated.company, generated.contactName ? generated.contactName : "Personalabteilung", generated.location]
    .filter(Boolean);

  return {
    pageSize: "A4",
    pageMargins: L.margins,
    defaultStyle: { font: "Roboto", fontSize: L.fontSize, color: theme.ink, lineHeight: L.lineHeight },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: p.name, bold: true, fontSize: L.fontSize + 0.7 },
              { text: p.strasse, fontSize: L.fontSize - 1, color: theme.grey, margin: [0, 2, 0, 0] },
              { text: `${p.plz} ${p.ort}`, fontSize: L.fontSize - 1, color: theme.grey },
              { text: p.telefon, fontSize: L.fontSize - 1, color: theme.grey, margin: [0, 2, 0, 0] },
              { text: p.email, fontSize: L.fontSize - 1, color: theme.grey }
            ]
          },
          {
            width: 180,
            alignment: "right",
            stack: [
              { text: recipientLines[0] || "", bold: true, fontSize: L.fontSize - 0.3 },
              ...recipientLines.slice(1).map((l) => ({ text: l, fontSize: L.fontSize - 1, color: theme.grey }))
            ]
          }
        ],
        margin: [0, 0, 0, L.blockGap]
      },
      { text: `${location}, ${formatDateDE()}`, alignment: "right", fontSize: L.fontSize - 1, color: theme.grey, margin: [0, 0, 0, L.dateGap] },
      {
        text: generated.emailSubject || `Bewerbung als ${generated.jobTitle}`,
        bold: true,
        fontSize: L.fontSize + 1.2,
        color: theme.ink,
        margin: [0, 0, 0, L.subjectGap]
      },
      ...paragraphs.map((t, i) => ({ text: t, margin: [0, i === 0 ? 0 : L.paraGap, 0, 0], alignment: "justify" })),
      {
        text: "Freundliche Grüsse",
        margin: [0, L.signGap, 0, signature ? 6 : L.nameGap]
      },
      ...(signature ? [{ image: signature.dataUri, fit: [130, 48], margin: [0, 0, 0, 4] }] : []),
      { text: p.name, bold: true }
    ]
  };
}

module.exports = { buildCoverDocDefinition };
