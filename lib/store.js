const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DEFAULT_STATUS } = require("./statuses");

// Persist under DATA_DIR (mount a Railway Volume at this path for durability
// across redeploys; falls back to a local folder otherwise). Each account's
// data lives in its own subfolder under DATA_DIR/users/<userId>/ — fully
// separate applications, profile and saved searches per person.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const USERS_DIR = path.join(DATA_DIR, "users");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function userDir(userId) {
  if (!userId) throw new Error("store.js: userId fehlt.");
  return path.join(USERS_DIR, userId);
}

function dbFile(userId) {
  return path.join(userDir(userId), "db.json");
}

function profileFile(userId) {
  return path.join(userDir(userId), "profile.json");
}

function searchesFile(userId) {
  return path.join(userDir(userId), "searches.json");
}

function readJson(file, fallback) {
  try {
    ensureDir(path.dirname(file));
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error("readJson failed for", file, err);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, file);
}

// ---- Applications DB (per user) ----

function loadDb(userId) {
  return readJson(dbFile(userId), { applications: [] });
}

function saveDb(userId, db) {
  writeJson(dbFile(userId), db);
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function shortId() {
  return crypto.randomBytes(3).toString("hex");
}

function createApplication(userId, record) {
  const db = loadDb(userId);
  const base = slugify(`${record.company || "bewerbung"}-${record.jobTitle || ""}`) || "bewerbung";
  const slug = `${base}-${shortId()}`;
  const entry = {
    slug,
    createdAt: new Date().toISOString(),
    status: DEFAULT_STATUS,
    statusUpdatedAt: null,
    note: "",
    publicDisabled: false,
    duplicateOfSlug: null,
    companyInsights: null,
    ...record
  };
  db.applications.unshift(entry);
  saveDb(userId, db);
  return entry;
}

function getApplication(userId, slug) {
  const db = loadDb(userId);
  return db.applications.find((a) => a.slug === slug) || null;
}

function listApplications(userId) {
  const db = loadDb(userId);
  return db.applications;
}

function deleteApplication(userId, slug) {
  const db = loadDb(userId);
  const before = db.applications.length;
  db.applications = db.applications.filter((a) => a.slug !== slug);
  saveDb(userId, db);
  return db.applications.length < before;
}

function updateApplicationStatus(userId, slug, status) {
  const db = loadDb(userId);
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.status = status;
  entry.statusUpdatedAt = new Date().toISOString();
  saveDb(userId, db);
  return entry;
}

function updateApplicationNote(userId, slug, note) {
  const db = loadDb(userId);
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.note = String(note || "").slice(0, 2000);
  saveDb(userId, db);
  return entry;
}

// Lets someone manually take their public digital application page (and its
// PDF downloads) offline once a process is finished — the URL and any PDFs
// already sent stay linked to real personal data (address, phone, photo)
// indefinitely otherwise, even long after the application is no longer live.
function setPublicDisabled(userId, slug, disabled) {
  const db = loadDb(userId);
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.publicDisabled = Boolean(disabled);
  saveDb(userId, db);
  return entry;
}

// Caches the auto-researched "Firmen-Insights" interview-prep briefing on the
// application itself, so opening the PDF later (or re-opening the dashboard)
// doesn't need to re-run the web search + AI calls every time — only the
// explicit "neu recherchieren" action overwrites it.
function saveCompanyInsights(userId, slug, insights) {
  const db = loadDb(userId);
  const entry = db.applications.find((a) => a.slug === slug);
  if (!entry) return null;
  entry.companyInsights = insights;
  saveDb(userId, db);
  return entry;
}

// ---- Cross-user lookup for public routes ----
// Public pages (/a/:slug, PDF downloads, the "Firmen-Insights" PDF, library
// documents) are reached by slug/id alone, with no user context in the URL —
// the browser hitting them is the employer, not a logged-in account. Slugs
// already carry a random hex suffix (see shortId above), so collisions across
// users are effectively impossible; at this tool's scale (a handful to a few
// dozen accounts) a linear scan across each user's own small db.json is cheap
// and avoids maintaining a separate slug→user index file.
function listUserIds() {
  ensureDir(USERS_DIR);
  return fs.readdirSync(USERS_DIR).filter((name) => fs.statSync(path.join(USERS_DIR, name)).isDirectory());
}

function findApplicationAnyUser(slug) {
  for (const userId of listUserIds()) {
    const entry = getApplication(userId, slug);
    if (entry) return { userId, entry };
  }
  return null;
}

// ---- Gespeicherte Job-Suchen (Schnellzugriff-Links auf Jobbörsen), per user ----
// Kein automatisches Nachladen/Scraping (Indeed hat RSS abgeschafft und
// blockt es inzwischen per robots.txt, jobs.ch/jobscout24.ch bieten keine
// öffentliche Such-Schnittstelle, LinkedIn-Scraping verstösst gegen deren
// Nutzungsbedingungen) — stattdessen einfach die eigenen, bereits gefilterten
// Suchlinks als Ein-Klick-Schnellzugriff im Dashboard.
function listSearches(userId) {
  return readJson(searchesFile(userId), []);
}

function addSearch(userId, { label, url }) {
  const searches = listSearches(userId);
  const entry = {
    id: shortId(),
    label: String(label || "").slice(0, 80),
    url: String(url || ""),
    createdAt: new Date().toISOString()
  };
  searches.push(entry);
  writeJson(searchesFile(userId), searches);
  return entry;
}

function deleteSearch(userId, id) {
  const searches = listSearches(userId);
  const before = searches.length;
  const next = searches.filter((s) => s.id !== id);
  writeJson(searchesFile(userId), next);
  return next.length < before;
}

// ---- Profile (per user; editable copy of a lib/profile.js template) ----

function loadProfile(userId, defaultProfile) {
  return readJson(profileFile(userId), defaultProfile);
}

function saveProfile(userId, profile) {
  writeJson(profileFile(userId), profile);
}

module.exports = {
  DATA_DIR,
  USERS_DIR,
  userDir,
  createApplication,
  getApplication,
  listApplications,
  deleteApplication,
  updateApplicationStatus,
  updateApplicationNote,
  setPublicDisabled,
  saveCompanyInsights,
  listUserIds,
  findApplicationAnyUser,
  listSearches,
  addSearch,
  deleteSearch,
  loadProfile,
  saveProfile,
  slugify
};
