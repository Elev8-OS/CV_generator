const { resolveTheme } = require("./theme");

// Swiss unemployment-insurance (RAV/ALV) monthly job-search proof — official
// form "716.007 — Nachweis der persönlichen Arbeitsbemühungen", submitted to
// the RAV office by the 5th of the month following the "Kontrollperiode"
// (Art. 26 AVIV). This replicates the form's required fields/columns in a
// landscape table (rather than a pixel-perfect facsimile of the tiny
// rotated-header original — pdfmake can't rotate table headers, and RAV
// offices accept any submission that carries the same information) so it can
// be generated automatically from the account's already-stored applications.
//
// Deliberately NOT run through lib/i18n.js: this is a specific Swiss-German
// government form, not part of this tool's own UI chrome — the RAV offices
// this form is filed with expect it in German regardless of the account's
// dashboard language setting.
const PAGE_MARGINS = [32, 34, 32, 34];

const PENSUM_LABEL = (row) => {
  if (row.pensumType === "teilzeit") {
    return row.pensumPercent ? `Teilzeit (${row.pensumPercent}%)` : "Teilzeit";
  }
  return "Vollzeit";
};

const BEWERBUNGSART_LABEL = {
  brieflich_elektronisch: "Brieflich / elektronisch",
  persoenlich: "Persönlich",
  telefonisch: "Telefonisch"
};

// Maps this tool's own application status (lib/statuses.js) to the form's
// "Ergebnis der Bewerbung" categories — confirmed with the account owner:
// drafts ("entwurf") never reach this form at all (filtered out by the caller
// before this builder ever sees them, since a draft was never actually sent).
const ERGEBNIS_LABEL_BY_STATUS = {
  gesendet: "noch offen",
  follow_up: "noch offen",
  interview: "Vorstellungsgespräch",
  in_auswahl: "Vorstellungsgespräch",
  zusage: "Anstellung",
  absage: "Absage"
};

