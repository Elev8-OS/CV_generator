// Swiss unemployment-insurance (RAV/ALV) monthly job-search proof — official
// form "716.007 — Nachweis der persönlichen Arbeitsbemühungen", submitted to
// the RAV office by the 5th of the month following the "Kontrollperiode"
// (Art. 26 AVIV). Layout/wording verified against the actual current form
// published by SECO (arbeit.swiss) so this reads as close to indistinguishable
// from the original as pdfmake's layout engine allows: same monochrome
// black-on-white look (the real form carries no colour at all — no accent
// tint here either, deliberately, unlike this tool's other PDFs), same column
// order/headers, and the same three-way "Bewerbung" / four-way "Ergebnis der
// Bewerbung" choices rendered as actual tick-boxes (drawn via pdfmake canvas
// rects — Roboto has no glyph for the Unicode ballot-box characters ☐/☒, they
// render as tofu, so real boxes are drawn instead) with the applicable one
// crossed, rather than just printing the chosen option as plain text.
//
// Deliberately NOT run through lib/i18n.js: this is a specific Swiss-German
// government form, not part of this tool's own UI chrome — the RAV offices
// this form is filed with expect it in German regardless of the account's
// dashboard language setting.
const PAGE_MARGINS = [30, 32, 30, 30];
const INK = "#000000";
const GREY = "#555555";
const GREY_LIGHT = "#8a8a8a";
const BORDER = "#000000";

// Small drawn checkbox (pdfmake has no reliable glyph for ☐/☒ in the embedded
// Roboto font — see module comment) + label, one per line. Used for every
// tri/quad-state field on the form (Zuweisung RAV, Pensum, Bewerbung,
// Ergebnis der Bewerbung) so the PDF shows ALL possible options with the
// applicable one crossed, exactly like the paper original, instead of just
// printing the chosen value as plain text.
function checkboxLine(label, checked) {
  const size = 7;
  return {
    columns: [
      {
        width: size + 3,
        canvas: [
          { type: "rect", x: 0, y: 1, w: size, h: size, lineWidth: 0.75, lineColor: INK },
          ...(checked
            ? [
                { type: "line", x1: 0.8, y1: 1.8, x2: size - 0.8, y2: size + 0.2, lineWidth: 0.9, lineColor: INK },
                { type: "line", x1: 0.8, y1: size + 0.2, x2: size - 0.8, y2: 1.8, lineWidth: 0.9, lineColor: INK }
              ]
            : [])
        ]
      },
      { width: "auto", text: label, fontSize: 7.3, margin: [2, 0, 0, 0] }
    ],
    columnGap: 2,
    margin: [0, 0.5, 0, 0.5]
  };
}

// Order/wording verified against the real form: "Brieflich / elektronisch",
// "Persönlich", "Telefonisch" — kept exactly as printed on the official form
// rather than any other phrasing, since the whole point of this column is to
// match what the RAV office actually expects to see ticked.
const BEWERBUNGSART_OPTIONS = [
  { key: "brieflich_elektronisch", label: "Brieflich / elektronisch" },
  { key: "persoenlich", label: "Persönlich" },
  { key: "telefonisch", label: "Telefonisch" }
];

function bewerbungsartCell(row) {
  return { stack: BEWERBUNGSART_OPTIONS.map((o) => checkboxLine(o.label, o.key === row.bewerbungsart)) };
}

function zuweisungCell(row) {
  return {
    stack: [checkboxLine("Ja", Boolean(row.ravAssignment)), checkboxLine("Nein", !row.ravAssignment)]
  };
}

function pensumCell(row) {
  const isTeilzeit = row.pensumType === "teilzeit";
  const teilzeitLabel = isTeilzeit && row.pensumPercent ? `Teilzeit ${row.pensumPercent}%` : "Teilzeit";
  return {
    stack: [checkboxLine("Vollzeit", !isTeilzeit), checkboxLine(teilzeitLabel, isTeilzeit)]
  };
}

