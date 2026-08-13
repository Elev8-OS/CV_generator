/**
 * Bewerbungsstatus-Pipeline. Einzige Quelle der Wahrheit für Status-Keys,
 * Labels und Farben — wird von der Index-Seite (Dropdown + Filter) und vom
 * Server (Validierung) gemeinsam genutzt.
 */
const STATUSES = [
  { key: "entwurf", label: "Entwurf", color: "#9aa1ad" },
  { key: "gesendet", label: "Gesendet", color: "#3b82f6" },
  { key: "follow_up", label: "Follow-up gemacht", color: "#8b5cf6" },
  { key: "interview", label: "Eingeladen zum Vorstellungsgespräch", color: "#e2572b" },
  { key: "in_auswahl", label: "In der engeren Auswahl", color: "#d97706" },
  { key: "zusage", label: "Zusage", color: "#16a34a" },
  { key: "absage", label: "Absage", color: "#6b7280" }
];

const STATUS_BY_KEY = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const DEFAULT_STATUS = "entwurf";

function isValidStatus(key) {
  return Object.prototype.hasOwnProperty.call(STATUS_BY_KEY, key);
}

module.exports = { STATUSES, STATUS_BY_KEY, DEFAULT_STATUS, isValidStatus };
