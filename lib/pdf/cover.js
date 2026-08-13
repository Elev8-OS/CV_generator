const theme = require("./theme");
const { resolveMedia } = require("../media");

const PAGE_WIDTH = 595.28;

function formatDateDE(d = new Date()) {
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
}

function telHref(tel) {
  const digits = String(tel || "").replace(/[^\d+]/g, "");
  return digits.startsWith("0") ? `+41${digits.slice(1)}` : digits;
}

// Progressively tighter spacing, used to squeeze the letter onto a single
// page when the generated text runs a bit long. Level 0 is the normal,
// comfortably spaced layout; each level after that trims margins/line-height
// a notch further before we give up and just use the tightest one.
const COMPACT_LEVELS = [
  { margins: [56, 60, 56, 60], fontSize: 10.3, lineHeight: 1.42, blockGap: 28, dateGap: 24, subjectGap: 16, paraGap: 13, signGap: 24, nameGap: 34 },
  { margins: [52, 50, 52, 50], fontSize: 10, lineHeight: 1.32, blockGap: 22, dateGap: 19, subjectGap: 13, paraGap: 10, signGap: 19, nameGap: 26 },
  { margins: [48, 40, 48, 40], fontSize: 9.6, lineHeight: 1.24, blockGap: 17, dateGap: 15, subjectGap: 11, paraGap: 8, signGap: 15, nameGap: 20 },
  { margins: [44, 32, 44, 32], fontSize: 9.2, lineHeight: 1.16, blockGap: 13, dateGap: 11, subjectGap: 9, paraGap: 6, signGap: 11, nameGap: 15 },
  { margins: [40, 24, 40, 24], fontSize: 8.8, lineHeight: 1.1, blockGap: 10, dateGap: 8, subjectGap: 7, paraGap: 4.5, signGap: 8, nameGap: 10 }
];

/**
 * Swiss-style formal cover letter ("Motivationsschreiben") as a pdfmake doc.
 * `level` selects a spacing preset (see COMPACT_LEVELS) — used by
 * renderPdfBufferFit to squeeze the letter onto one page.
 */
function buildCoverDocDefinition(profile, generated, { location = "Obergösgen", qr } = {}, level = 0) {
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
              { text: p.telefon, link: `tel:${telHref(p.telefon)}`, fontSize: L.fontSize - 1, color: theme.grey, margin: [0, 2, 0, 0] },
              { text: p.email, link: `mailto:${p.email}`, fontSize: L.fontSize - 1, color: theme.grey }
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
        margin: [0, 0, 0, Math.max(L.blockGap * 0.45, 8)]
      },
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: PAGE_WIDTH - L.margins[0] - L.margins[2], y2: 0, lineWidth: 0.75, lineColor: theme.border }],
        margin: [0, 0, 0, L.blockGap]
      },
      { text: `${location}, ${formatDateDE()}`, alignment: "right", fontSize: L.fontSize - 1, color: theme.grey, margin: [0, 0, 0, L.dateGap] },
      {
        text: generated.emailSubject || `Bewerbung als ${generated.jobTitle}`,
        bold: true,
        fontSize: L.fontSize + 1.6,
        color: theme.ink,
        margin: [0, 0, 0, 5]
      },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 34, y2: 0, lineWidth: 2, lineColor: theme.accent }], margin: [0, 0, 0, L.subjectGap] },
      ...paragraphs.map((t, i) => ({ text: t, margin: [0, i === 0 ? 0 : L.paraGap, 0, 0] })),
      {
        text: "Freundliche Grüsse",
        margin: [0, L.signGap, 0, signature ? 6 : L.nameGap]
      },
      ...(signature ? [{ image: signature.dataUri, fit: [130, 48], margin: [0, 0, 0, 4] }] : []),
      { text: p.name, bold: true },
      ...(qr
        ? [
            {
              text: "» Digitale Bewerbung mit CV, Referenzen & Zeugnissen ansehen",
              link: qr.url,
              color: theme.accent,
              fontSize: L.fontSize - 1.5,
              margin: [0, Math.max(L.nameGap * 0.5, 8), 0, 0]
            }
          ]
        : [])
    ]
  };
}

module.exports = { buildCoverDocDefinition };