// Maps this tool's own application status (lib/statuses.js) onto the form's
// four "Ergebnis der Bewerbung" categories — confirmed with the account
// owner. Drafts ("entwurf") never reach this form at all (filtered out by the
// caller before this builder ever sees them, since a draft was never actually
// sent).
const ERGEBNIS_OPTIONS = [
  { key: "offen", label: "noch offen" },
  { key: "gespraech", label: "Vorstellungsgespräch" },
  { key: "anstellung", label: "Anstellung" },
  { key: "absage", label: "Absage" }
];
const ERGEBNIS_KEY_BY_STATUS = {
  gesendet: "offen",
  follow_up: "offen",
  interview: "gespraech",
  in_auswahl: "gespraech",
  zusage: "anstellung",
  absage: "absage"
};

function ergebnisCell(row) {
  const key = ERGEBNIS_KEY_BY_STATUS[row.status] || "offen";
  const lines = ERGEBNIS_OPTIONS.map((o) => checkboxLine(o.label, o.key === key));
  if (key === "absage" && row.absagegrund) {
    lines.push({ text: `Grund: ${row.absagegrund}`, fontSize: 6.8, italics: true, color: GREY, margin: [11, 1.5, 0, 0] });
  }
  return { stack: lines };
}

function formatShortDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

