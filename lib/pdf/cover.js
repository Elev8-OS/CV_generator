const theme = require("./theme");

function formatDateDE(d = new Date()) {
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Swiss-style formal cover letter ("Motivationsschreiben") as a pdfmake doc.
 */
function buildCoverDocDefinition(profile, generated, { location = "Obergösgen" } = {}) {
  const p = profile.personal;
  const paragraphs = String(generated.coverLetterBody || "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const recipientLines = [generated.company, generated.contactName ? generated.contactName : "Personalabteilung", generated.location]
    .filter(Boolean);

  return {
    pageSize: "A4",
    pageMargins: [56, 60, 56, 60],
    defaultStyle: { font: "Roboto", fontSize: 10.3, color: theme.ink, lineHeight: 1.3 },
    content: [
      {
        columns: [
          {
            width: "*",
            stack: [
              { text: p.name, bold: true, fontSize: 11 },
              { text: p.strasse, fontSize: 9.3, color: theme.grey, margin: [0, 2, 0, 0] },
              { text: `${p.plz} ${p.ort}`, fontSize: 9.3, color: theme.grey },
              { text: p.telefon, fontSize: 9.3, color: theme.grey, margin: [0, 2, 0, 0] },
              { text: p.email, fontSize: 9.3, color: theme.grey }
            ]
          },
          {
            width: 180,
            alignment: "right",
            stack: [
              { text: recipientLines[0] || "", bold: true, fontSize: 10 },
              ...recipientLines.slice(1).map((l) => ({ text: l, fontSize: 9.3, color: theme.grey }))
            ]
          }
        ],
        margin: [0, 0, 0, 30]
      },
      { text: `${location}, ${formatDateDE()}`, alignment: "right", fontSize: 9.3, color: theme.grey, margin: [0, 0, 0, 26] },
      {
        text: generated.emailSubject || `Bewerbung als ${generated.jobTitle}`,
        bold: true,
        fontSize: 11.5,
        color: theme.ink,
        margin: [0, 0, 0, 16]
      },
      ...paragraphs.map((t, i) => ({ text: t, margin: [0, i === 0 ? 0 : 10, 0, 0], alignment: "justify" })),
      {
        text: "Freundliche Grüsse",
        margin: [0, 26, 0, 34]
      },
      { text: p.name, bold: true }
    ]
  };
}

module.exports = { buildCoverDocDefinition };
