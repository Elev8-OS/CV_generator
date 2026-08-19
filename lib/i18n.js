// Central translation dictionary + tiny lookup helper, covering the tool's
// UI chrome (buttons, labels, section titles) AND the static/chrome parts of
// generated documents (PDF section headers, digital-page labels, mailto/eml
// boilerplate). Actual AI-authored prose (summary, cover letter body, etc.)
// is generated directly in the target language by lib/ai.js — this file
// never translates that, only the surrounding scaffolding.
//
// Two independent language choices exist in this app:
//  - UI language: which language the account owner sees the dashboard/profile
//    pages in. Stored in a plain (unsigned) "lang" cookie, not tied to the
//    account, so it also works pre-login on /login and /signup.
//  - Application language: chosen once per application when it's generated
//    (server.js stores it as entry.language) — used for that application's
//    CV/cover letter/eml/digital page/company-insights, independent of
//    whatever the viewing account's current UI language happens to be. An
//    employer opening a French application should see it in French even if
//    the account owner's own dashboard is set to German.

const LANGS = ["de", "fr", "en"];
const DEFAULT_LANG = "de";
const LANG_COOKIE = "lang";

const LANG_NAMES = {
  de: { de: "Deutsch", fr: "Allemand", en: "German", native: "Deutsch" },
  fr: { de: "Französisch", fr: "Français", en: "French", native: "Français" },
  en: { de: "Englisch", fr: "Anglais", en: "English", native: "English" }
};

// Used both for toLocaleDateString(...) calls and pdfmake date formatting.
const LOCALE_BY_LANG = { de: "de-CH", fr: "fr-CH", en: "en-GB" };

function isValidLang(code) {
  return LANGS.includes(code);
}

function normalizeLang(code) {
  return isValidLang(code) ? code : DEFAULT_LANG;
}

function localeFor(lang) {
  return LOCALE_BY_LANG[normalizeLang(lang)] || LOCALE_BY_LANG[DEFAULT_LANG];
}

