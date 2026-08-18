const { t, normalizeLang } = require("./i18n");

// Builds a "one-click send" mailto: link for a generated application — pre-filled
// with recipient (if the AI found one in the posting), subject, the email body,
// and a set of direct links to the CV/cover-letter PDFs and the digital
// application page (since mailto: links can NOT carry real file attachments —
// that's a universal browser/OS limitation, not something this tool can work
// around — links are the practical substitute). `lang` follows the
// application's own language (entry.language), not the viewing account's UI
// language — this boilerplate is part of what gets sent to the employer.
function buildApplicationMailto({ generated, baseUrl, slug, lang = "de" }) {
  const l = normalizeLang(lang);
  const g = generated || {};
  const to = String(g.contactEmail || "").trim();
  const subject = g.emailSubject || t(l, "mail.defaultSubject", { jobTitle: g.jobTitle || "" });

  const links = [];
  if (baseUrl && slug) {
    links.push(t(l, "mail.cvLine", { url: `${baseUrl}/pdf/${slug}/cv` }));
    links.push(t(l, "mail.coverLine", { url: `${baseUrl}/pdf/${slug}/cover` }));
    links.push(t(l, "mail.appPageLine", { url: `${baseUrl}/a/${slug}` }));
  }

  const body =
    (g.emailBody || "") +
    (links.length ? `\n\n---\n${t(l, "mail.downloadsHeader")}\n${links.join("\n")}` : "");

  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // The "to" part of a mailto: URI is not itself URL-encoded (it's not a query
  // param) — plain email addresses never contain characters that need escaping there.
  return `mailto:${to}?${qs}`;
}

module.exports = { buildApplicationMailto };