function formatFullDate(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
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
 * @param {string|null} [opts.signatureDataUri] - data: URI of the account's
 *   uploaded signature image (lib/media.js "signature" key, the same one used
 *   for the cover letter) — embedded directly onto the signature line when
 *   present, so the form doesn't need to be printed and signed by hand.
 * @param {Date} [opts.generatedAt] - stamped next to the signature as the
 *   signing date; only meaningful (and only shown) alongside an actual
 *   signature image — with no signature on file the date is left blank too,
 *   for the person to fill in by hand together with a physical signature.
 */
function buildRavDocDefinition({ personal, year, month, rows, signatureDataUri, generatedAt }) {
  const monthLabel = `${MONTH_NAMES_DE[month - 1] || ""} ${year}`;
  const p = personal || {};

  const headerBlock = {
    table: {
      widths: ["*", 160, 140],
      body: [
        [
          { text: [{ text: "Name und Vorname\n", fontSize: 8, color: GREY }, { text: p.name || "", fontSize: 11, bold: true }], margin: [6, 4, 6, 4] },
          { text: [{ text: "AHV-Nr.\n", fontSize: 8, color: GREY }, { text: p.ahvNr || "—", fontSize: 11, bold: true }], margin: [6, 4, 6, 4] },
          { text: [{ text: "Monat und Jahr\n", fontSize: 8, color: GREY }, { text: monthLabel, fontSize: 11, bold: true }], margin: [6, 4, 6, 4] }
        ]
      ]
    },
    layout: {
      hLineWidth: () => 0.75,
      vLineWidth: () => 0.75,
      hLineColor: () => BORDER,
      vLineColor: () => BORDER
    },
    margin: [0, 10, 0, 14]
  };

  const tableHeader = [
    { text: "Datum der\nBewerbung", style: "th" },
    { text: "Firma, Adresse /\nKontaktperson, Telefon-Nr.", style: "th" },
    { text: "Stellenbezeichnung", style: "th" },
    { text: "Zuweisung\nRAV", style: "th" },
    { text: "Pensum", style: "th" },
    { text: "Bewerbung", style: "th" },
    { text: "Ergebnis der Bewerbung", style: "th" }
  ];

  const tableBody = rows.map((row) => {
    const addressLines = [row.companyAddress, row.contactPhone].filter(Boolean).join("\n");
    const companyCell = [row.company || "", addressLines].filter(Boolean).join("\n");
    return [
      { text: formatShortDate(row.createdAt), fontSize: 8 },
      { text: companyCell, fontSize: 8 },
      { text: row.jobTitle || "", fontSize: 8 },
      zuweisungCell(row),
      pensumCell(row),
      bewerbungsartCell(row),
      ergebnisCell(row)
    ];
  });

  const emptyRow = [
    {
      text: "Keine Bewerbungen in diesem Monat erfasst.",
      fontSize: 9,
      italics: true,
      color: GREY_LIGHT,
      colSpan: 7,
      margin: [2, 4, 2, 4]
    },
    {}, {}, {}, {}, {}, {}
  ];

  const table = {
    table: {
      headerRows: 1,
      widths: [40, "*", 90, 42, 56, 118, 148],
      body: [tableHeader, ...(tableBody.length ? tableBody : [emptyRow])]
    },
    layout: {
      hLineWidth: (i) => (i === 0 || i === 1 ? 1 : 0.5),
      vLineWidth: () => 0.5,
      hLineColor: () => BORDER,
      vLineColor: () => BORDER,
      fillColor: () => null,
      paddingLeft: () => 4,
      paddingRight: () => 4,
      paddingTop: () => 4,
      paddingBottom: () => 4
    }
  };

  const hasSignature = Boolean(signatureDataUri);
  const signatureBlock = {
    margin: [0, 20, 0, 0],
    columns: [
      {
        width: 220,
        stack: [
          { text: "Datum", fontSize: 7.5, color: GREY },
          { text: hasSignature ? formatFullDate(generatedAt) : "", bold: true, fontSize: 10, margin: [0, 2, 0, 0] },
          ...(hasSignature ? [] : [{ canvas: [{ type: "line", x1: 0, y1: 14, x2: 190, y2: 14, lineWidth: 0.75, lineColor: INK }] }])
        ]
      },
      {
        width: "*",
        stack: [
          { text: "Unterschrift der versicherten Person", fontSize: 7.5, color: GREY },
          ...(hasSignature
            ? [{ image: signatureDataUri, fit: [140, 46], margin: [0, 3, 0, 0] }]
            : [{ canvas: [{ type: "line", x1: 0, y1: 30, x2: 320, y2: 30, lineWidth: 0.75, lineColor: INK }] }])
        ]
      }
    ]
  };

  // Paraphrased summary of the form's statutory notice (Art. 17/26/30 AVIG,
  // Art. 26 AVIV, Art. 105 ff. AVIG) rather than a verbatim reproduction of
  // the original wording — same legal substance, own phrasing.
  const legalNotice = {
    margin: [0, 14, 0, 0],
    stack: [
      { text: "Hinweis", bold: true, fontSize: 9.5, margin: [0, 0, 0, 4] },
      {
        fontSize: 8,
        color: GREY,
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
    defaultStyle: { font: "Roboto", fontSize: 9, color: INK },
    styles: {
      th: { bold: true, fontSize: 7.8, color: INK, lineHeight: 1.15 }
    },
    content: [
      {
        columns: [
          [
            { text: "Arbeitslosenversicherung", bold: true, fontSize: 9 },
            { text: "Nachweis der persönlichen Arbeitsbemühungen", fontSize: 15, bold: true, margin: [0, 2, 0, 0] }
          ],
          {
            width: 190,
            alignment: "right",
            stack: [
              { text: "716.007", fontSize: 8, color: GREY },
              {
                text: "Einzureichen beim RAV — bis spätestens am 5. Tag des Folgemonats",
                fontSize: 8,
                color: GREY,
                margin: [0, 3, 0, 0]
              }
            ]
          }
        ]
      },
      headerBlock,
      table,
      signatureBlock,
      legalNotice,
      {
        text: "Layout nachgebaut nach dem offiziellen SECO-Formular 716.007, automatisch ausgefüllt.",
        fontSize: 6.2,
        color: GREY_LIGHT,
        italics: true,
        margin: [0, 16, 0, 0]
      }
    ]
  };
}

module.exports = { buildRavDocDefinition };
