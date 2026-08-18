const { t, normalizeLang, localeFor } = require("./i18n");

// Builds a "one-click" mailto: link for a polite follow-up nudge on an
// application that already went out but hasn't had a reply yet. Same
// mailto: constraints as lib/mailto.js apply (plain-text body only, no real
// attachments needed here anyway — a follow-up doesn't re-send documents).
// `lang` follows the application's own language (entry.language) — a
// follow-up to a French application should stay in French.
function buildFollowUpMailto({ generated, profile, entry, lang = "de" }) {
  const l = normalizeLang(lang);
  const g = generated || {};
  const p = (profile && profile.personal) || {};
  const to = String(g.contactEmail || "").trim();
  const subject = t(l, "mail.followupSubject", {
    jobTitle: g.jobTitle || "",
    atCompany: g.company ? t(l, "mail.followupAtCompany", { company: g.company }) : ""
  });
  const sentDate = entry && entry.createdAt ? new Date(entry.createdAt).toLocaleDateString(localeFor(l)) : "";

  const bodyLines = [
    t(l, "mail.followupGreeting"),
    "",
    t(l, "mail.followupBody", {
      date: sentDate || t(l, "mail.followupDateFallback"),
      company: g.company || t(l, "mail.followupDefaultCompany"),
      jobTitle: g.jobTitle || t(l, "mail.followupDefaultRole")
    }),
    "",
    t(l, "mail.followupClosing"),
    "",
    t(l, "mail.followupSign"),
    p.name || "",
    p.telefon || "",
    p.email || ""
  ];
  const body = bodyLines.join("\n");

  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${to}?${qs}`;
}

module.exports = { buildFollowUpMailto };
