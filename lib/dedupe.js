// Loose company-name matching for duplicate-application detection. The AI
// extracts company names from free-text job postings, so two applications to
// the same employer can come out as e.g. "Muster AG" vs "Muster" vs
// "muster ag" — a plain string-equals would miss those. Strip common legal
// suffixes and punctuation before comparing instead of requiring an exact match.
const LEGAL_SUFFIXES = new Set([
  "ag", "gmbh", "sa", "sarl", "sagl", "ltd", "limited", "inc", "kg", "kgaa",
  "se", "co", "company", "holding", "group", "ug", "llc", "plc"
]);

function normalizeCompany(name) {
  const words = String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !LEGAL_SUFFIXES.has(w));
  return words.join(" ").trim();
}

// Returns the most recent existing application at the same company, or null.
function findDuplicateApplication(applications, companyName) {
  const target = normalizeCompany(companyName);
  if (!target) return null;
  return applications.find((a) => normalizeCompany(a.company) === target) || null;
}

module.exports = { normalizeCompany, findDuplicateApplication };