const DICT = {
  common: {
    appName: { de: "Bewerbungs-Generator", fr: "Générateur de candidatures", en: "Application Generator" },
    toolLink: { de: "← Zurück zum Tool", fr: "← Retour à l'outil", en: "← Back to the tool" },
    logout: { de: "Logout", fr: "Déconnexion", en: "Log out" },
    loggedInAs: { de: "Eingeloggt als {{username}}", fr: "Connecté en tant que {{username}}", en: "Logged in as {{username}}" },
    save: { de: "Speichern", fr: "Enregistrer", en: "Save" },
    delete: { de: "Löschen", fr: "Supprimer", en: "Delete" },
    view: { de: "Ansehen", fr: "Voir", en: "View" },
    upload: { de: "Hochladen", fr: "Téléverser", en: "Upload" },
    errorPrefix: { de: "Fehler: ", fr: "Erreur : ", en: "Error: " }
  },

  login: {
    title: { de: "Login — Bewerbungs-Generator", fr: "Connexion — Générateur de candidatures", en: "Login — Application Generator" },
    subtitle: { de: "Bitte einloggen, um fortzufahren.", fr: "Merci de te connecter pour continuer.", en: "Please log in to continue." },
    username: { de: "Benutzername", fr: "Nom d'utilisateur", en: "Username" },
    password: { de: "Passwort", fr: "Mot de passe", en: "Password" },
    submit: { de: "Einloggen", fr: "Se connecter", en: "Log in" },
    noAccount: { de: "Noch kein Konto?", fr: "Pas encore de compte ?", en: "No account yet?" },
    signupLink: { de: "Registrieren", fr: "S'inscrire", en: "Sign up" },
    errorGeneric: { de: "Login fehlgeschlagen.", fr: "Échec de la connexion.", en: "Login failed." }
  },

  signup: {
    title: { de: "Registrieren — Bewerbungs-Generator", fr: "Inscription — Générateur de candidatures", en: "Sign up — Application Generator" },
    subtitle: {
      de: "Neues Konto anlegen — dein eigenes Profil, deine eigenen Bewerbungen.",
      fr: "Créer un nouveau compte — ton propre profil, tes propres candidatures.",
      en: "Create a new account — your own profile, your own applications."
    },
    username: { de: "Benutzername", fr: "Nom d'utilisateur", en: "Username" },
    usernameHint: {
      de: "2-30 Zeichen, Kleinbuchstaben/Zahlen/._- , muss mit Buchstabe oder Zahl beginnen.",
      fr: "2 à 30 caractères, minuscules/chiffres/._- , doit commencer par une lettre ou un chiffre.",
      en: "2-30 characters, lowercase letters/digits/._- , must start with a letter or digit."
    },
    password: { de: "Passwort", fr: "Mot de passe", en: "Password" },
    passwordHint: { de: "Mindestens 8 Zeichen.", fr: "Au moins 8 caractères.", en: "At least 8 characters." },
    passwordConfirm: { de: "Passwort wiederholen", fr: "Répéter le mot de passe", en: "Confirm password" },
    submit: { de: "Konto erstellen", fr: "Créer le compte", en: "Create account" },
    haveAccount: { de: "Schon ein Konto?", fr: "Déjà un compte ?", en: "Already have an account?" },
    loginLink: { de: "Einloggen", fr: "Se connecter", en: "Log in" },
    errorMismatch: {
      de: "Die Passwörter stimmen nicht überein.",
      fr: "Les mots de passe ne correspondent pas.",
      en: "The passwords do not match."
    },
    errorGeneric: { de: "Registrierung fehlgeschlagen.", fr: "Échec de l'inscription.", en: "Sign-up failed." }
  },

  cvImport: {
    title: { de: "CV importieren — Bewerbungs-Generator", fr: "Importer le CV — Générateur de candidatures", en: "Import CV — Application Generator" },
    heading: { de: "Lebenslauf importieren", fr: "Importer ton CV", en: "Import your CV" },
    subtitle: {
      de: "Lade deinen bestehenden CV hoch — wir lesen automatisch Name, Kontaktdaten, Ausbildung und Erfahrung aus und füllen dein Profil damit vor. Du kannst danach alles im Profil prüfen und anpassen.",
      fr: "Téléverse ton CV existant — nous en extrayons automatiquement le nom, les coordonnées, la formation et l'expérience pour pré-remplir ton profil. Tu pourras tout vérifier et ajuster ensuite dans ton profil.",
      en: "Upload your existing CV — we'll automatically read your name, contact details, education and experience to pre-fill your profile. You can review and adjust everything afterwards on the profile page."
    },
    fileLabel: { de: "CV-Datei (PDF oder Word)", fr: "Fichier CV (PDF ou Word)", en: "CV file (PDF or Word)" },
    orPaste: { de: "oder Text einfügen", fr: "ou coller le texte", en: "or paste the text" },
    pasteLabel: { de: "CV-Text", fr: "Texte du CV", en: "CV text" },
    pastePlaceholder: { de: "Lebenslauf-Text hier einfügen…", fr: "Colle ici le texte de ton CV…", en: "Paste your CV text here…" },
    analyzeBtn: { de: "Analysieren & importieren", fr: "Analyser & importer", en: "Analyze & import" },
    skipLink: { de: "Später — leeres Profil verwenden", fr: "Plus tard — utiliser un profil vide", en: "Later — start with an empty profile" },
    statusAnalyzing: {
      de: "Analysiere CV … (kann 15–30 Sekunden dauern)",
      fr: "Analyse du CV … (peut prendre 15 à 30 secondes)",
      en: "Analyzing CV … (can take 15–30 seconds)"
    },
    statusDone: { de: "Importiert — du wirst weitergeleitet …", fr: "Importé — redirection en cours …", en: "Imported — redirecting …" },
    errorNoInput: {
      de: "Bitte eine Datei hochladen oder Text einfügen.",
      fr: "Merci de téléverser un fichier ou de coller du texte.",
      en: "Please upload a file or paste some text."
    },
    errorGeneric: { de: "CV konnte nicht analysiert werden.", fr: "Le CV n'a pas pu être analysé.", en: "The CV could not be analyzed." },
    hintPrivacy: {
      de: "Diese Daten bleiben privat in deinem Konto und werden nur für deine eigenen Bewerbungen verwendet.",
      fr: "Ces données restent privées dans ton compte et ne sont utilisées que pour tes propres candidatures.",
      en: "This data stays private to your account and is only used for your own applications."
    },
    issuesHeading: {
      de: "Unstimmigkeiten im Lebenslauf",
      fr: "Incohérences dans le CV",
      en: "Inconsistencies in your CV"
    },
    issuesSubtitle: {
      de: "Ein paar Punkte in deinem Lebenslauf könnten Rückfragen auslösen. Du kannst sie kurz erklären — das hilft, sie später glaubwürdig in Bewerbungen einzubauen. Leer lassen = überspringen.",
      fr: "Quelques points de ton CV pourraient susciter des questions. Tu peux les expliquer brièvement — cela aide à les intégrer plus tard de façon crédible dans tes candidatures. Laisser vide = ignorer.",
      en: "A few points in your CV might raise questions. You can briefly explain them — this helps weave them credibly into applications later. Leave blank to skip."
    },
    issueTypeGap: { de: "Lücke im Werdegang", fr: "Trou dans le parcours", en: "Gap in timeline" },
    issueTypeMissing: { de: "Fehlende Angabe", fr: "Information manquante", en: "Missing detail" },
    issueTypeContradiction: { de: "Widerspruch", fr: "Contradiction", en: "Contradiction" },
    explanationPlaceholder: {
      de: "Optional: kurze Erklärung (z.B. Reise, Weiterbildung, persönliche Gründe)…",
      fr: "Facultatif : brève explication (p. ex. voyage, formation, raisons personnelles)…",
      en: "Optional: short explanation (e.g. travel, further education, personal reasons)…"
    },
    continueBtn: { de: "Weiter", fr: "Continuer", en: "Continue" },
    skipAllBtn: { de: "Alle überspringen", fr: "Tout ignorer", en: "Skip all" },
    savingClarifications: { de: "Speichere …", fr: "Enregistrement …", en: "Saving …" }
  },

  profile: {
    title: { de: "Profil-Daten — Bewerbungs-Generator", fr: "Données de profil — Générateur de candidatures", en: "Profile data — Application Generator" },
    headerTagline: {
      de: "Verwalte dein Profil, deine Erfahrung, Dokumente und Kontoeinstellungen.",
      fr: "Gère ton profil, ton expérience, tes documents et les paramètres de ton compte.",
      en: "Manage your profile, experience, documents, and account settings."
    },
    tabProfile: { de: "Profil", fr: "Profil", en: "Profile" },
    tabExperience: { de: "Erfahrung", fr: "Expérience", en: "Experience" },
    tabDocuments: { de: "Dokumente", fr: "Documents", en: "Documents" },
    tabAccount: { de: "Konto", fr: "Compte", en: "Account" },
    tabAdvanced: { de: "Erweitert", fr: "Avancé", en: "Advanced" },
    portraitTitle: { de: "Portrait & Unterschrift", fr: "Portrait & signature", en: "Portrait & signature" },
    portraitSubtitle: {
      de: "Das Portrait erscheint im CV-Kopf und auf der digitalen Bewerbungsseite, die Unterschrift im Motivationsschreiben. Beides optional — ohne sie funktioniert alles weiterhin, nur ohne diesen persönlichen Touch.",
      fr: "Le portrait apparaît en en-tête du CV et sur la page de candidature numérique, la signature dans la lettre de motivation. Les deux sont facultatifs — tout fonctionne aussi sans, juste sans cette touche personnelle.",
      en: "The portrait appears in the CV header and on the digital application page, the signature in the cover letter. Both are optional — everything still works without them, just without that personal touch."
    },
    photoLabel: { de: "Portraitfoto", fr: "Photo de portrait", en: "Portrait photo" },
    photoHint: {
      de: "Freigestellt, neutraler Hintergrund, Hochformat",
      fr: "Détouré, fond neutre, format portrait",
      en: "Cut out, neutral background, portrait orientation"
    },
    signatureLabel: { de: "Unterschrift", fr: "Signature", en: "Signature" },
    signatureHint: {
      de: "Foto/Scan auf hellem Grund — Hintergrund wird automatisch entfernt",
      fr: "Photo/scan sur fond clair — l'arrière-plan est supprimé automatiquement",
      en: "Photo/scan on a light background — the background is removed automatically"
    },
    missing: { de: "Fehlt", fr: "Manquant", en: "Missing" },
    uploaded: { de: "Hochgeladen", fr: "Téléversé", en: "Uploaded" },
    contactLinksTitle: { de: "Kontakt & Links", fr: "Contact & liens", en: "Contact & links" },
    contactLinksSubtitle: {
      de: "Diese Angaben erscheinen auf deiner digitalen Bewerbungsseite und im CV.",
      fr: "Ces informations apparaissent sur ta page de candidature numérique et dans le CV.",
      en: "These details appear on your digital application page and in your CV."
    },
    fieldName: { de: "Name", fr: "Nom", en: "Name" },
    fieldEmail: { de: "E-Mail", fr: "E-mail", en: "Email" },
    fieldPhone: { de: "Telefon", fr: "Téléphone", en: "Phone" },
    fieldStreet: { de: "Strasse", fr: "Rue", en: "Street" },
    fieldZip: { de: "PLZ", fr: "NPA", en: "ZIP" },
    fieldCity: { de: "Ort", fr: "Localité", en: "City" },
    fieldLinkedin: { de: "LinkedIn (optional)", fr: "LinkedIn (facultatif)", en: "LinkedIn (optional)" },
    otherLinksTitle: { de: "Weitere Links", fr: "Autres liens", en: "Other links" },
    otherLinksHint: {
      de: "z.B. Portfolio, GitHub, persönliche Website",
      fr: "p. ex. portfolio, GitHub, site personnel",
      en: "e.g. portfolio, GitHub, personal website"
    },
    linkLabelPlaceholder: { de: "Bezeichnung (z.B. Portfolio)", fr: "Libellé (p. ex. Portfolio)", en: "Label (e.g. Portfolio)" },
    linkUrlPlaceholder: { de: "https://…", fr: "https://…", en: "https://…" },
    addLink: { de: "+ Link hinzufügen", fr: "+ Ajouter un lien", en: "+ Add link" },
    removeLink: { de: "Entfernen", fr: "Supprimer", en: "Remove" },
    experienceTitle: { de: "Berufserfahrung", fr: "Expérience professionnelle", en: "Work experience" },
    experienceSubtitle: {
      de: "Diese Positionen erscheinen im CV und auf der digitalen Bewerbungsseite. Du kannst sie hier direkt bearbeiten — ohne die Rohdaten anzufassen.",
      fr: "Ces postes apparaissent dans le CV et sur la page de candidature numérique. Tu peux les modifier directement ici — sans toucher aux données brutes.",
      en: "These positions appear in the CV and on the digital application page. You can edit them directly here — without touching the raw data."
    },
    experienceOrgLabel: { de: "Firma / Organisation", fr: "Entreprise / organisation", en: "Company / organization" },
    experienceRoleLabel: { de: "Position", fr: "Poste", en: "Role" },
    experiencePeriodLabel: { de: "Zeitraum", fr: "Période", en: "Period" },
    experienceLocationLabel: { de: "Ort", fr: "Lieu", en: "Location" },
    experienceOngoingLabel: { de: "Aktuell noch tätig", fr: "Poste actuel", en: "Currently ongoing" },
    experienceBulletsLabel: { de: "Tätigkeiten (eine pro Zeile)", fr: "Activités (une par ligne)", en: "Responsibilities (one per line)" },
    experienceBulletsHint: {
      de: "Jede Zeile wird als eigener Aufzählungspunkt im CV verwendet.",
      fr: "Chaque ligne devient une puce distincte dans le CV.",
      en: "Each line becomes its own bullet point in the CV."
    },
    experienceAddBtn: { de: "+ Position hinzufügen", fr: "+ Ajouter un poste", en: "+ Add position" },
    experienceRemoveBtn: { de: "Position entfernen", fr: "Supprimer le poste", en: "Remove position" },
    experienceNoEntries: { de: "Noch keine Positionen erfasst.", fr: "Aucun poste enregistré pour l'instant.", en: "No positions recorded yet." },
    experienceSupplementTitle: { de: "Ergänzendes CV hochladen", fr: "Téléverser un CV complémentaire", en: "Upload a supplementary CV" },
    experienceSupplementSubtitle: {
      de: "Ist dein importierter CV nicht mehr aktuell? Lade ein zusätzliches Dokument hoch (z.B. mit einer neuen Stelle) — gefundene Positionen werden unten ergänzt, nichts wird überschrieben.",
      fr: "Ton CV importé n'est plus à jour ? Téléverse un document supplémentaire (p. ex. avec un nouveau poste) — les postes trouvés seront ajoutés ci-dessous, rien n'est écrasé.",
      en: "Is your imported CV out of date? Upload an additional document (e.g. with a new role) — any positions found will be added below, nothing gets overwritten."
    },
    experienceSupplementBtn: { de: "Datei wählen & analysieren", fr: "Choisir un fichier & analyser", en: "Choose file & analyze" },
    experienceSupplementStatusAnalyzing: { de: "Analysiere Dokument …", fr: "Analyse du document …", en: "Analyzing document …" },
    experienceSupplementDone: { de: "{{n}} neue Position(en) hinzugefügt.", fr: "{{n}} nouveau(x) poste(s) ajouté(s).", en: "{{n}} new position(s) added." },
    experienceSupplementDoneWithSkipped: {
      de: "{{n}} neue Position(en) hinzugefügt — {{s}} bereits vorhandene Position(en) erkannt und übersprungen.",
      fr: "{{n}} nouveau(x) poste(s) ajouté(s) — {{s}} poste(s) déjà existant(s) reconnu(s) et ignoré(s).",
      en: "{{n}} new position(s) added — {{s}} already-known position(s) recognized and skipped."
    },
    experienceSupplementNoNew: {
      de: "Keine neuen Positionen gefunden — alle erkannten Einträge sind bereits in deinem Profil vorhanden.",
      fr: "Aucun nouveau poste trouvé — toutes les entrées reconnues figurent déjà dans ton profil.",
      en: "No new positions found — every recognized entry is already in your profile."
    },
    experienceSupplementNothingDetected: {
      de: "Es konnten keine Positionen aus dem Dokument gelesen werden. Bitte Format prüfen oder den Text direkt einfügen.",
      fr: "Aucun poste n'a pu être lu dans le document. Merci de vérifier le format ou de coller le texte directement.",
      en: "No positions could be read from the document. Please check the format or paste the text directly."
    },
    experienceSupplementError: { de: "Dokument konnte nicht analysiert werden.", fr: "Le document n'a pas pu être analysé.", en: "The document could not be analyzed." },
    importedBanner: {
      de: "CV importiert — bitte die Rohdaten unten prüfen und bei Bedarf anpassen.",
      fr: "CV importé — merci de vérifier les données ci-dessous et de les ajuster si nécessaire.",
      en: "CV imported — please review the raw data below and adjust it if needed."
    },
    importCvBtn: { de: "CV importieren", fr: "Importer un CV", en: "Import CV" },
    importCvConfirm: {
      de: "Ein neuer CV-Import überschreibt die aktuellen Rohdaten unten (nach Prüfung). Fortfahren?",
      fr: "Un nouvel import de CV remplacera les données actuelles ci-dessous (après vérification). Continuer ?",
      en: "A new CV import will overwrite the current raw data below (after review). Continue?"
    },
    otherDocsTitle: { de: "Weitere Dokumente", fr: "Autres documents", en: "Other documents" },
    otherDocsSubtitle: {
      de: "Zusätzliche Zertifikate, Diplome, Referenzschreiben oder sonstige Nachweise. Sie erscheinen automatisch auf jeder digitalen Bewerbungsseite zum Download — und die kurze Beschreibung hilft der KI, relevante Fähigkeiten daraus in neue Bewerbungen einzubauen, wo passend.",
      fr: "Certificats, diplômes, lettres de référence ou autres justificatifs supplémentaires. Ils apparaissent automatiquement en téléchargement sur chaque page de candidature numérique — et la courte description aide l'IA à intégrer les compétences pertinentes dans les nouvelles candidatures, là où c'est pertinent.",
      en: "Additional certificates, diplomas, reference letters or other proof documents. They automatically appear as a download on every digital application page — and the short description helps the AI weave relevant skills into new applications where it fits."
    },
    noDocs: {
      de: "Noch keine weiteren Dokumente hochgeladen.",
      fr: "Aucun autre document téléversé pour l'instant.",
      en: "No additional documents uploaded yet."
    },
    docTitleLabel: { de: "Titel", fr: "Titre", en: "Title" },
    docTitlePlaceholder: {
      de: "z.B. Zertifikat Staplerschein Kat. R",
      fr: "p. ex. Certificat cariste cat. R",
      en: "e.g. Forklift certificate cat. R"
    },
    docCategoryLabel: { de: "Kategorie", fr: "Catégorie", en: "Category" },
    docSkillsLabel: {
      de: "Kurzbeschreibung für die KI (optional)",
      fr: "Courte description pour l'IA (facultatif)",
      en: "Short description for the AI (optional)"
    },
    docSkillsPlaceholder: {
      de: "Welche Fähigkeiten/Fakten belegt dieses Dokument? z.B. 'Staplerschein Kat. R, gültig bis 2027'",
      fr: "Quelles compétences/faits ce document atteste-t-il ? p. ex. « Permis cariste cat. R, valable jusqu'en 2027 »",
      en: "What skills/facts does this document prove? e.g. 'Forklift licence cat. R, valid until 2027'"
    },
    uploadAndSave: { de: "Datei wählen & hochladen", fr: "Choisir & téléverser un fichier", en: "Choose & upload file" },
    rawProfileTitle: { de: "Rohdaten-Profil bearbeiten", fr: "Modifier les données brutes du profil", en: "Edit raw profile data" },
    rawProfileSubtitle: {
      de: "Dies sind die Fakten, aus denen jede Bewerbung generiert wird (Kontaktdaten, Erfahrung, Ausbildung, Stärken). Die KI erfindet nichts dazu — nur was hier steht, kann in einer Bewerbung erscheinen. Vorsichtig bearbeiten: es muss gültiges JSON bleiben.",
      fr: "Ce sont les faits à partir desquels chaque candidature est générée (coordonnées, expérience, formation, points forts). L'IA n'invente rien — seul ce qui figure ici peut apparaître dans une candidature. À modifier avec précaution : le contenu doit rester un JSON valide.",
      en: "These are the facts every application is generated from (contact details, experience, education, strengths). The AI invents nothing — only what's written here can appear in an application. Edit carefully: it must stay valid JSON."
    },
    resetBtn: { de: "Auf Standard zurücksetzen", fr: "Réinitialiser par défaut", en: "Reset to default" },
    resetConfirm: {
      de: "Wirklich auf die Standard-Rohdaten zurücksetzen? Eigene Änderungen gehen verloren.",
      fr: "Vraiment réinitialiser les données par défaut ? Tes propres modifications seront perdues.",
      en: "Really reset to the default raw data? Your own changes will be lost."
    },
    savedOk: { de: "Gespeichert ✓", fr: "Enregistré ✓", en: "Saved ✓" },
    invalidJson: { de: "Ungültiges JSON: ", fr: "JSON invalide : ", en: "Invalid JSON: " },
    deleteDocConfirm: {
      de: "Dieses Dokument wirklich löschen?",
      fr: "Vraiment supprimer ce document ?",
      en: "Really delete this document?"
    }
  },

  theme: {
    title: { de: "Akzentfarbe", fr: "Couleur d'accent", en: "Accent color" },
    subtitle: {
      de: "Diese Farbe wird im Tool, auf der digitalen Bewerbungsseite und in den generierten PDFs (CV, Motivationsschreiben) verwendet. Eine Änderung wirkt sich auch rückwirkend auf bereits erstellte Bewerbungen aus.",
      fr: "Cette couleur est utilisée dans l'outil, sur la page de candidature numérique et dans les PDF générés (CV, lettre de motivation). Une modification s'applique aussi rétroactivement aux candidatures déjà créées.",
      en: "This color is used in the tool, on the digital application page, and in the generated PDFs (CV, cover letter). A change also applies retroactively to already-created applications."
    },
    colorLabel: { de: "Farbe", fr: "Couleur", en: "Color" },
    hexLabel: { de: "Hex-Code", fr: "Code hex", en: "Hex code" },
    saveBtn: { de: "Farbe speichern", fr: "Enregistrer la couleur", en: "Save color" },
    resetBtn: { de: "Zurücksetzen", fr: "Réinitialiser", en: "Reset" },
    invalidColor: {
      de: "Bitte einen gültigen Hex-Farbcode angeben (z.B. #e2572b).",
      fr: "Merci d'indiquer un code couleur hexadécimal valide (p. ex. #e2572b).",
      en: "Please provide a valid hex color code (e.g. #e2572b)."
    }
  },

  dashboard: {
    dayToday: { de: "heute", fr: "aujourd'hui", en: "today" },
    dayYesterday: { de: "gestern", fr: "hier", en: "yesterday" },
    daysAgo: { de: "vor {{n}} Tagen", fr: "il y a {{n}} jours", en: "{{n}} days ago" },
    editProfile: { de: "Profil-Daten bearbeiten →", fr: "Modifier les données de profil →", en: "Edit profile data →" },
    apiKeyWarning: {
      de: "⚠️ Kein ANTHROPIC_API_KEY gesetzt. Bitte in den Railway-Variablen hinterlegen, bevor Bewerbungen generiert werden können.",
      fr: "⚠️ Aucun ANTHROPIC_API_KEY défini. Merci de le renseigner dans les variables Railway avant de pouvoir générer des candidatures.",
      en: "⚠️ No ANTHROPIC_API_KEY set. Please add it to the Railway variables before applications can be generated."
    },
    savedSearchesTitle: { de: "🔍 Gespeicherte Suchen", fr: "🔍 Recherches enregistrées", en: "🔍 Saved searches" },
    savedSearchesSubtitle: {
      de: "Eigene, bereits gefilterte Suchlinks von Jobbörsen (jobs.ch, Indeed, jobup.ch, …) als Schnellzugriff — öffnet die Suche in einem neuen Tab. Kein automatisches Nachladen möglich (die grossen Jobbörsen bieten dafür keine öffentliche Schnittstelle mehr an).",
      fr: "Tes propres liens de recherche déjà filtrés sur les bourses d'emploi (jobs.ch, Indeed, jobup.ch, …) en accès rapide — ouvre la recherche dans un nouvel onglet. Aucun rechargement automatique possible (les grandes bourses d'emploi n'offrent plus d'interface publique pour cela).",
      en: "Your own, already-filtered search links from job boards (jobs.ch, Indeed, jobup.ch, …) as quick access — opens the search in a new tab. No automatic reloading possible (the big job boards no longer offer a public interface for that)."
    },
    noSavedSearches: { de: "Noch keine gespeicherten Suchen.", fr: "Aucune recherche enregistrée pour l'instant.", en: "No saved searches yet." },
    searchNamePlaceholder: {
      de: "Name (z.B. 'Polymechaniker Zürich – jobs.ch')",
      fr: "Nom (p. ex. « Mécanicien Zurich – jobs.ch »)",
      en: "Name (e.g. 'Mechanic Zurich – jobs.ch')"
    },
    searchUrlPlaceholder: { de: "https://www.jobs.ch/de/stellenangebote/?term=…", fr: "https://www.jobs.ch/fr/emplois/?term=…", en: "https://www.jobs.ch/en/vacancies/?term=…" },
    addSearch: { de: "+ Hinzufügen", fr: "+ Ajouter", en: "+ Add" },
    removeSearch: { de: "Suche entfernen", fr: "Supprimer la recherche", en: "Remove search" },
    deleteSearchConfirm: { de: "Diese gespeicherte Suche entfernen?", fr: "Supprimer cette recherche enregistrée ?", en: "Remove this saved search?" },
    searchRemoveError: { de: "Suche konnte nicht entfernt werden.", fr: "La recherche n'a pas pu être supprimée.", en: "The search could not be removed." },
    newAppTitle: { de: "Neue Bewerbung erstellen", fr: "Créer une nouvelle candidature", en: "Create a new application" },
    newAppSubtitle: {
      de: "Stelleninserat einfügen oder Link angeben — das Tool erstellt automatisch ein passendes E-Mail-Anschreiben, CV-PDF, Motivationsschreiben-PDF und eine digitale Bewerbungsseite mit eigener URL.",
      fr: "Colle l'offre d'emploi ou indique un lien — l'outil crée automatiquement un e-mail de candidature adapté, un CV PDF, une lettre de motivation PDF et une page de candidature numérique avec sa propre URL.",
      en: "Paste the job posting or provide a link — the tool automatically creates a matching application email, CV PDF, cover letter PDF, and a digital application page with its own URL."
    },
    tabText: { de: "Text einfügen", fr: "Coller le texte", en: "Paste text" },
    tabUrl: { de: "Link einfügen", fr: "Indiquer un lien", en: "Enter a link" },
    jobTextLabel: { de: "Stelleninserat (Text)", fr: "Offre d'emploi (texte)", en: "Job posting (text)" },
    jobTextPlaceholder: {
      de: "Text des Stelleninserats hier einfügen…",
      fr: "Colle ici le texte de l'offre d'emploi…",
      en: "Paste the job posting text here…"
    },
    jobUrlLabel: { de: "Link zum Stelleninserat", fr: "Lien vers l'offre d'emploi", en: "Link to the job posting" },
    jobUrlHint: {
      de: "Funktioniert nur bei öffentlich zugänglichen Seiten ohne Login (z.B. viele Firmen-Karriereseiten). Bei LinkedIn & Co. lieber den Text direkt einfügen.",
      fr: "Fonctionne uniquement avec des pages publiquement accessibles sans connexion (p. ex. de nombreuses pages carrières d'entreprises). Pour LinkedIn & co., colle plutôt directement le texte.",
      en: "Only works for publicly accessible pages without login (e.g. many company careers pages). For LinkedIn & co., paste the text directly instead."
    },
    languageLabel: { de: "Sprache der Bewerbung", fr: "Langue de la candidature", en: "Application language" },
    generateBtn: { de: "Bewerbung generieren", fr: "Générer la candidature", en: "Generate application" },
    generating: {
      de: "Generiere massgeschneiderte Bewerbung … (kann 15–30 Sekunden dauern)",
      fr: "Génération de la candidature sur mesure … (peut prendre 15 à 30 secondes)",
      en: "Generating tailored application … (can take 15–30 seconds)"
    },
    generatedDone: {
      de: "Fertig! Unten findest du alle Texte, Downloads und die digitale Bewerbungsseite.",
      fr: "Terminé ! Tu trouveras ci-dessous tous les textes, téléchargements et la page de candidature numérique.",
      en: "Done! Below you'll find all the texts, downloads, and the digital application page."
    },
    emailTextLabel: { de: "E-Mail-Text (für Bewerbung per E-Mail)", fr: "Texte de l'e-mail (pour candidature par e-mail)", en: "Email text (for emailed application)" },
    coverTextLabel: {
      de: "Motivationsschreiben (Fliesstext, für Online-Plattformen zum Copy-Paste)",
      fr: "Lettre de motivation (texte, à copier-coller pour les plateformes en ligne)",
      en: "Cover letter (plain text, to copy-paste for online platforms)"
    },
    copyBtn: { de: "Kopieren", fr: "Copier", en: "Copy" },
    copiedBtn: { de: "Kopiert ✓", fr: "Copié ✓", en: "Copied ✓" },
    downloadsLabel: { de: "Downloads & digitale Bewerbung", fr: "Téléchargements & candidature numérique", en: "Downloads & digital application" },
    sendEmailBtn: { de: "✉ Bewerbung per E-Mail senden", fr: "✉ Envoyer la candidature par e-mail", en: "✉ Send application by email" },
    downloadEmlBtn: {
      de: "📎 Als E-Mail mit Anhang herunterladen",
      fr: "📎 Télécharger comme e-mail avec pièce jointe",
      en: "📎 Download as email with attachment"
    },
    mailtoHintWithEmail: { de: "Wird vorbereitet an: {{email}}. ", fr: "Sera préparé pour : {{email}}. ", en: "Will be prepared for: {{email}}. " },
    mailtoHintNoEmail: {
      de: "Im Inserat wurde keine Kontakt-E-Mail gefunden — bitte Empfänger manuell eintragen. ",
      fr: "Aucune adresse e-mail de contact trouvée dans l'offre — merci d'indiquer le destinataire manuellement. ",
      en: "No contact email was found in the posting — please enter the recipient manually. "
    },
    mailtoHintSuffix: {
      de: "Direkt öffnen = schnell, aber ohne echten Anhang (nur Links im Text). Herunterladen = mit Lebenslauf + Motivationsschreiben als echtem PDF-Anhang, danach im Mail-Programm öffnen und weiterleiten/senden.",
      fr: "Ouvrir directement = rapide, mais sans pièce jointe réelle (seulement des liens dans le texte). Télécharger = avec CV + lettre de motivation en pièces jointes PDF réelles, à ouvrir ensuite dans le programme de messagerie pour transférer/envoyer.",
      en: "Open directly = fast, but without a real attachment (just links in the text). Download = with CV + cover letter as real PDF attachments, then open in your mail app to forward/send."
    },
    downloadCv: { de: "⬇ CV (PDF)", fr: "⬇ CV (PDF)", en: "⬇ CV (PDF)" },
    downloadCover: { de: "⬇ Anschreiben (PDF)", fr: "⬇ Lettre de motivation (PDF)", en: "⬇ Cover letter (PDF)" },
    openAppPage: { de: "🌐 Digitale Bewerbungsseite öffnen", fr: "🌐 Ouvrir la page de candidature numérique", en: "🌐 Open digital application page" },
    errorNeedText: {
      de: "Bitte zuerst den Stelleninserat-Text einfügen.",
      fr: "Merci de coller d'abord le texte de l'offre d'emploi.",
      en: "Please paste the job posting text first."
    },
    errorNeedUrl: { de: "Bitte zuerst einen Link einfügen.", fr: "Merci d'indiquer d'abord un lien.", en: "Please enter a link first." },
    errorGeneric: { de: "Unbekannter Fehler", fr: "Erreur inconnue", en: "Unknown error" },
    duplicateWarning: {
      de: "⚠️ Achtung: Du hast dich bei dieser Firma bereits am {{date}} beworben (Status: {{status}}). Diese neue Bewerbung wurde trotzdem gespeichert — bitte unten in der Liste prüfen und ggf. eine der beiden löschen.",
      fr: "⚠️ Attention : tu as déjà postulé chez cette entreprise le {{date}} (statut : {{status}}). Cette nouvelle candidature a tout de même été enregistrée — merci de vérifier ci-dessous dans la liste et de supprimer l'une des deux si nécessaire.",
      en: "⚠️ Note: you already applied to this company on {{date}} (status: {{status}}). This new application was saved anyway — please check the list below and delete one of the two if needed."
    },
    attachmentsSuffix: {
      de: "\n\nBeilagen: Lebenslauf, Motivationsschreiben",
      fr: "\n\nPièces jointes : CV, lettre de motivation",
      en: "\n\nAttachments: CV, cover letter"
    },
    pastAppsTitle: { de: "Bisherige Bewerbungen", fr: "Candidatures précédentes", en: "Previous applications" },
    filterLabel: { de: "Filter:", fr: "Filtre :", en: "Filter:" },
    filterAll: { de: "Alle Status", fr: "Tous les statuts", en: "All statuses" },
    colApplication: { de: "Bewerbung", fr: "Candidature", en: "Application" },
    colFit: { de: "Fit", fr: "Adéquation", en: "Fit" },
    colStatus: { de: "Status", fr: "Statut", en: "Status" },
    colActions: { de: "Aktionen", fr: "Actions", en: "Actions" },
    fitTooltip: {
      de: "Ehrliche KI-Einschätzung, wie gut dein Profil zu dieser Stelle passt",
      fr: "Évaluation honnête par l'IA de l'adéquation entre ton profil et ce poste",
      en: "Honest AI assessment of how well your profile matches this role"
    },
    scoreNaTooltip: {
      de: "Kein Score verfügbar (vor diesem Feature erstellt).",
      fr: "Aucun score disponible (créé avant cette fonctionnalité).",
      en: "No score available (created before this feature)."
    },
    noAppsYet: { de: "Noch keine Bewerbungen erstellt.", fr: "Aucune candidature créée pour l'instant.", en: "No applications created yet." },
    noAppsFiltered: { de: "Keine Bewerbungen mit diesem Status.", fr: "Aucune candidature avec ce statut.", en: "No applications with this status." },
    notePlaceholder: { de: "Notiz (z.B. Interviewtermin) …", fr: "Note (p. ex. date d'entretien) …", en: "Note (e.g. interview date) …" },
    linkAppPage: { de: "Digitale Seite ↗", fr: "Page numérique ↗", en: "Digital page ↗" },
    linkCv: { de: "CV", fr: "CV", en: "CV" },
    linkCover: { de: "Anschreiben", fr: "Lettre de motiv.", en: "Cover letter" },
    linkPosting: { de: "Inserat ↗", fr: "Offre ↗", en: "Posting ↗" },
    linkEmail: { de: "✉ E-Mail", fr: "✉ E-mail", en: "✉ Email" },
    linkEmailTitleWithAddr: { de: "An {{email}}", fr: "À {{email}}", en: "To {{email}}" },
    linkEmailTitleNoAddr: {
      de: "Keine Kontakt-E-Mail im Inserat gefunden — Empfänger manuell eintragen",
      fr: "Aucune adresse e-mail de contact trouvée dans l'offre — indiquer le destinataire manuellement",
      en: "No contact email found in the posting — enter the recipient manually"
    },
    linkEmailAttachment: { de: "📎 Mit Anhang", fr: "📎 Avec pièce jointe", en: "📎 With attachment" },
    linkEmailAttachmentTitle: {
      de: "E-Mail-Datei mit Lebenslauf + Motivationsschreiben als echtem Anhang — öffnen und weiterleiten/senden",
      fr: "Fichier e-mail avec CV + lettre de motivation en pièces jointes réelles — à ouvrir et transférer/envoyer",
      en: "Email file with CV + cover letter as real attachments — open and forward/send"
    },
    linkFollowup: { de: "🔔 Nachfassen", fr: "🔔 Relancer", en: "🔔 Follow up" },
    linkFollowupTitle: {
      de: "Höfliche Nachfrage-Mail vorbereiten — Status wird danach automatisch auf 'Follow-up gemacht' gesetzt",
      fr: "Préparer un e-mail de relance courtois — le statut passera automatiquement sur « Relance effectuée »",
      en: "Prepare a polite follow-up email — status will automatically switch to 'Followed up' afterwards"
    },
    linkInsights: { de: "🏢 Firmen-Insights", fr: "🏢 Infos sur l'entreprise", en: "🏢 Company insights" },
    linkInsightsTitle: {
      de: "Automatisch recherchiertes Briefing zur Gesprächsvorbereitung",
      fr: "Briefing recherché automatiquement pour préparer l'entretien",
      en: "Automatically researched briefing to prepare for the interview"
    },
    linkInsightsRegenTitle: {
      de: "Neu recherchieren (z.B. falls es neue Firmen-News gibt)",
      fr: "Rechercher à nouveau (p. ex. s'il y a de nouvelles actualités sur l'entreprise)",
      en: "Research again (e.g. if there's fresh company news)"
    },
    linkInsightsCreate: { de: "🏢 Firmen-Insights erstellen", fr: "🏢 Créer les infos sur l'entreprise", en: "🏢 Create company insights" },
    linkInsightsCreateTitle: {
      de: "Recherchiert die Firma automatisch im Web und erstellt ein PDF-Briefing zur Gesprächsvorbereitung",
      fr: "Recherche automatiquement l'entreprise sur le web et crée un briefing PDF pour préparer l'entretien",
      en: "Automatically researches the company online and creates a PDF briefing to prepare for the interview"
    },
    insightsResearching: { de: "🔎 Recherchiere … (ca. 15–20s)", fr: "🔎 Recherche en cours … (env. 15–20 s)", en: "🔎 Researching … (approx. 15–20s)" },
    insightsError: {
      de: "Firmen-Insights konnten nicht erstellt werden: ",
      fr: "Les infos sur l'entreprise n'ont pas pu être créées : ",
      en: "Company insights could not be created: "
    },
    activatePage: { de: "Wieder aktivieren", fr: "Réactiver", en: "Reactivate" },
    deactivatePage: { de: "Seite deaktivieren", fr: "Désactiver la page", en: "Deactivate page" },
    activatePageTitle: {
      de: "Öffentliche Seite wieder online schalten",
      fr: "Remettre la page publique en ligne",
      en: "Bring the public page back online"
    },
    deactivatePageTitle: {
      de: "Öffentliche Seite + PDFs offline nehmen (z.B. nach Abschluss) — Datenschutz für Adresse/Foto/Telefon",
      fr: "Mettre la page publique + les PDF hors ligne (p. ex. après clôture) — protection des données (adresse/photo/téléphone)",
      en: "Take the public page + PDFs offline (e.g. once the process is over) — privacy for address/photo/phone"
    },
    pageDisabled: { de: "Seite deaktiviert", fr: "Page désactivée", en: "Page deactivated" },
    pageDisabledTitle: {
      de: "Öffentliche Seite und PDF-Downloads sind deaktiviert — im privaten Dashboard bleibt alles erhalten",
      fr: "La page publique et les téléchargements PDF sont désactivés — tout reste conservé dans le tableau de bord privé",
      en: "The public page and PDF downloads are deactivated — everything is preserved in the private dashboard"
    },
    deleteBtn: { de: "Löschen", fr: "Supprimer", en: "Delete" },
    deactivateConfirm: {
      de: "Öffentliche Bewerbungsseite und PDF-Downloads für diese Bewerbung offline nehmen? Ein bereits versendeter Link zeigt danach nur noch 'nicht mehr verfügbar'. Im Dashboard bleibt alles erhalten.",
      fr: "Mettre hors ligne la page de candidature publique et les téléchargements PDF pour cette candidature ? Un lien déjà envoyé n'affichera plus que « plus disponible ». Tout reste conservé dans le tableau de bord.",
      en: "Take the public application page and PDF downloads offline for this application? A link already sent will then just show 'no longer available'. Everything stays in the dashboard."
    },
    deleteAppConfirm: {
      de: "Diese Bewerbung wirklich löschen? (Die digitale Seite ist danach nicht mehr erreichbar.)",
      fr: "Vraiment supprimer cette candidature ? (La page numérique ne sera plus accessible ensuite.)",
      en: "Really delete this application? (The digital page will no longer be reachable afterwards.)"
    },
    publicToggleError: {
      de: "Konnte den Status der öffentlichen Seite nicht ändern.",
      fr: "Impossible de modifier le statut de la page publique.",
      en: "Could not change the public page's status."
    },
    statusSaveError: { de: "Status konnte nicht gespeichert werden.", fr: "Le statut n'a pas pu être enregistré.", en: "The status could not be saved." },
    noteSaveError: { de: "Notiz konnte nicht gespeichert werden.", fr: "La note n'a pas pu être enregistrée.", en: "The note could not be saved." },
    statTotalSent: { de: "Versendet", fr: "Envoyées", en: "Sent" },
    statResponseRate: { de: "Antwortquote", fr: "Taux de réponse", en: "Response rate" },
    statInConversation: { de: "Im Gespräch", fr: "En discussion", en: "In conversation" },
    statOffers: { de: "Zusagen", fr: "Offres reçues", en: "Offers" },
    statRejections: { de: "Absagen", fr: "Refus", en: "Rejections" },
    statBarTitle: {
      de: "Momentaufnahme nach aktuellem Status je Bewerbung, keine vollständige Verlaufs-Historie",
      fr: "Instantané selon le statut actuel de chaque candidature, pas un historique complet",
      en: "Snapshot by each application's current status, not a full history"
    },
    duplicateBadge: { de: "⚠️ Mögliche Dublette", fr: "⚠️ Doublon possible", en: "⚠️ Possible duplicate" },
    duplicateBadgeTitle: {
      de: "Du hast bei {{company}} bereits am {{date}} beworben (Status: {{status}}) — bitte prüfen, ob das gewollt war.",
      fr: "Tu as déjà postulé chez {{company}} le {{date}} (statut : {{status}}) — merci de vérifier si c'était voulu.",
      en: "You already applied to {{company}} on {{date}} (status: {{status}}) — please check whether that was intended."
    }
  },

  appPage: {
    pillPlain: { de: "Bewerbung", fr: "Candidature", en: "Application" },
    pillFor: { de: "Bewerbung für {{company}}", fr: "Candidature chez {{company}}", en: "Application for {{company}}" },
    downloadCv: { de: "⬇ Lebenslauf (PDF)", fr: "⬇ CV (PDF)", en: "⬇ CV (PDF)" },
    downloadCover: { de: "⬇ Motivationsschreiben (PDF)", fr: "⬇ Lettre de motivation (PDF)", en: "⬇ Cover letter (PDF)" },
    navCv: { de: "CV", fr: "CV", en: "CV" },
    navCover: { de: "Anschreiben", fr: "Lettre", en: "Cover letter" },
    sectionProfile: { de: "Profil", fr: "Profil", en: "Profile" },
    sectionWhy: { de: "Warum diese Stelle", fr: "Pourquoi ce poste", en: "Why this role" },
    sectionStrengths: { de: "Kernstärken für diese Stelle", fr: "Points forts pour ce poste", en: "Key strengths for this role" },
    sectionExperience: { de: "Erfahrung", fr: "Expérience", en: "Experience" },
    sectionReference: { de: "Referenzstimme", fr: "Référence", en: "Reference" },
    sectionLanguages: { de: "Sprachen", fr: "Langues", en: "Languages" },
    sectionEducation: { de: "Ausbildung & Kenntnisse", fr: "Formation & compétences", en: "Education & skills" },
    sectionDocs: { de: "Dokumente zum Download", fr: "Documents à télécharger", en: "Documents to download" },
    docCvLabel: { de: "Lebenslauf (PDF)", fr: "CV (PDF)", en: "CV (PDF)" },
    docCvSub: { de: "Massgeschneidert auf diese Stelle", fr: "Adapté sur mesure à ce poste", en: "Tailored to this role" },
    docCoverLabel: { de: "Motivationsschreiben (PDF)", fr: "Lettre de motivation (PDF)", en: "Cover letter (PDF)" },
    docCoverSub: { de: "Individuell formuliert", fr: "Rédigée individuellement", en: "Individually written" },
    docGenericSub: { de: "Dokument", fr: "Document", en: "Document" },
    transparencyTag: { de: "Transparenz", fr: "Transparence", en: "Transparency" },
    transparencyText: {
      de: "Diese Bewerbung wurde mit gezielter KI-Unterstützung erstellt und auf diese Stelle zugeschnitten — nicht aus Bequemlichkeit, sondern aus Überzeugung: Wer heute die richtigen Tools nutzt, kann schneller, gründlicher und passgenauer arbeiten. Genau diese Haltung bringe ich auch in meine Arbeit ein. Alle Fakten in diesem Dossier sind echt und geprüft — ich gehe mit der Zeit, heute und morgen.",
      fr: "Cette candidature a été créée avec le soutien ciblé de l'IA et adaptée à ce poste — non par facilité, mais par conviction : utiliser aujourd'hui les bons outils permet de travailler plus vite, plus soigneusement et de manière plus ciblée. C'est exactement cette attitude que j'apporte aussi dans mon travail. Tous les faits de ce dossier sont réels et vérifiés — je vis avec mon temps, aujourd'hui et demain.",
      en: "This application was created with targeted AI support and tailored to this role — not out of convenience, but out of conviction: using the right tools today means working faster, more thoroughly, and more precisely. That's exactly the mindset I bring to my work as well. Every fact in this dossier is real and checked — I move with the times, today and tomorrow."
    },
    footerCreatedOn: { de: "Erstellt am {{date}}", fr: "Créée le {{date}}", en: "Created on {{date}}" }
  },

  pdf: {
    strengths: { de: "Kernstärken", fr: "Points forts", en: "Key strengths" },
    education: { de: "Ausbildung", fr: "Formation", en: "Education" },
    grade: { de: "Note", fr: "Note", en: "Grade" },
    languages: { de: "Sprachen", fr: "Langues", en: "Languages" },
    skills: { de: "Kenntnisse", fr: "Compétences", en: "Skills" },
    personalInfo: { de: "Persönliches", fr: "Informations personnelles", en: "Personal" },
    drivingLicense: { de: "Führerausweis", fr: "Permis de conduire", en: "Driving licence" },
    availableFrom: { de: "Verfügbar", fr: "Disponible", en: "Available" },
    profile: { de: "Profil", fr: "Profil", en: "Profile" },
    experience: { de: "Erfahrung", fr: "Expérience", en: "Experience" },
    digitalApplication: { de: "Digitale Bewerbung", fr: "Candidature numérique", en: "Digital application" },
    qrHint: {
      de: "QR-Code scannen für die interaktive Bewerbungsseite mit CV, Referenzen & Zeugnissen — oder direkt:",
      fr: "Scanner le QR code pour la page de candidature interactive avec CV, références & certificats — ou directement :",
      en: "Scan the QR code for the interactive application page with CV, references & certificates — or directly:"
    },
    footerSuffix: { de: "Bewerbungsunterlagen", fr: "Dossier de candidature", en: "Application documents" },
    greeting: { de: "Freundliche Grüsse", fr: "Meilleures salutations", en: "Kind regards" },
    defaultSubject: { de: "Bewerbung als {{jobTitle}}", fr: "Candidature au poste de {{jobTitle}}", en: "Application for {{jobTitle}}" },
    defaultRecipient: { de: "Personalabteilung", fr: "Ressources humaines", en: "HR department" },
    unknownCompany: { de: "Firma", fr: "Entreprise", en: "Company" },
    digitalLinkText: {
      de: "» Digitale Bewerbung mit CV, Referenzen & Zeugnissen ansehen",
      fr: "» Voir la candidature numérique avec CV, références & certificats",
      en: "» View digital application with CV, references & certificates"
    },
    insightsTitle: { de: "🏢 Firmen-Insights", fr: "🏢 Infos sur l'entreprise", en: "🏢 Company insights" },
    insightsSubtitle: {
      de: "{{company}} — Vorbereitung auf: {{jobTitle}}",
      fr: "{{company}} — Préparation pour : {{jobTitle}}",
      en: "{{company}} — Preparing for: {{jobTitle}}"
    },
    insightsGeneratedNote: {
      de: "Automatisch recherchiert am {{date}} — bitte Angaben vor dem Gespräch selbst gegenprüfen, insbesondere bei wenig bekannten Firmen.",
      fr: "Recherché automatiquement le {{date}} — merci de vérifier toi-même les informations avant l'entretien, surtout pour les entreprises peu connues.",
      en: "Automatically researched on {{date}} — please double-check the details yourself before the interview, especially for lesser-known companies."
    },
    insightsOverview: { de: "Firmenüberblick", fr: "Aperçu de l'entreprise", en: "Company overview" },
    insightsProducts: { de: "Produkte & Dienstleistungen", fr: "Produits & services", en: "Products & services" },
    insightsNews: { de: "Aktuelle News", fr: "Actualités récentes", en: "Recent news" },
    insightsTopics: { de: "Mögliche Gesprächsthemen", fr: "Sujets de discussion possibles", en: "Likely discussion topics" },
    insightsQuestions: { de: "Fragen, die du stellen könntest", fr: "Questions que tu pourrais poser", en: "Questions you could ask" },
    insightsSources: { de: "Quellen", fr: "Sources", en: "Sources" },
    insightsNoData: { de: "Keine Angaben gefunden.", fr: "Aucune information trouvée.", en: "No information found." }
  },

  mail: {
    downloadsHeader: { de: "Unterlagen zum Download:", fr: "Documents à télécharger :", en: "Documents to download:" },
    cvLine: { de: "Lebenslauf (PDF): {{url}}", fr: "CV (PDF) : {{url}}", en: "CV (PDF): {{url}}" },
    coverLine: { de: "Motivationsschreiben (PDF): {{url}}", fr: "Lettre de motivation (PDF) : {{url}}", en: "Cover letter (PDF): {{url}}" },
    appPageLine: { de: "Digitale Bewerbungsseite: {{url}}", fr: "Page de candidature numérique : {{url}}", en: "Digital application page: {{url}}" },
    defaultSubject: { de: "Bewerbung als {{jobTitle}}", fr: "Candidature au poste de {{jobTitle}}", en: "Application for {{jobTitle}}" },
    followupSubject: {
      de: "Nachfrage zu meiner Bewerbung als {{jobTitle}}{{atCompany}}",
      fr: "Relance concernant ma candidature au poste de {{jobTitle}}{{atCompany}}",
      en: "Follow-up on my application for {{jobTitle}}{{atCompany}}"
    },
    followupAtCompany: { de: " bei {{company}}", fr: " chez {{company}}", en: " at {{company}}" },
    followupGreeting: { de: "Sehr geehrte Damen und Herren,", fr: "Madame, Monsieur,", en: "Dear Sir or Madam," },
    followupBody: {
      de: "am {{date}} habe ich mich bei {{company}} als {{jobTitle}} beworben. Da ich bisher noch keine Rückmeldung erhalten habe, wollte ich freundlich nachfragen, ob es inzwischen Neuigkeiten zum Stand meiner Bewerbung gibt.",
      fr: "le {{date}}, j'ai postulé chez {{company}} pour le poste de {{jobTitle}}. N'ayant pas encore reçu de retour, je me permets de vous demander s'il y a du nouveau concernant l'état de ma candidature.",
      en: "on {{date}} I applied to {{company}} for the {{jobTitle}} position. As I haven't received any feedback yet, I wanted to kindly ask whether there is any news on the status of my application."
    },
    followupClosing: {
      de: "Für Rückfragen stehe ich Ihnen jederzeit gerne zur Verfügung.",
      fr: "Je reste à votre entière disposition pour toute question.",
      en: "Please don't hesitate to reach out if you have any questions."
    },
    followupSign: { de: "Freundliche Grüsse", fr: "Meilleures salutations", en: "Kind regards" },
    followupDateFallback: { de: "kürzlich", fr: "récemment", en: "recently" },
    followupDefaultCompany: { de: "Ihnen", fr: "vous", en: "you" },
    followupDefaultRole: { de: "Mitarbeiter", fr: "collaborateur", en: "employee" }
  },

  status: {
    entwurf: { de: "Entwurf", fr: "Brouillon", en: "Draft" },
    gesendet: { de: "Gesendet", fr: "Envoyée", en: "Sent" },
    follow_up: { de: "Follow-up gemacht", fr: "Relance effectuée", en: "Followed up" },
    interview: { de: "Eingeladen zum Vorstellungsgespräch", fr: "Invité·e à un entretien", en: "Invited to interview" },
    in_auswahl: { de: "In der engeren Auswahl", fr: "En short-list", en: "Shortlisted" },
    zusage: { de: "Zusage", fr: "Offre acceptée", en: "Offer" },
    absage: { de: "Absage", fr: "Refus", en: "Rejection" }
  },

  docCategory: {
    zeugnis: { de: "Arbeitszeugnis", fr: "Certificat de travail", en: "Work reference" },
    diplom: { de: "Diplom / Abschluss", fr: "Diplôme", en: "Diploma / degree" },
    zertifikat: { de: "Zertifikat / Kurs", fr: "Certificat / cours", en: "Certificate / course" },
    referenz: { de: "Referenzschreiben", fr: "Lettre de référence", en: "Reference letter" },
    sonstiges: { de: "Sonstiges", fr: "Autre", en: "Other" }
  },

  deactivated: {
    title: { de: "Nicht mehr verfügbar", fr: "Plus disponible", en: "No longer available" },
    heading: { de: "Diese Seite ist nicht mehr verfügbar", fr: "Cette page n'est plus disponible", en: "This page is no longer available" },
    text: { de: "Der Link wurde deaktiviert.", fr: "Le lien a été désactivé.", en: "The link has been deactivated." }
  },

  posting: {
    fallbackTitle: { de: "Stelleninserat", fr: "Offre d'emploi", en: "Job posting" },
    titleSuffix: { de: "Original-Inserat", fr: "Offre originale", en: "Original posting" },
    savedOn: {
      de: "Gespeichert am {{date}} — das ist der Original-Text, aus dem diese Bewerbung generiert wurde.",
      fr: "Enregistrée le {{date}} — voici le texte original à partir duquel cette candidature a été générée.",
      en: "Saved on {{date}} — this is the original text this application was generated from."
    },
    openOriginal: { de: "Original-Inserat online öffnen ↗", fr: "Ouvrir l'offre originale en ligne ↗", en: "Open original posting online ↗" },
    noLink: {
      de: "Kein Link hinterlegt — das Inserat wurde damals als Text eingefügt (siehe unten).",
      fr: "Aucun lien enregistré — l'offre avait été collée sous forme de texte (voir ci-dessous).",
      en: "No link on file — the posting was pasted as text at the time (see below)."
    },
    noText: { de: "Kein Text gespeichert.", fr: "Aucun texte enregistré.", en: "No text saved." }
  },

  auth: {
    usernameInvalid: {
      de: "Benutzername: 2-30 Zeichen, nur Kleinbuchstaben, Zahlen, Punkt, Bindestrich oder Unterstrich, muss mit Buchstabe/Zahl beginnen.",
      fr: "Nom d'utilisateur : 2 à 30 caractères, uniquement minuscules, chiffres, point, tiret ou underscore, doit commencer par une lettre/un chiffre.",
      en: "Username: 2-30 characters, only lowercase letters, digits, dot, hyphen or underscore, must start with a letter/digit."
    },
    usernameTaken: { de: "Dieser Benutzername ist bereits vergeben.", fr: "Ce nom d'utilisateur est déjà pris.", en: "This username is already taken." },
    passwordTooShort: {
      de: "Passwort muss mindestens 8 Zeichen lang sein.",
      fr: "Le mot de passe doit comporter au moins 8 caractères.",
      en: "Password must be at least 8 characters long."
    },
    wrongCredentials: {
      de: "Benutzername oder Passwort ist falsch.",
      fr: "Nom d'utilisateur ou mot de passe incorrect.",
      en: "Username or password is incorrect."
    },
    pleaseLoginFirst: { de: "Bitte zuerst einloggen.", fr: "Merci de te connecter d'abord.", en: "Please log in first." },
    wrongCurrentPassword: {
      de: "Aktuelles Passwort ist falsch.",
      fr: "Le mot de passe actuel est incorrect.",
      en: "Current password is incorrect."
    }
  },

  account: {
    title: { de: "Konto-Einstellungen", fr: "Paramètres du compte", en: "Account settings" },
    subtitle: {
      de: "Benutzername oder Passwort für dein Konto ändern.",
      fr: "Modifier le nom d'utilisateur ou le mot de passe de ton compte.",
      en: "Change your account's username or password."
    },
    usernameCardTitle: { de: "Benutzername", fr: "Nom d'utilisateur", en: "Username" },
    usernameCardSubtitle: { de: "Wie du dich einloggst.", fr: "Comment tu te connectes.", en: "How you sign in." },
    passwordCardTitle: { de: "Passwort", fr: "Mot de passe", en: "Password" },
    passwordCardSubtitle: { de: "Ein sicheres Passwort schützt dein Konto.", fr: "Un mot de passe sécurisé protège ton compte.", en: "A strong password protects your account." },
    currentUsername: { de: "Aktueller Benutzername", fr: "Nom d'utilisateur actuel", en: "Current username" },
    newUsernameLabel: { de: "Neuer Benutzername", fr: "Nouveau nom d'utilisateur", en: "New username" },
    currentPasswordLabel: { de: "Aktuelles Passwort", fr: "Mot de passe actuel", en: "Current password" },
    newPasswordLabel: { de: "Neues Passwort", fr: "Nouveau mot de passe", en: "New password" },
    confirmNewPasswordLabel: {
      de: "Neues Passwort bestätigen",
      fr: "Confirmer le nouveau mot de passe",
      en: "Confirm new password"
    },
    saveUsernameBtn: { de: "Benutzername speichern", fr: "Enregistrer le nom d'utilisateur", en: "Save username" },
    savePasswordBtn: { de: "Passwort speichern", fr: "Enregistrer le mot de passe", en: "Save password" },
    usernameChanged: { de: "Benutzername geändert.", fr: "Nom d'utilisateur modifié.", en: "Username changed." },
    passwordChanged: { de: "Passwort geändert.", fr: "Mot de passe modifié.", en: "Password changed." },
    passwordMismatch: {
      de: "Die beiden Passwörter stimmen nicht überein.",
      fr: "Les deux mots de passe ne correspondent pas.",
      en: "The two passwords don't match."
    }
  },

  server: {
    needTextOrUrl: {
      de: "Bitte einen ausreichend langen Stelleninserat-Text oder einen gültigen Link angeben.",
      fr: "Merci de fournir un texte d'offre d'emploi suffisamment long ou un lien valide.",
      en: "Please provide a sufficiently long job posting text or a valid link."
    },
    rateLimitGenerate: {
      de: "Tageslimit erreicht (max. {{limit}} Generierungen/Tag). Bitte morgen wieder versuchen.",
      fr: "Limite journalière atteinte (max. {{limit}} générations/jour). Merci de réessayer demain.",
      en: "Daily limit reached (max. {{limit}} generations/day). Please try again tomorrow."
    },
    rateLimitInsights: {
      de: "Tageslimit erreicht (max. {{limit}} Firmen-Insights/Tag). Bitte morgen wieder versuchen.",
      fr: "Limite journalière atteinte (max. {{limit}} infos entreprise/jour). Merci de réessayer demain.",
      en: "Daily limit reached (max. {{limit}} company insights/day). Please try again tomorrow."
    },
    genericGenerateError: {
      de: "Unbekannter Fehler bei der Generierung.",
      fr: "Erreur inconnue lors de la génération.",
      en: "Unknown error during generation."
    },
    genericInsightsError: {
      de: "Firmen-Insights konnten nicht erstellt werden.",
      fr: "Les infos sur l'entreprise n'ont pas pu être créées.",
      en: "Company insights could not be created."
    },
    invalidProfileStructure: {
      de: "Ungültige Profilstruktur (personal & experience erforderlich).",
      fr: "Structure de profil invalide (personal & experience requis).",
      en: "Invalid profile structure (personal & experience required)."
    },
    invalidStatus: { de: "Ungültiger Status.", fr: "Statut invalide.", en: "Invalid status." },
    noFileReceived: { de: "Keine Datei erhalten.", fr: "Aucun fichier reçu.", en: "No file received." },
    searchNameRequired: {
      de: "Bitte einen Namen für die Suche angeben.",
      fr: "Merci d'indiquer un nom pour la recherche.",
      en: "Please provide a name for the search."
    },
    invalidLink: { de: "Ungültiger Link.", fr: "Lien invalide.", en: "Invalid link." },
    onlyHttpLinks: {
      de: "Nur http(s)-Links sind erlaubt.",
      fr: "Seuls les liens http(s) sont autorisés.",
      en: "Only http(s) links are allowed."
    },
    unknownMediaType: { de: "Unbekannter Medientyp: {{key}}", fr: "Type de média inconnu : {{key}}", en: "Unknown media type: {{key}}" },
    invalidImageFormat: {
      de: "Bitte ein JPG, PNG oder WEBP-Bild hochladen.",
      fr: "Merci de téléverser une image JPG, PNG ou WEBP.",
      en: "Please upload a JPG, PNG or WEBP image."
    },
    invalidDocFormat: {
      de: "Bitte eine PDF-, JPG-, PNG- oder WEBP-Datei hochladen.",
      fr: "Merci de téléverser un fichier PDF, JPG, PNG ou WEBP.",
      en: "Please upload a PDF, JPG, PNG or WEBP file."
    },
    noApiKey: {
      de: "ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in den Railway-Variablen hinterlegen.",
      fr: "ANTHROPIC_API_KEY n'est pas défini. Merci de le renseigner dans les variables Railway.",
      en: "ANTHROPIC_API_KEY is not set. Please add it to the Railway variables."
    }
  }
};

