const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DATA_DIR, userDir } = require("./store");
const { createUser, findUserByUsername } = require("./users");
const documentLibrary = require("./documentLibrary");
const { resolveDocumentPath } = require("./documents");

const MARKER_FILE = path.join(DATA_DIR, ".migrated-to-multiuser");

function copyFileIfExists(src, dest) {
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  return true;
}

function copyDirIfExists(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirIfExists(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * One-time migration from the old single-tenant flat layout
 * (DATA_DIR/db.json, DATA_DIR/profile.json, DATA_DIR/media/*, ...) into the
 * new per-account layout (DATA_DIR/users/<id>/...), run once at boot. Uses
 * COPY (never move/delete) so the original flat files stay in place as an
 * implicit backup regardless of how the migration goes — they're simply
 * unused dead weight afterwards, not deleted.
 *
 * Safe to call on every boot: it does nothing once MARKER_FILE exists, and
 * does nothing at all if there's no legacy data to migrate (e.g. a brand new
 * deployment that never ran the old single-tenant version).
 */
function migrateLegacyDataIfNeeded() {
  if (fs.existsSync(MARKER_FILE)) return;

  const legacyDbFile = path.join(DATA_DIR, "db.json");
  if (!fs.existsSync(legacyDbFile)) {
    // Nothing to migrate (fresh install) — mark done so we don't re-check every boot.
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(MARKER_FILE, new Date().toISOString());
    return;
  }

  console.log("Migration: alte Einzelbenutzer-Daten gefunden — lege Konto 'raffael' an und übernehme die Daten...");

  let user = findUserByUsername("raffael");
  if (!user) {
    const password = process.env.APP_PASSWORD || crypto.randomBytes(9).toString("base64url");
    user = createUser({ username: "raffael", password });
    if (!process.env.APP_PASSWORD) {
      console.warn(
        `Migration: kein APP_PASSWORD gesetzt — Konto 'raffael' wurde mit einem zufälligen Passwort angelegt: ${password}\n` +
          "Bitte dieses Passwort jetzt notieren (z.B. aus den Railway-Logs) und danach über /profile o.ä. ändern, falls gewünscht."
      );
    } else {
      console.log("Migration: Konto 'raffael' angelegt, Login-Passwort ist unverändert das bisherige APP_PASSWORD.");
    }
  }

  const newDir = userDir(user.id);
  copyFileIfExists(legacyDbFile, path.join(newDir, "db.json"));
  copyFileIfExists(path.join(DATA_DIR, "profile.json"), path.join(newDir, "profile.json"));
  copyFileIfExists(path.join(DATA_DIR, "searches.json"), path.join(newDir, "searches.json"));
  copyDirIfExists(path.join(DATA_DIR, "media"), path.join(newDir, "media"));
  copyDirIfExists(path.join(DATA_DIR, "documents", "library"), path.join(newDir, "documents", "library"));

  // The old app had two *fixed* document slots (Lehrzeugnis/EFZ) served from
  // DATA_DIR/documents/{lehrzeugnis,efz}.pdf, falling back to bundled defaults
  // if never uploaded (see lib/documents.js + lib/assets.js). The new,
  // multi-user version has no such fixed slots — every account just uses the
  // general document library — so fold whichever version was actually being
  // served (an uploaded copy, or else the bundled default) into Raffael's
  // library as two regular entries, matching what his public page was
  // actually showing before this migration.
  const lehrzeugnisPath = resolveDocumentPath("lehrzeugnis");
  if (lehrzeugnisPath) {
    documentLibrary.addLibraryDocument(user.id, {
      buffer: fs.readFileSync(lehrzeugnisPath),
      mimetype: "application/pdf",
      originalName: "Lehrzeugnis_R_Nussbaum_AG.pdf",
      category: "zeugnis",
      title: "Lehrzeugnis R. Nussbaum AG",
      skillsText: "Lehrzeugnis der Berufslehre Polymechaniker EFZ bei R. Nussbaum AG, ausgestellt 17.06.2025."
    });
  }
  const efzPath = resolveDocumentPath("efz");
  if (efzPath) {
    documentLibrary.addLibraryDocument(user.id, {
      buffer: fs.readFileSync(efzPath),
      mimetype: "application/pdf",
      originalName: "Faehigkeitszeugnis_EFZ_Polymechaniker.pdf",
      category: "diplom",
      title: "Fähigkeitszeugnis EFZ Polymechaniker",
      skillsText: "Offizielles eidgenössisches Fähigkeitszeugnis Polymechaniker, Kanton Solothurn, ausgestellt 31.07.2025."
    });
  }

  fs.writeFileSync(MARKER_FILE, new Date().toISOString());
  console.log(`Migration abgeschlossen: bestehende Daten sind jetzt unter dem Konto 'raffael' (Benutzer-ID ${user.id}).`);
}

module.exports = { migrateLegacyDataIfNeeded };
