/**
 * Rohdaten-Profil von Raffael Putra Wyss.
 *
 * Dies ist die EINZIGE Quelle der Wahrheit für Fakten (Daten, Firmen, Noten, Titel).
 * Die KI darf daraus Formulierungen, Auswahl & Gewichtung pro Stelle ableiten,
 * aber KEINE neuen Fakten erfinden.
 *
 * Kann jederzeit über /profile (mit Passwort geschützt) im laufenden Tool
 * angepasst werden, ohne Redeploy.
 */

const { slugify } = require("./store");
const { DEFAULT_ACCENT } = require("./accentColor");

const DEFAULT_PROFILE = {
  // Customizable brand accent color, used throughout the tool UI, the
  // digital application page, and the generated CV/cover-letter/insights
  // PDFs — see lib/accentColor.js and /profile's color-picker card.
  accentColor: DEFAULT_ACCENT,

  personal: {
    name: "Raffael Putra Wyss",
    strasse: "Vorstattstrasse 47",
    plz: "4653",
    ort: "Obergösgen SO",
    land: "Schweiz",
    telefon: "076 815 55 41",
    email: "raffael@iwyss.ch",
    geburtsdatum: "01.05.2005",
    heimatort: "Winznau SO",
    staatsangehoerigkeit: "Schweiz / Indonesien",
    fuehrerausweis: "Kategorie B sowie A1 (Motorrad bis 125 cm³)",
    verfuegbarkeit: "ab 1. Oktober 2026",
    arbeitsradius: "ca. 1 Stunde Pendelweg ab Obergösgen SO (Auto oder ÖV)",
    linkedin: "linkedin.com/in/raffael-putra-wyss",
    aktuellerOrt: "Bali, Indonesien (Rückkehr Schweiz: September 2026)"
  },

  // Freeform extra links (Portfolio, GitHub, personal website, ...), shown
  // alongside LinkedIn on the digital application page and CV. Empty by
  // default even for Raffael — nothing forces this to be filled in.
  links: [],

  // User-explained CV inconsistencies (gaps, missing info, contradictions
  // detected during CV import) — see lib/ai.js detectedIssues / buildSystemPrompt
  // clarificationsBlock. Each entry: { type, description, explanation }.
  clarifications: [],

  headlineOptions: [
    "Polymechaniker EFZ | CNC-Fräsen & Fertigungstechnik",
    "CNC-Polymechaniker EFZ | Schwerpunkt CNC-Fräsen",
    "Co-Founder Orue Clothing · Swiss × Indonesian Entrepreneur",
    "Gründer- & Marketing-Erfahrung zwischen Handwerk und Business"
  ],

  narrativeSummary:
    "Swiss-Indonesian. In der Schweiz geboren, zwischen zwei Kulturen aufgewachsen, baut an der Schnittstelle von Handwerk und Unternehmertum. " +
    "Mit 14 Mytöffli gegründet (meintoeffli.ch), eine Online-Plattform für die Schweizer Töffli-Szene – vier Jahre geführt, 2023 verkauft/beendet. " +
    "2023, parallel zur Polymechaniker-EFZ-Lehre bei R. Nussbaum AG, Orue Clothing mitgegründet, eine Streetwear-Marke, fast drei Jahre geführt. " +
    "Aktuell in Bali, bewusst zwischen Projekten – Marketing-Praktikum bei Grün Resorts, Leute treffen, kulturübergreifend lernen. " +
    "Die vierjährige Polymechaniker-Ausbildung bei einem der renommiertesten Schweizer Präzisionsbetriebe hat geprägt: Handwerk wird gemessen, nicht vermarktet. " +
    "Diese Haltung überträgt sich auf alles, was als Nächstes kommt.",

  strengthsConfirmedByLehrzeugnis: [
    "Engagiert",
    "Belastbar",
    "Verantwortungsbewusst",
    "Selbstständig",
    "Zeigt Eigeninitiative",
    "Rasche Auffassungsgabe",
    "Kann Prioritäten setzen",
    "Hält Termine ein",
    "Gutes Fachwissen und gute praktische Anwendung",
    "Qualitativ und quantitativ gute Leistungen",
    "Hilfsbereit",
    "Aufgeschlossen",
    "Gute Umgangsformen",
    "Gute Integration in unterschiedliche Teams"
  ],

  // Verbatim quote from the real Lehrzeugnis (R. Nussbaum AG, 17.06.2025) —
  // used as an authentic third-party reference on the digital page. Fixed
  // fact, not AI-generated, so it never drifts between applications.
  referenceQuote: {
    text:
      "Wir kannten Herrn Wyss als engagierten sowie belastbaren Lernenden. Er war verantwortungsbewusst und agierte selbstständig " +
      "wie auch initiativ. Zudem besass er eine rasche Auffassungsgabe, wusste Prioritäten zu setzen und hielt Termine ein.",
    author: "Roland Meier",
    role: "Leiter Berufsbildung Produktion, R. Nussbaum AG",
    source: "Lehrzeugnis, 17. Juni 2025"
  },

  recommendedCoreStrengths: [
    "Technisches Verständnis",
    "Selbstständige Arbeitsweise",
    "Lösungsorientiertes Denken",
    "Schnelle Auffassungsgabe",
    "Verantwortungsbewusstsein",
    "Belastbarkeit",
    "Eigeninitiative",
    "Lernbereitschaft",
    "Teamfähigkeit",
    "Präzises Arbeiten",
    "Anpassungsfähigkeit",
    "Digitale Marketingkanäle",
    "Interkulturelle Kommunikation",
    "Markenbildung und Identität"
  ],

  experience: [
    {
      id: "gruen-resorts",
      org: "Grün Resorts",
      role: "Praktikant Marketing & Brand Positioning",
      period: "Mai 2026 – heute",
      ongoing: true,
      location: "Kuta Utara, Bali, Indonesien (Hybrid)",
      type: "praktikum",
      tags: ["marketing", "social media", "brand", "hospitality", "projektmanagement"],
      bullets: [
        "Interdisziplinäres Praktikum im Grün-Resorts-Team, primär im Bereich Social Media",
        "Mitarbeit an der Repositionierung von Villa Haus Flora, einer 7-Zimmer-Hauptvilla mit 6 angrenzenden Bäumhäusern",
        "Content-Planung und -Umsetzung für Social-Media-Kanäle einer internationalen Hospitality-Marke",
        "Projektmanagement-Aufgaben im interdisziplinären Team",
        "Praxis in digitalen Marketingkanälen im internationalen Ferienimmobilien-Umfeld"
      ]
    },
    {
      id: "orue",
      org: "Orue Clothing",
      role: "Co-Founder",
      period: "Januar 2023 – heute",
      ongoing: true,
      location: "Olten, Schweiz (Hybrid), Verkauf international",
      type: "unternehmen",
      tags: ["unternehmertum", "marketing", "brand", "produktion", "vertrieb", "co-founder"],
      bullets: [
        "Mitaufbau und Führung einer Schweizer Streetwear-Marke gemeinsam mit einem Businesspartner",
        "Entwicklung von Geschäftskonzept, Markenidee und Produktlinie",
        "Small-Batch-Produktion mit eigener, praxisnaher Qualitätskontrolle",
        "Beschaffung und Zusammenarbeit mit Lieferanten",
        "Aufbau und Betreuung der Onlinepräsenz sowie Direktvertrieb an die Community über Instagram (@orue.clothing)",
        "Marketing, Markenkommunikation und Kundenkontakt über Kontinente hinweg",
        "Praktische Erfahrung im Aufbau eines eigenen Produkts von der Idee bis zum Verkauf"
      ]
    },
    {
      id: "nussbaum",
      org: "R. Nussbaum AG, Trimbach",
      role: "Polymechaniker EFZ (Berufslehre)",
      period: "August 2021 – Juli 2025",
      ongoing: false,
      location: "Trimbach, Schweiz",
      type: "lehre",
      tags: ["cnc", "polymechanik", "fertigung", "technik", "qualitaet"],
      abschlussnote: "4.8 (EFZ-Gesamtnote); betriebliche Bewertung R. Nussbaum AG 5.5",
      bullets: [
        "Vierjährige eidgenössische Berufslehre zum Polymechaniker EFZ bei einem der renommiertesten Schweizer Präzisionsbetriebe",
        "Fachlicher Schwerpunkt CNC-Fräsen, zusätzlich CNC-Drehen und konventionelle Fertigung (Drehen, Fräsen, Bohren, Handarbeit)",
        "Programmieren, Bearbeiten und Anpassen von CNC-Programmen; Einrichten von Werkzeugmaschinen",
        "Selbstständige Fertigung von Werkstücken nach technischen Zeichnungen und Vorgaben",
        "Qualitätskontrolle und Messtechnik",
        "Herstellung von Betriebsmitteln im Dreh- und Fräsbereich",
        "Erstellen von CNC-Programmen für Produktionslinien (Linie 1–4)",
        "Mitarbeit im Prototypenbau für das Prüflabor",
        "Praktische Erfahrung mit Heidenhain- und Siemens-Steuerungen, Grundkenntnisse Fanuc, Erfahrung mit DMG-MORI-Werkzeugmaschinen",
        "Grundkenntnisse Siemens NX/CAM (externer Kurs)",
        "Zusatzkurse: Roboterbedienung/-programmierung, Grundlagen Pneumatik",
        "Einblicke in Zentrallager und Giesserei",
        "Vom Lehrzeugnis bestätigt: engagiert, belastbar, verantwortungsbewusst, selbstständig, initiativ, rasche Auffassungsgabe, hält Termine ein, gutes Fachwissen mit guter praktischer Anwendung, qualitativ und quantitativ gute Leistungen"
      ],
      machines: ["Heidenhain", "Siemens", "Fanuc (Grundkenntnisse)", "DMG MORI", "Siemens NX/CAM"]
    },
    {
      id: "bbz",
      org: "BBZ Solothurn-Grenchen",
      role: "Berufsfachschule Polymechaniker EFZ (theoretischer Teil)",
      period: "August 2021 – Juli 2025",
      ongoing: false,
      location: "Solothurn-Grenchen, Schweiz",
      type: "schule",
      tags: ["ausbildung", "technik"],
      note: "Note 4.8. Theoretischer Teil der dualen Berufsausbildung, Fachunterricht Technik, Berufskunde und Allgemeinbildung.",
      bullets: []
    },
    {
      id: "militaer",
      org: "Schweizer Armee",
      role: "Schwerer Aufklärer (Aufklärung)",
      period: "Juni 2025 – November 2025",
      ongoing: false,
      location: "Schweiz",
      type: "militaer",
      tags: ["teamfaehigkeit", "belastbarkeit", "verantwortung", "disziplin"],
      bullets: [
        "Selektioniert für die Aufklärung innerhalb der Schweizer Rekrutenschule – einer von 17 ausgebildeten Schweren Aufklärern",
        "Einsatz unter hohen Anforderungen an Konzentration und Zuverlässigkeit",
        "Verantwortungsbewusste Auftragserfüllung und selbstständiges Handeln innerhalb klar definierter Aufträge",
        "Teamarbeit unter anspruchsvollen, physisch und mental fordernden Bedingungen",
        "Belastbarkeit, Disziplin und Verantwortungsbewusstsein"
      ]
    },
    {
      id: "bali",
      org: "Eigenständiger Auslandsaufenthalt",
      role: "Bali, Indonesien",
      period: "Januar 2026 – September 2026",
      ongoing: true,
      location: "Bali, Indonesien",
      type: "auslandserfahrung",
      tags: ["interkulturell", "eigeninitiative", "netzwerk", "immobilien", "hospitality"],
      bullets: [
        "Mehrmonatiger, selbstständiger Aufenthalt in Bali, Indonesien; eigenständige Organisation des Alltags in einem internationalen Umfeld",
        "Auseinandersetzung mit dem Short-Term-Rental- und Ferienimmobilienmarkt (u.a. Airbnb, Villa-Vermietung, operative Abläufe)",
        "Aufbau eines lokalen und internationalen Netzwerks; Kontakt zu Unternehmern, Eigentümern und Dienstleistern",
        "Prüfung von Geschäftsmöglichkeiten und Kooperationen im Immobilien-/Vermietungsumfeld",
        "Erfahrung mit kulturell unterschiedlichen Geschäfts- und Arbeitsweisen",
        "Stärkung von Selbstständigkeit, Anpassungsfähigkeit und interkultureller Kommunikation"
      ],
      usageNote: "Für technische Bewerbungen kurz halten (zeigt Eigeninitiative), CNC-Schwerpunkt nicht überlagern. Für Marketing-/Hospitality-/Unternehmertum-Bewerbungen ausführlicher nutzen."
    },
    {
      id: "mytoeffli",
      org: "Mytöffli (meintoeffli.ch)",
      role: "Founder",
      period: "Januar 2019 – Juni 2023",
      ongoing: false,
      location: "Olten, Schweiz",
      type: "unternehmen",
      tags: ["unternehmertum", "mechanik", "eigeninitiative", "e-commerce"],
      bullets: [
        "Mit 14 Jahren gegründet: Handel mit und Restaurierung von individuellen Töffli/Mopeds (u.a. Puch, Sachs, Piaggio, Zündapp) für die Schweizer Töffli-Szene",
        "Vier Jahre selbstständig geführt, parallel zu Schule und Lehrbeginn",
        "Sourcing von Ersatzteilen, mechanische Arbeit, Fotografie, Inserate, Preisgestaltung, Kundenvertrauen",
        "Eigenständige Abwicklung von Rechnungsstellung, Steuern und Rückerstattungen",
        "2023 verkauft/beendet, um sich auf Orue Clothing zu fokussieren",
        "Frühe praktische Erfahrung im Aufbau und Betrieb eines eigenen Online-Geschäfts vom Jugendzimmer aus"
      ]
    }
  ],

  education: [
    {
      org: "Sekundarschule E, Kreisschule Mittelgösgen",
      period: "2018 – 2021",
      note: null
    }
  ],

  languages: [
    { name: "Deutsch", level: "Muttersprache" },
    { name: "Bahasa Indonesia", level: "Muttersprache" },
    { name: "Englisch", level: "fliessend / sehr gute Kenntnisse" },
    { name: "Französisch", level: "Grundkenntnisse" }
  ],

  itSkills: [
    "Microsoft Word, Excel, PowerPoint",
    "Sicherer Umgang mit digitalen Arbeitsmitteln & Online-Tools",
    "Sehr guter Umgang mit modernen KI-Tools",
    "CAD/CAM – Grundkenntnisse (u.a. Siemens NX-Kurs)",
    "Self-Directed Learning seit Nov. 2025: KI-Tools, Brand Strategy, No-Code Development"
  ],

  interests: [
    "Technik und Mechanik",
    "Motorräder / Mopeds",
    "Sport (verschiedene Sportarten)",
    "Reisen / internationale Erfahrungen",
    "Unternehmertum"
  ],

  optionalYouthProject: {
    text: "Mit ca. 14 Jahren rund 10 gebrauchte, restaurierungsbedürftige Mopeds gekauft, restauriert und wiederverkauft – eigene Website meintoeffli.ch.",
    usageNote: "Nur verwenden, wenn Platz vorhanden ist oder die Stelle praktisches/mechanisches Eigeninteresse besonders honoriert. Deckt sich mit Mytöffli."
  },

  documentsAvailable: [
    "Lebenslauf (PDF)",
    "Auf die Stelle zugeschnittenes Motivationsschreiben (PDF)",
    "Lehrzeugnis R. Nussbaum AG vom 17.06.2025",
    "Offizielles Fähigkeitszeugnis Polymechaniker EFZ, Kanton Solothurn, vom 31.07.2025"
  ],

  doNotInclude: [
    "Eltern und Geschwister",
    "Spielgruppe und Kindergarten",
    "Primarschule",
    "Alte Schnupperlehren/Berufswahlpraktika aus 2018–2020",
    "Ehemalige Lehrerinnen/Lehrer als Standardreferenzen",
    "Lange Hobbylisten mit Jahresangaben",
    "Übertriebene CAD/CAM-Angaben — nur Grundkenntnisse nennen, nicht als Profi-Kenntnis darstellen"
  ]
};