/**
 * t(lang, "namespace.key", vars) — looks up a translation, falls back to
 * German (this app's original language, always fully populated) if the
 * requested language is missing a key, and finally to the raw key path if
 * even German is missing (should never happen, but fails loud/visible
 * instead of silently rendering "undefined" in the UI).
 */
function t(lang, keyPath, vars) {
  const parts = String(keyPath).split(".");
  let node = DICT;
  for (const part of parts) {
    node = node && node[part];
    if (node === undefined) break;
  }
  let value;
  if (node && typeof node === "object") {
    value = node[lang] || node[DEFAULT_LANG];
  }
  if (value === undefined) value = keyPath;
  if (vars) {
    // Placeholder syntax is {{ key }} with optional surrounding whitespace.
    // Regex built at runtime via String.fromCharCode rather than a literal
    // backslash-escape sequence in this source file -- this codebase's
    // GitHub-push pipeline has repeatedly mangled literal backslash-escape
    // sequences in pushed file content, so this keeps the source immune to
    // that whole class of transcription bug.
    var WS = String.fromCharCode(92) + "s*"; // -> "\s*" (backslash + s + asterisk)
    Object.keys(vars).forEach((k) => {
      var pattern = "{{" + WS + k + WS + "}}";
      value = value.replace(new RegExp(pattern, "g"), vars[k] == null ? "" : String(vars[k]));
    });
  }
  return value;
}

function langFromReq(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)lang=([^;]+)/);
  return normalizeLang(match ? decodeURIComponent(match[1]) : DEFAULT_LANG);
}

module.exports = { LANGS, DEFAULT_LANG, LANG_COOKIE, LANG_NAMES, t, isValidLang, normalizeLang, localeFor, langFromReq };