function ergebnisLabel(row) {
  const base = ERGEBNIS_LABEL_BY_STATUS[row.status] || "noch offen";
  if (base === "Absage" && row.absagegrund) return `Absage: ${row.absagegrund}`;
  return base;
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

const MONTH_NAMES_DE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

/**
 * @param {object} opts
 * @param {object} opts.personal - profile.personal (name, ahvNr)
 * @param {number} opts.year
 * @param {number} opts.month - 1-12
 * @param {Array} opts.rows - applications for that month, already filtered
 *   (drafts excluded) and sorted oldest-first, each shaped like a store.js
 *   application entry (createdAt, company, jobTitle, status, ravAssignment,
 *   pensumType, pensumPercent, bewerbungsart, companyAddress, contactPhone,
 *   absagegrund).
 * @param {string} [opts.accentColor]
 */
function buildRavDocDefinition({ personal, year, month, rows, accentColor }) {
  const theme = resolveTheme(accentColor);
  const monthLabel = `${MONTH_NAMES_DE[month - 1] || ""} ${year}`;
  const p = personal || {};

  const headerBlock = {
    table: {
      widths: ["*", 160, 140],
      body: [
        [
          { text: [{ text: "Name und Vorname\n", fontSize: 8, color: theme.grey }, { text: p.name || "", fontSize: 11, bold: true }], margin: [6, 4, 6, 4] },
          { text: [{ text: "AHV-Nr.\n", fontSize: 8, color: theme.grey }, { text: p.ahvNr || "—", fontSize: 11, bold: true }], margin: [6, 4, 6, 4] },
          { text: [{ text: "Monat und Jahr\n", fontSize: 8, color: theme.grey }, { text: monthLabel, fontSize: 11, bold: true }], margin: [6, 4, 6, 4] }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.75,
      vLineWidth: () => 0.75,
      hLineColor: () => theme.border,
      vLineColor: () => theme.border
    },
    margin: [0, 10, 0, 14]
  };

  const tableHeader = [
    { text: "Datum", style: "th" },
    { text: "Firma, Adresse / Kontaktperson, Telefon-Nr.", style: "th" },
    { text: "Stellenbezeichnung", style: "th" },
    { text: "Zuweisung RAV", style: "th" },
    { text: "Pensum", style: "th" },
    { text: "Bewerbungsart", style: "th" },
    { text: "Ergebnis der Bewerbung", style: "th" }
  ];

  const tableBody = rows.map((row) => {
    const addressLines = [row.companyAddress, row.contactPhone].filter(Boolean).join("\n");
    const companyCell = [row.company || "", addressLines].filter(Boolean).join("\n");
    return [
      { text: formatDate(row.createdAt), fontSize: 8.5 },
      { text: companyCell, fontSize: 8.5 },
      { text: row.jobTitle || "", fontSize: 8.5 },
      { text: row.ravAssignment ? "Ja" : "Nein", fontSize: 8.5, alignment: "center" },
      { text: PENSUM_LABEL(row), fontSize: 8.5 },
      { text: BEWERBUNGSART_LABEL[row.bewerbungsart] || "—", fontSize: 8.5 },
      { text: ergebnisLabel(row), fontSize: 8.5 }
    ];
  });

  const emptyRow = [
    {
      text: "Keine Bewerbungen in diesem Monat erfasst.",
      fontSize: 9,
      italics: true,
      color: theme.greyLight,
      colSpan: 7,
      margin: [2, 4, 2, 4]
    },
    {}, {}, {}, {}, {}, {}
  ];

  const table = {
    table: {
      headerRows: 1,
      widths: [42, 170, 110, 55, 60, 80, "*"],
      body: [tableHeader, ...(tableBody.length ? tableBody : [emptyRow])]
    },
    layout: {
      hLineWidth: (i) => (i === 0 || i === 1 ? 1 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => theme.border,
      vLineColor: () => theme.border,
      fillColor: (rowIndex) => (rowIndex === 0 ? theme.accentSoft : null),
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4
    }
  };

  const signatureBlock = {
    margin: [0, 22, 0, 0],
    columns: [
      { text: [{ text: "Datum: ", bold: true }, { text: "________________________________" }], fontSize: 9.5 },
      { text: [{ text: "Unterschrift: ", bold: true }, { text: "________________________________" }], fontSize: 9.5 }
    ]
  };

  // Paraphrased summary of the form's statutory notice (Art. 17/26/30 AVIG,
  // Art. 26 AVIV, Art. 105 ff. AVIG) rather than a verbatim reproduction of
  // the original wording — same legal substance, own phrasing.
  const legalNotice = {
    margin: [0, 16, 0, 0],
    stack: [
      { text: "Hinweis", bold: true, fontSize: 9.5, margin: [0, 0, 0, 4] },
      {
        fontSize: 8,
        color: theme.inkSoft,
        lineHeight: 1.3,
        ul: [
          "Wer versichert ist, muss alles Zumutbare tun, um eine Arbeitslosigkeit zu vermeiden oder zu verkürzen — nötigenfalls auch ausserhalb des bisherigen Berufs (Art. 17 AVIG). Diese Pflicht gilt schon vor Eintritt der Arbeitslosigkeit, z.B. während der Kündigungsfrist.",
          "Dieses Formular ist für jede Kontrollperiode (Kalendermonat) bis spätestens am 5. Tag des Folgemonats beim zuständigen RAV einzureichen (Art. 26 AVIV). Belege (z.B. Bewerbungs- oder Absageschreiben) sind aufzubewahren und auf Verlangen vorzulegen. Zu spät eingereichte Nachweise können ohne entschuldbaren Grund nicht mehr berücksichtigt werden.",
          "Bei ungenügenden Arbeitsbemühungen oder Ablehnung einer zumutbaren Stelle kann die Anspruchsberechtigung je nach Verschulden bis zu 60 Tage eingestellt werden (Art. 30 AVIG).",
          "Unwahre oder unvollständige Angaben sind strafbar (Art. 105 ff. AVIG)."
        ]
      }
    ]
  };

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: PAGE_MARGINS,
    defaultStyle: { font: "Roboto", fontSize: 9, color: theme.ink },
    styles: {
      th: { bold: true, fontSize: 8, color: theme.ink }
    },
    content: [
      {
        columns: [
          [
            { text: "Arbeitslosenversicherung", bold: true, fontSize: 9 },
            { text: "Nachweis der persönlichen Arbeitsbemühungen", fontSize: 15, bold: true, color: theme.accent, margin: [0, 2, 0, 0] }
          ],
          {
            text: "Einzureichen beim RAV — bis spätestens am 5. Tag des Folgemonats",
            fontSize: 8.5,
            color: theme.grey,
            alignment: "right",
            margin: [0, 4, 0, 0]
          }
        ]
      },
      headerBlock,
      table,
      signatureBlock,
      legalNotice
    ]
  };
}

module.exports = { buildRavDocDefinition };