/**
 * Blank starting point for every NEW account (anyone other than the
 * originally-migrated Raffael account, which keeps DEFAULT_PROFILE above as
 * its real data). Same shape as DEFAULT_PROFILE so nothing downstream
 * (appPage.js, cv.js, cover.js, lib/ai.js) has to special-case "profile not
 * filled in yet" — arrays are simply empty and sections render nothing
 * instead of crashing, until the person fills in their own /profile page.
 */
const EMPTY_PROFILE = {
  accentColor: DEFAULT_ACCENT,

  personal: {
    name: "",
    strasse: "",
    plz: "",
    ort: "",
    land: "Schweiz",
    telefon: "",
    email: "",
    geburtsdatum: "",
    heimatort: "",
    staatsangehoerigkeit: "",
    fuehrerausweis: "",
    verfuegbarkeit: "",
    arbeitsradius: "",
    linkedin: "",
    aktuellerOrt: ""
  },
  links: [],
  clarifications: [],
  headlineOptions: [],
  narrativeSummary: "",
  strengthsConfirmedByLehrzeugnis: [],
  referenceQuote: null,
  recommendedCoreStrengths: [],
  experience: [],
  education: [],
  languages: [],
  itSkills: [],
  interests: [],
  optionalYouthProject: null,
  documentsAvailable: [],
  doNotInclude: []
};

