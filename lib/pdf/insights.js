const theme = require("./theme");

const PAGE_WIDTH = 595.28;
const MARGINS = [48, 56, 48, 48];

/**
 * "Firmen-Insights" interview-prep briefing — private-only PDF (never linked
 * from the public /a/:slug page). Content comes from lib/companyInsights.js,
 * which is required to base every fact on an actual web search rather than
 * the model's memory, so this stays a rendering step with no new claims.
 */
function buildInsightsDocDefinition(entry) {
  const g = entry.generated || {};
  const insights = entry.companyInsights || {};
  const company = g.company || entry.company || "Firma";
  const jobTitle = g.jobTitle || entry.jobTitle || "";
  const generatedDate = insights.generatedAt
    ? new Date(insights.generatedAt).toLocaleDateString("de-CH", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  function section(title, body) {
    const isList = Array.isArray(body);
    const empty = isList ? !body.length : !body;
    return [
      { text: title, bold: true, fontSize: 12.5, color: theme.accent, margin: [0, 16, 0, 6] },
      empty
        ? { text: "Keine Angaben gefunden.", italics: true, color: theme.greyLight, fontSize: 10 }
        : isList
        ? { ul: body.map((t) => ({ text: t, margin: [0, 1, 0, 1] })), margin: [0, 0, 0, 0] }
        : { text: body, margin: [0, 0, 0, 0] }
    ];
  }

  return {
    pageSize: "A4",
    pageMargins: MARGINS,
    defaultStyle: { font: "Roboto", fontSize: 10.3, color: theme.ink, lineHeight: 1.35 },
    content: [
      { text: "🏢 Firmen-Insights", fontSize: 18, bold: true, color: theme.ink },
      { text: `${company} — Vorbereitung auf: ${jobTitle}`, fontSize: 11, color: theme.grey, margin: [0, 3, 0, 0] },
      generatedDate
        ? {
            text: `Automatisch recherchiert am ${generatedDate} — bitte Angaben vor dem Gespräch selbst gegenprüfen, insbesondere bei wenig bekannten Firmen.`,
            fontSize: 8.3,
            italics: true,
            color: theme.greyLight,
            margin: [0, 5, 0, 0]
          }
        : null,
      {
        canvas: [{ type: "line", x1: 0, y1: 0, x2: PAGE_WIDTH - MARGINS[0] - MARGINS[2], y2: 0, lineWidth: 0.75, lineColor: theme.border }],
        margin: [0, 10, 0, 0]
      },
      ...section("Firmenüberblick", insights.companyOverview),
      ...section("Produkte & Dienstleistungen", insights.productsServices),
      ...section("Aktuelle News", insights.recentNews),
      ...section("Mögliche Gesprächsthemen", insights.likelyTopics),
      ...section("Fragen, die du stellen könntest", insights.suggestedQuestions),
      ...(insights.sources && insights.sources.length
        ? [
            { text: "Quellen", bold: true, fontSize: 12.5, color: theme.accent, margin: [0, 16, 0, 6] },
            ...insights.sources.map((s) => ({
              text: s.title || s.url,
              link: s.url,
              color: theme.accent,
              fontSize: 9,
              margin: [0, 0, 0, 3]
            }))
          ]
        : [])
    ].filter(Boolean)
  };
}

module.exports = { buildInsightsDocDefinition };
