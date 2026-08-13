// Builds a "one-click send" mailto: link for a generated application — pre-filled
// with recipient (if the AI found one in the posting), subject, the email body,
// and a set of direct links to the CV/cover-letter PDFs and the digital
// application page (since mailto: links can NOT carry real file attachments —
// that's a universal browser/OS limitation, not something this tool can work
// around — links are the practical substitute).
function buildApplicationMailto({ generated, baseUrl, slug }) {
  const g = generated || {};
  const to = String(g.contactEmail || "").trim();
  const subject = g.emailSubject || `Bewerbung als ${g.jobTitle || ""}`;

  const links = [];
  if (baseUrl && slug) {
    links.push(`Lebenslauf (PDF): ${baseUrl}/pdf/${slug}/cv`);
    links.push(`Motivationsschreiben (PDF): ${baseUrl}/pdf/${slug}/cover`);
    links.push(`Digitale Bewerbungsseite: ${baseUrl}/a/${slug}`);
  }

  const body =
    (g.emailBody || "") +
    (links.length ? `\n\n---\nUnterlagen zum Download:\n${links.join("\n")}` : "");

  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  // The "to" part of a mailto: URI is not itself URL-encoded (it's not a query
  // param) — plain email addresses never contain characters that need escaping there.
  return `mailto:${to}?${qs}`;
}

module.exports = { buildApplicationMailto };
