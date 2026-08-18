const { resolveTheme } = require("./theme");
const { getPrimaryEducation } = require("../profileHelpers");
const { t, normalizeLang } = require("../i18n");

const PAGE_WIDTH = 595.28;
const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 132;
const PHOTO_SIZE = 104;
const SIDEBAR_WIDTH = 168;
const COLUMN_GAP = 24;
const SIDEBAR_PANEL_WIDTH = PAGE_MARGIN + SIDEBAR_WIDTH + COLUMN_GAP / 2;

// Progressively tighter sidebar/body spacing, used to fit the whole CV onto
// one page regardless of how many experience entries or strengths the AI
// picked for this job. The header (name/photo) stays fixed size — only the
// body content scales down, and only as far as level 3 (still comfortably
// legible) before we give up and accept a clean, honestly-paginated 2nd page.
const COMPACT_LEVELS = [1, 0.93, 0.87, 0.82];

function sc(level, n) {
  return Math.round(n * COMPACT_LEVELS[Math.min(level, COMPACT_LEVELS.length - 1)] * 100) / 100;
}

function telHref(tel) {
  const digits = String(tel || "").replace(/[^\d+]/g, "");
  return digits.startsWith("0") ? `+41${digits.slice(1)}` : digits;
}

function linkedinHref(linkedin) {
  const v = String(linkedin || "").trim();
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

/** Contact line as clickable rich-text runs (email/phone/LinkedIn open their
 * respective app; the address stays plain text) instead of a flat string. */
function contactRuns(p, links = [], { color = "#cfd3da", sepColor = "#8b909c" } = {}) {
  const parts = [];
  if (p.email) parts.push({ text: p.email, link: `mailto:${p.email}`, color });
  if (p.telefon) parts.push({ text: p.telefon, link: `tel:${telHref(p.telefon)}`, color });
  if (p.plz && p.ort) parts.push({ text: `${p.plz} ${p.ort}`, color });
  if (p.linkedin) parts.push({ text: p.linkedin, link: linkedinHref(p.linkedin), color });
  (links || []).forEach((l) => {
    if (l && l.url) parts.push({ text: l.label || l.url, link: linkedinHref(l.url), color });
  });
  const runs = [];
  parts.forEach((part, i) => {
    if (i > 0) runs.push({ text: "   ·   ", color: sepColor });
    runs.push(part);
  });
  return runs;
}

function bulletList(items, level, theme, { color = theme.ink, baseFontSize = 9.5, baseGap = 3 } = {}) {
  const fontSize = sc(level, baseFontSize);
  const gap = sc(level, baseGap);
  return items.map((t, i) => ({
    columns: [
      { width: 9, text: "•", color: theme.accent, bold: true, fontSize: fontSize + 1 },
      { width: "*", text: t, fontSize, color, lineHeight: 1.25 }
    ],
    columnGap: 4,
    margin: [0, i === 0 ? 0 : gap, 0, 0],
    // Prevents pdfmake from splitting a single bullet's marker and text
    // across a page break (which otherwise leaves an orphaned "•" behind).
    unbreakable: true
  }));
}

function sectionTitle(text, level, theme, { color = theme.ink, baseGap = 8 } = {}) {
  return {
    stack: [
      { text: text.toUpperCase(), bold: true, fontSize: sc(level, 10.3), color, characterSpacing: 1 },
      { canvas: [{ type: "line", x1: 0, y1: 4, x2: 32, y2: 4, lineWidth: 1.6, lineColor: theme.accent }] }
    ],
    margin: [0, 0, 0, sc(level, baseGap)]
  };
}

function spacer(level, base = 10) {
  return { text: "", margin: [0, sc(level, base), 0, 0] };
}

/** Circular, softly-ringed portrait — clipped via SVG so it never has hard
 * rectangular corners, overlapping the header/body boundary like a modern
 * profile card. */
function photoSvg(dataUri, theme) {
  const d = PHOTO_SIZE;
  const r = d / 2;
  return `<svg width="${d}" height="${d}" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="pc"><circle cx="${r}" cy="${r}" r="${r - 4}"/></clipPath></defs>
    <circle cx="${r}" cy="${r}" r="${r}" fill="#ffffff"/>
    <image href="${dataUri}" x="4" y="4" width="${d - 8}" height="${d - 8}" clip-path="url(#pc)" preserveAspectRatio="xMidYMid slice"/>
    <circle cx="${r}" cy="${r}" r="${r - 2}" fill="none" stroke="${theme.accent}" stroke-width="2.4"/>
  </svg>`;
}

/**
 * Build a pdfmake document definition for a tailored CV.
 * `level` (0-3) selects a spacing preset for the body content — used by
 * renderPdfBufferFit to reliably fit the CV onto one page instead of an
 * arbitrary, content-dependent page break.
 * @param {object} profile  raw profile data (lib/profile.js shape)
 * @param {object} generated AI output (see lib/ai.js TOOL_SCHEMA)
 * @param {object} opts.photo resolved photo (see lib/media.js resolveMedia), or null
 */
function buildCvDocDefinition(profile, generated, { qr, photo, lang = "de", accentColor } = {}, level = 0) {
  const l = normalizeLang(lang);
  const theme = resolveTheme(accentColor);
  const p = profile.personal;

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
              { width: "*", text: `${exp.role}`, bold: true, fontSize: sc(level, 11), color: theme.ink },
              { width: "auto", text: exp.period, fontSize: sc(level, 9), color: theme.grey, alignment: "right" }
            ]
          },
          {
            text: `${exp.org} — ${exp.location}`,
            italics: true,
            fontSize: sc(level, 9),
            color: theme.inkSoft,
            margin: [0, 1, 0, sc(level, 5)]
          },
          ...bulletList(highlights, level, theme)
        ],
        margin: [0, 0, 0, sc(level, 14)]
      };
    })
    .filter(Boolean);

  const primaryEducation = getPrimaryEducation(profile);

  const sidebar = {
    width: SIDEBAR_WIDTH,
    stack: [
      sectionTitle(t(l, "pdf.strengths"), level, theme),
      {
        stack: (generated.selectedStrengths || []).map((s, i) => ({
          margin: [0, i === 0 ? 0 : sc(level, 6), 0, 0],
          stack: [
            { text: s.title, bold: true, fontSize: sc(level, 9.5), color: theme.ink },
            { text: s.why, fontSize: sc(level, 8.3), color: theme.grey, lineHeight: 1.15, margin: [0, 1, 0, 0] }
          ]
        }))
      },
      ...(primaryEducation
        ? [
            spacer(level),
            sectionTitle(t(l, "pdf.education"), level, theme),
            {
              stack: [
                { text: primaryEducation.title || "", bold: true, fontSize: sc(level, 9.5), color: theme.ink },
                ...(primaryEducation.org
                  ? [{ text: primaryEducation.org, fontSize: sc(level, 8.3), color: theme.grey, margin: [0, 1, 0, 1] }]
                  : []),
                ...(primaryEducation.period
                  ? [{ text: primaryEducation.period, fontSize: sc(level, 8.3), color: theme.grey }]
                  : []),
                ...(primaryEducation.note
                  ? [{ text: `${t(l, "pdf.grade")}: ${primaryEducation.note}`, fontSize: sc(level, 8.3), color: theme.accent, bold: true, margin: [0, 2, 0, 0] }]
                  : [])
              ]
            }
          ]
        : []),
      spacer(level),
      sectionTitle(t(l, "pdf.languages"), level, theme),
      {
        stack: profile.languages.map((l, i) => ({
          margin: [0, i === 0 ? 0 : sc(level, 3.5), 0, 0],
          columns: [
            { width: "*", text: l.name, fontSize: sc(level, 9), color: theme.ink },
            { width: "auto", text: l.level, fontSize: sc(level, 8), color: theme.grey, alignment: "right" }
          ]
        }))
      },
      spacer(level),
      sectionTitle(t(l, "pdf.skills"), level, theme),
      { stack: bulletList(profile.itSkills.slice(0, 3), level, theme, { baseFontSize: 8.5, baseGap: 3 }) },
      spacer(level),
      sectionTitle(t(l, "pdf.personalInfo"), level, theme),
      {
        stack: [
          { text: p.staatsangehoerigkeit, fontSize: sc(level, 8.5), color: theme.grey },
          { text: `${t(l, "pdf.drivingLicense")}: ${p.fuehrerausweis}`, fontSize: sc(level, 8.5), color: theme.grey, margin: [0, 2, 0, 0] },
          { text: `${t(l, "pdf.availableFrom")} ${p.verfuegbarkeit}`, fontSize: sc(level, 8.5), color: theme.grey, margin: [0, 2, 0, 0] }
        ]
      }
    ]
  };

  // The photo intentionally overlaps the header/body boundary (see photoSvg
  // comment) for a modern profile-card look, hanging PHOTO_SIZE/2 below the
  // header on the right side where the "main" column lives. Without extra
  // clearance the "Profil" heading/summary text starts right under the
  // header and collides with the bottom half of the photo. This offset is
  // computed from the fixed header/photo geometry (which doesn't scale with
  // `level`) vs. the compact-level-scaled top margin, so it stays correct
  // at every compact level, and only the right-hand main column is pushed
  // down — the sidebar isn't under the photo, so it keeps its normal spacing.
  const photoClearanceBottom = HEADER_HEIGHT + PHOTO_SIZE / 2 + 14;
  const mainTopOffset = photo ? Math.max(0, photoClearanceBottom - (HEADER_HEIGHT + sc(level, 26))) : 0;

  const main = {
    width: "*",
    stack: [
      ...(mainTopOffset > 0 ? [{ text: "", margin: [0, 0, 0, mainTopOffset] }] : []),
      sectionTitle(t(l, "pdf.profile"), level, theme),
      { text: generated.summary, fontSize: sc(level, 9.8), color: theme.inkSoft, lineHeight: 1.35, margin: [0, 0, 0, sc(level, 16)] },
      sectionTitle(t(l, "pdf.experience"), level, theme),
      ...experienceBlocks,
      ...(qr
        ? [
            {
              margin: [0, sc(level, 10), 0, 0],
              table: {
                widths: [46, "*"],
                body: [
                  [
                    { image: qr.dataUri, width: 46, link: qr.url, border: [false, false, false, false] },
                    {
                      border: [false, false, false, false],
                      margin: [10, 2, 0, 0],
                      stack: [
                        { text: t(l, "pdf.digitalApplication"), bold: true, fontSize: sc(level, 8.7), color: theme.ink },
                        {
                          text: t(l, "pdf.qrHint"),
                          fontSize: sc(level, 7.6),
                          color: theme.grey,
                          lineHeight: 1.2,
                          margin: [0, 2, 0, 2]
                        },
                        { text: qr.url.replace(/^https?:\/\//, ""), fontSize: sc(level, 7.6), color: theme.accent, link: qr.url, bold: true }
                      ]
                    }
                  ]
                ]
              },
              layout: {
                hLineWidth: () => 0,
                vLineWidth: () => 0,
                paddingLeft: () => 0,
                paddingRight: () => 0,
                paddingTop: () => 0,
                paddingBottom: () => 0
              }
            }
          ]
        : [])
    ],
    margin: [22, 0, 0, 0]
  };

  const content = [
    {
      margin: [0, 0, 0, 0],
      table: {
        widths: ["*"],
        heights: [HEADER_HEIGHT],
        body: [
          [
            {
              fillColor: theme.ink,
              border: [false, false, false, false],
              margin: [40, 30, 40, 0],
              stack: [
                { text: p.name, color: "#ffffff", fontSize: 24, bold: true },
                { text: generated.headline, color: theme.accent, fontSize: 11.5, bold: true, margin: [0, 4, 0, 9] },
                { text: contactRuns(p, profile.links), fontSize: 8.8 }
              ]
            }
          ]
        ]
      },
      layout: "noBorders"
    }
  ];

  // The photo must be emitted BEFORE the (potentially page-overflowing)
  // sidebar/main columns block — absolutePosition always applies to whatever
  // page is "current" at the point the element is reached in the content
  // flow, so adding it afterwards would place it on page 2 whenever the CV
  // spills onto a second page.
  if (photo) {
    content.push({
      svg: photoSvg(photo.dataUri, theme),
      absolutePosition: { x: PAGE_WIDTH - PAGE_MARGIN - PHOTO_SIZE, y: HEADER_HEIGHT - PHOTO_SIZE / 2 }
    });
  }

  content.push({
    margin: [40, sc(level, 26), 40, 0],
    columns: [sidebar, main],
    columnGap: COLUMN_GAP
  });

  return {
    pageSize: "A4",
    pageMargins: [0, 0, 0, 36],
    defaultStyle: { font: "Roboto", color: theme.ink },
    background: (currentPage, pageSize) => {
      const top = currentPage === 1 ? HEADER_HEIGHT : 0;
      return { canvas: [{ type: "rect", x: 0, y: top, w: SIDEBAR_PANEL_WIDTH, h: pageSize.height - top, color: theme.paperSoft }] };
    },
    content,
    footer: (currentPage, pageCount) => ({
      margin: [40, 8, 40, 0],
      columns: [
        { text: `${p.name} — ${t(l, "pdf.footerSuffix")}`, fontSize: 7.5, color: theme.greyLight },
        { text: `${currentPage} / ${pageCount}`, fontSize: 7.5, color: theme.greyLight, alignment: "right" }
      ]
    })
  };
}

module.exports = { buildCvDocDefinition };
