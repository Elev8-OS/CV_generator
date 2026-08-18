const { resolveTheme } = require("./theme");
const { t, normalizeLang, localeFor } = require("../i18n");

const PAGE_WIDTH = 595.28;
const MARGINS = [48, 56, 48, 48];

/**
 * "Firmen-Insights" interview-prep briefing — private-only PDF (never linked
 * from the public /a/:slug page). Content comes from lib/companyInsights.js,
 * which is required to base every fact on an actual web search rather than
 * the model's memory, so this stays a rendering step with no new claims.
 * `lang` follows the application's own language (entry.language), matching
 * the language the insights were researched/written in.
 */
function buildInsightsDocDefinition(entry, lang = "de", accentColor) {
  const l = normalizeLang(lang);
  const theme = resolveTheme(accentColor);
  const g = entry.generated || {};
  const insights = entry.companyInsights || {};
  const company = g.company || entry.company || t(l, "pdf.unknownCompany");
  const jobTitle = g.jobTitle || entry.jobTitle || "";
  const generatedDate = insights.generatedAt
    ? new Date(insights.generatedAt).toLocaleDateString(localeFor(l), { day: "2-digit", month: "long", year: "numeric" })
    : "";

  function section(title, body) {
    const isList = Array.isArray(body);
    const empty = isList ? !body.length : !body;
    return [
      { text: title, bold: true, fontSize: 12.5, color: theme.accent, margin: [0, 16, 0, 6] },
      empty
        ? { text: t(l, "pdf.insightsNoData"), italics: true, color: theme.greyLight, fontSize: 10 }
        : isList
        ? { ul: body.map((item) => ({ text: item, margin: [0, 1, 0, 1] })), margin: [0, 0, 0, 0] }
        : { text: body, margin: [0, 0, 0, 0] }
    ];
  }

  return {
    pageSize: "A4",
    pageMargins: MARGINS,
    defaultStyle: { font: "Roboto", fontSize: 10.3, color: theme.ink, lineHeight: 1.35 },
    content: [
      { text: t(l, "pdf.insightsTitle"), fontSize: 18, bold: true, color: theme.ink },
      { text: t(l, "pdf.insightsSubtitle", { company, jobTitle }), fontSize: 11, color: theme.grey, margin: [0, 3, 0, 0] },
      generatedDate
        ? {
            text: t(l, "pdf.insightsGeneratedNote", { date: generatedDate }),
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
      ...section(t(l, "pdf.insightsOverview"), insights.companyOverview),
      ...section(t(l, "pdf.insightsProducts"), insights.productsServices),
      ...section(t(l, "pdf.insightsNews"), insights.recentNews),
      ...section(t(l, "pdf.insightsTopics"), insights.likelyTopics),
      ...section(t(l, "pdf.insightsQuestions"), insights.suggestedQuestions),
      ...(insights.sources && insights.sources.length
        ? [
            { text: t(l, "pdf.insightsSources"), bold: true, fontSize: 12.5, color: theme.accent, margin: [0, 16, 0, 6] },
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
