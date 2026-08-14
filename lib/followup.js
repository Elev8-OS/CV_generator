// Builds a "one-click" mailto: link for a polite follow-up nudge on an
// application that already went out but hasn't had a reply yet. Same
// mailto: constraints as lib/mailto.js apply (plain-text body only, no real
// attachments needed here anyway — a follow-up doesn't re-send documents).
function buildFollowUpMailto({ generated, profile, entry }) {
  const g = generated || {};
  const p = (profile && profile.personal) || {};
  const to = String(g.contactEmail || "").trim();
  const subject = `Nachfrage zu meiner Bewerbung als ${g.jobTitle || ""}${g.company ? " bei " + g.company : ""}`;
  const sentDate = entry && entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("de-CH") : "";

  const bodyLines = [
    "Sehr geehrte Damen und Herren,",
    "",
    `am ${sentDate || "kürzlich"} habe ich mich bei ${g.company || "Ihnen"} als ${g.jobTitle || "Mitarbeiter"} beworben. Da ich bisher noch keine Rückmeldung erhalten habe, wollte ich freundlich nachfragen, ob es inzwischen Neuigkeiten zum Stand meiner Bewerbung gibt.`,
    "",
    "Für Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung.",
    "",
    "Freundliche Grüsse",
    p.name || "",
    p.telefon || "",
    p.email || ""
  ];
  const body = bodyLines.join("\n");

  const qs = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return `mailto:${to}?${qs}`;
}

module.exports = { buildFollowUpMailto };
