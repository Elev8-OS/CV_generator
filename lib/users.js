const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { DATA_DIR } = require("./store");
const { t, DEFAULT_LANG } = require("./i18n");

// Simple JSON-file user store — consistent with the rest of this app's
// "just files on the persistent volume" approach (see lib/store.js). Fine at
// the scale this tool runs at (a self-hosted tool for a handful to a few
// dozen people, not a multi-tenant SaaS with thousands of accounts).
const USERS_FILE = path.join(DATA_DIR, "users.json");

const USERNAME_RE = /^[a-z0-9][a-z0-9_.-]{1,29}$/;

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers() {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("users.js: konnte users.json nicht lesen:", err);
    return [];
  }
}

function writeUsers(list) {
  ensureDir();
  const tmp = USERS_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, USERS_FILE);
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...pub } = user;
  return pub;
}

function findUserByUsername(username) {
  const norm = normalizeUsername(username);
  return readUsers().find((u) => u.usernameNormalized === norm) || null;
}

function findUserById(id) {
  return readUsers().find((u) => u.id === id) || null;
}

function validateNewUsername(username, lang = DEFAULT_LANG) {
  const norm = normalizeUsername(username);
  if (!USERNAME_RE.test(norm)) {
    return t(lang, "auth.usernameInvalid");
  }
  if (findUserByUsername(norm)) {
    return t(lang, "auth.usernameTaken");
  }
  return null;
}

/**
 * Creates a new account. `id` can be forced (used once, by the migration
 * step, so Raffael's existing per-user directory can be created with a
 * predictable id before this function is ever called normally). `lang`
 * only affects the language of validation-error messages thrown here.
 */
function createUser({ username, password, id, lang = DEFAULT_LANG }) {
  const usernameError = validateNewUsername(username, lang);
  if (usernameError) throw new Error(usernameError);
  if (!password || String(password).length < 8) {
    throw new Error(t(lang, "auth.passwordTooShort"));
  }
  const users = readUsers();
  const user = {
    id: id || crypto.randomBytes(9).toString("hex"),
    username: String(username).trim(),
    usernameNormalized: normalizeUsername(username),
    passwordHash: bcrypt.hashSync(String(password), 10),
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);
  return toPublicUser(user);
}

function verifyPassword(user, password) {
  if (!user || !user.passwordHash) return false;
  return bcrypt.compareSync(String(password || ""), user.passwordHash);
}

function listUsers() {
  return readUsers().map(toPublicUser);
}

module.exports = {
  createUser,
  findUserByUsername,
  findUserById,
  verifyPassword,
  validateNewUsername,
  normalizeUsername,
  listUsers,
  toPublicUser
};