/**
 * Merges the AI-extracted CV facts (lib/ai.js extractProfileFromCv — a
 * narrower shape, see there for why) onto a fresh EMPTY_PROFILE, so the
 * result always has every field the rest of the app expects (appPage.js,
 * cv.js, cover.js, lib/ai.js generation) even though the extraction only
 * ever fills in a subset. Only overwrites a field when the extraction
 * actually produced something — an extraction that found no LinkedIn, say,
 * must not clobber a value the person later typed in manually before saving.
 */
function mergeExtractedProfile(extracted) {
  const base = JSON.parse(JSON.stringify(EMPTY_PROFILE));
  const src = extracted || {};

  if (src.personal && typeof src.personal === "object") {
    Object.keys(base.personal).forEach((key) => {
      if (src.personal[key]) base.personal[key] = String(src.personal[key]);
    });
  }

  if (Array.isArray(src.links)) {
    base.links = src.links
      .filter((l) => l && l.url)
      .map((l) => ({ label: String(l.label || "").slice(0, 60), url: String(l.url).slice(0, 400) }));
  }

  if (src.narrativeSummary) base.narrativeSummary = String(src.narrativeSummary).slice(0, 2000);
  if (Array.isArray(src.recommendedCoreStrengths)) {
    base.recommendedCoreStrengths = src.recommendedCoreStrengths.map((s) => String(s)).filter(Boolean);
  }

  if (Array.isArray(src.experience)) {
    const usedIds = new Set();
    base.experience = src.experience
      .filter((e) => e && (e.org || e.role))
      .map((e, i) => {
        let id = slugify(`${e.org || ""}-${e.role || ""}`) || `erfahrung-${i + 1}`;
        while (usedIds.has(id)) id = `${id}-${i + 1}`;
        usedIds.add(id);
        return {
          id,
          org: e.org || "",
          role: e.role || "",
          period: e.period || "",
          ongoing: Boolean(e.ongoing),
          location: e.location || "",
          type: "sonstiges",
          tags: [],
          bullets: Array.isArray(e.bullets) ? e.bullets.map((b) => String(b)).filter(Boolean) : []
        };
      });
  }

  if (Array.isArray(src.education)) {
    base.education = src.education
      .filter((e) => e && e.org)
      .map((e) => ({ org: e.org, role: e.role || null, period: e.period || null, note: e.note || null }));
  }

  if (Array.isArray(src.languages)) {
    base.languages = src.languages
      .filter((lg) => lg && lg.name)
      .map((lg) => ({ name: String(lg.name), level: String(lg.level || "") }));
  }

  if (Array.isArray(src.itSkills)) base.itSkills = src.itSkills.map((s) => String(s)).filter(Boolean);
  if (Array.isArray(src.interests)) base.interests = src.interests.map((s) => String(s)).filter(Boolean);
  if (base.experience.length) base.documentsAvailable = ["Lebenslauf (PDF)", "Auf die Stelle zugeschnittenes Motivationsschreiben (PDF)"];

  return base;
}

