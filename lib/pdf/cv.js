const theme = require("./theme");
const { resolveMedia } = require("../media");

function bulletList(items, { color = theme.ink, fontSize = 9.5, gap = 3 } = {}) {
  return items.map((t, i) => ({
    columns: [
      { width: 8, text: "—", color: theme.accent, bold: true, fontSize },
      { width: "*", text: t, fontSize, color, lineHeight: 1.25 }
    ],
    columnGap: 4,
    margin: [0, i === 0 ? 0 : gap, 0, 0]
  }));
}

function sectionTitle(text, { color = theme.ink } = {}) {
  return {
    stack: [
      { text: text.toUpperCase(), bold: true, fontSize: 10.5, color, characterSpacing: 1 },
      {
        canvas: [{ type: "line", x1: 0, y1: 4, x2: 40, y2: 4, lineWidth: 1.6, lineColor: theme.accent }]
      }
    ],
    margin: [0, 0, 0, 8]
  };
}

/**
 * Build a pdfmake document definition for Raffael's tailored CV.
 * @param {object} profile  raw profile data (lib/profile.js shape)
 * @param {object} generated AI output (see lib/ai.js TOOL_SCHEMA)
 */
function buildCvDocDefinition(profile, generated) {
  const p = profile.personal;
  const contactLine = [p.email, p.telefon, `${p.plz} ${p.ort}`, p.linkedin].filter(Boolean).join("   ·   ");

  const experienceById = Object.fromEntries(profile.experience.map((e) => [e.id, e]));
  const order = Object.keys(generated.experienceHighlights || {}).filter(
    (id) => experienceById[id] && id !== "bbz"
  );
  const orderedExperience = order.length
    ? order
    : profile.experience.filter((e) => e.id !== "bbz").map((e) => e.id);

  const experienceBlocks = orderedExperience
    .map((id) => {
      const exp = experienceById[id];
      if (!exp) return null;
      const highlights = (generated.experienceHighlights && generated.experienceHighlights[id]) || exp.bullets.slice(0, 3);
      return {
        stack: [
          {
            columns: [
              { width: "*", text: `${exp.role}`, bold: true, fontSize: 11, color: theme.ink },
              { width: "auto", text: exp.period, fontSize: 9, color: theme.grey, alignment: "right" }
            ]
          },
          { text: `${exp.org} — ${exp.location}`, italics: true, fontSize: 9, color: theme.inkSoft, margin: [0, 1, 0, 5] },
          ...bulletList(highlights)
        ],
        margin: [0, 0, 0, 14]
      };
    })
    .filter(Boolean);

  const nussbaum = experienceById["nussbaum"];
  const photo = resolveMedia("photo");

  const photoFrame = photo
    ? {
        width: 84,
        table: {
          widths: [76],
          body: [[{ image: photo.dataUri, fit: [72, 92], alignment: "center", margin: [2, 2, 2, 2] }]]
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
          fillColor: () => "#ffffff"
        }
      }
    : null;

  const sidebar = {
    width: 168,
    stack: [
      sectionTitle("Kernstärken"),
      {
        stack: (generated.selectedStrengths || []).map((s, i) => ({
          margin: [0, i === 0 ? 0 : 6, 0, 0],
          stack: [
            { text: s.title, bold: true, fontSize: 9.5, color: theme.ink },
            { text: s.why, fontSize: 8.3, color: theme.grey, lineHeight: 1.15, margin: [0, 1, 0, 0] }
          ]
        }))
      },
      { text: "", margin: [0, 10, 0, 0] },
      sectionTitle("Ausbildung"),
      {
        stack: [
          { text: "Polymechaniker EFZ", bold: true, fontSize: 9.5, color: theme.ink },
          {
            text: "R. Nussbaum AG, Trimbach & BBZ Solothurn-Grenchen",
            fontSize: 8.3,
            color: theme.grey,
            margin: [0, 1, 0, 1]
          },
          { text: nussbaum.period, fontSize: 8.3, color: theme.grey },
          { text: `Note: ${nussbaum.abschlussnote}`, fontSize: 8.3, color: theme.accent, bold: true, margin: [0, 2, 0, 0] }
        ]
      },
      { text: "", margin: [0, 10, 0, 0] },
      sectionTitle("Sprachen"),
      {
        stack: profile.languages.map((l, i) => ({
          margin: [0, i === 0 ? 0 : 3.5, 0, 0],
          columns: [
            { width: "*", text: l.name, fontSize: 9, color: theme.ink },
            { width: "auto", text: l.level, fontSize: 8, color: theme.grey, alignment: "right" }
          ]
        }))
      },
      { text: "", margin: [0, 10, 0, 0] },
      sectionTitle("Kenntnisse"),
      { stack: bulletList(profile.itSkills.slice(0, 3), { fontSize: 8.5, gap: 3 }) },
      { text: "", margin: [0, 10, 0, 0] },
      sectionTitle("Persönliches"),
      {
        stack: [
          { text: p.staatsangehoerigkeit, fontSize: 8.5, color: theme.grey },
          { text: `Führerausweis: ${p.fuehrerausweis}`, fontSize: 8.5, color: theme.grey, margin: [0, 2, 0, 0] },
          { text: `Verfügbar ${p.verfuegbarkeit}`, fontSize: 8.5, color: theme.grey, margin: [0, 2, 0, 0] }
        ]
      }
    ]
  };

  const main = {
    width: "*",
    stack: [
      sectionTitle("Profil"),
      { text: generated.summary, fontSize: 9.8, color: theme.inkSoft, lineHeight: 1.35, margin: [0, 0, 0, 16] },
      sectionTitle("Erfahrung"),
      ...experienceBlocks
    ],
    margin: [22, 0, 0, 0]
  };

  return {
    pageSize: "A4",
    pageMargins: [0, 0, 0, 36],
    defaultStyle: { font: "Roboto", color: theme.ink },
    content: [
      {
        margin: [0, 0, 0, 0],
        table: {
          widths: ["*"],
          body: [
            [
              {
                fillColor: theme.ink,
                border: [false, false, false, false],
                margin: [40, 26, 40, 22],
                columns: [
                  {
                    width: "*",
                    stack: [
                      { text: p.name, color: "#ffffff", fontSize: 24, bold: true },
                      { text: generated.headline, color: theme.accent, fontSize: 11.5, bold: true, margin: [0, 3, 0, 8] },
                      { text: contactLine, color: "#cfd3da", fontSize: 8.8 }
                    ]
                  },
                  ...(photoFrame ? [photoFrame] : [])
                ],
                columnGap: 20
              }
            ]
          ]
        },
        layout: "noBorders"
      },
      {
        margin: [40, 24, 40, 0],
        columns: [sidebar, main],
        columnGap: 24
      }
    ],
    footer: (currentPage, pageCount) => ({
      margin: [40, 8, 40, 0],
      columns: [
        { text: `${p.name} — Bewerbungsunterlagen`, fontSize: 7.5, color: theme.greyLight },
        { text: `${currentPage} / ${pageCount}`, fontSize: 7.5, color: theme.greyLight, alignment: "right" }
      ]
    })
  };
}

module.exports = { buildCvDocDefinition };