// --- Duplicate-detection helpers for mergeAdditionalExperience -------------
// A supplementary document (a LinkedIn export, an updated CV, ...) almost
// always re-lists positions the profile already has, worded slightly
// differently ("Miteigentümer & Geschäftsführer" vs. "Founder / Board
// Member" for the same company/period). These helpers compare a
// newly-extracted entry against what's already on file so only genuinely
// new positions get appended.

function normalizeMatchKey(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents left over by NFKD (e.g. e + accent -> e)
    .replace(/[.,;:()&/-–—]/g, " ") // punctuation incl. hyphen / en-dash / em-dash
    // common legal-entity suffixes that differ between a CV and a LinkedIn
    // listing for the very same company ("Comtexis AG" vs "Comtexis")
    .replace(/\b(ag|gmbh|ltd|inc|sa|sarl|kg|se|co|corp|corporation|company|group|holding|pt)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// True if the two normalized strings are equal, or one fully contains the
// other (catches "Founder" vs "Founder und CEO", "bonacasa" vs "bonacasa
// österreich", etc.).
function keysOverlap(a, b) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function extractYears(period) {
  const matches = String(period || "").match(/\b(19|20)\d{2}\b/g);
  return matches ? matches.map(Number) : [];
}

function periodsOverlap(periodA, periodB) {
  const yearsA = extractYears(periodA);
  const yearsB = extractYears(periodB);
  if (!yearsA.length || !yearsB.length) return false;
  const startA = Math.min(...yearsA);
  const endA = Math.max(...yearsA);
  const startB = Math.min(...yearsB);
  const endB = Math.max(...yearsB);
  return startA <= endB && startB <= endA;
}

// A candidate is treated as "already known" when it's at (recognizably) the
// same organization AND either the role also matches/overlaps, or the two
// periods overlap — org alone isn't enough (a person can hold genuinely
// different, non-overlapping roles at the same company over the years).
function isDuplicateExperience(candidate, existing) {
  const orgOverlap = keysOverlap(normalizeMatchKey(candidate.org), normalizeMatchKey(existing.org));
  if (!orgOverlap) return false;
  const roleOverlap = keysOverlap(normalizeMatchKey(candidate.role), normalizeMatchKey(existing.role));
  if (roleOverlap) return true;
  return periodsOverlap(candidate.period, existing.period);
}

/**
 * Appends newly-extracted experience/education entries (from a supplementary
 * CV upload — e.g. someone whose original CV import is out of date and just
 * needs to add a role or two) onto an EXISTING profile, without touching any
 * other field (personal data, links, narrative summary, strengths, ...).
 * Unlike mergeExtractedProfile (which replaces the whole profile — used only
 * for the very first CV import), this is additive-only: it never edits or
 * removes an existing entry. It DOES compare each newly-extracted entry
 * against what's already on file (see isDuplicateExperience above) and only
 * appends ones that look genuinely new — recognized duplicates are silently
 * skipped rather than piling up as near-identical repeats. Anything that
 * still slips through differently-worded (or is wrongly skipped) can be
 * fixed up afterwards via the manual experience editor on /profile.
 */
function mergeAdditionalExperience(existingProfile, extracted) {
  const profile = JSON.parse(JSON.stringify(existingProfile || EMPTY_PROFILE));
  const src = extracted || {};
  profile.experience = Array.isArray(profile.experience) ? profile.experience : [];

  const usedIds = new Set(profile.experience.map((e) => e && e.id).filter(Boolean));
  const candidates = Array.isArray(src.experience) ? src.experience.filter((e) => e && (e.org || e.role)) : [];

  // Grows as entries are accepted, so duplicates *within* the same upload
  // (e.g. a heading repeated across a page break) are also caught.
  const knownEntries = profile.experience.slice();
  const added = [];
  let skippedCount = 0;

  candidates.forEach((e, i) => {
    if (knownEntries.some((existing) => isDuplicateExperience(e, existing))) {
      skippedCount++;
      return;
    }
    let id = slugify(`${e.org || ""}-${e.role || ""}`) || `erfahrung-${Date.now()}-${i}`;
    while (usedIds.has(id)) id = `${id}-${i + 1}`;
    usedIds.add(id);
    const entry = {
      id,
      org: e.org || "",
      role: e.role || "",
      period: e.period || "",
      ongoing: Boolean(e.ongoing),
      location: e.location || "",
      type: "sonstiges",
      tags: [],
      bullets: Array.isArray(e.bullets) ? e.bullets.map((b) => String(b)).filter(Boolean) : []
    };
    added.push(entry);
    knownEntries.push(entry);
  });

  profile.experience = [...profile.experience, ...added];

  if (Array.isArray(src.education) && src.education.length) {
    profile.education = Array.isArray(profile.education) ? profile.education : [];
    const knownEdu = profile.education.slice();
    src.education
      .filter((e) => e && e.org)
      .forEach((e) => {
        const isDupe = knownEdu.some((existing) => keysOverlap(normalizeMatchKey(e.org), normalizeMatchKey(existing.org)));
        if (isDupe) return;
        const entry = { org: e.org, role: e.role || null, period: e.period || null, note: e.note || null };
        profile.education.push(entry);
        knownEdu.push(entry);
      });
  }

  return { profile, addedCount: added.length, skippedCount };
}

module.exports = { DEFAULT_PROFILE, EMPTY_PROFILE, mergeExtractedProfile, mergeAdditionalExperience };
