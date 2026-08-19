const Anthropic = require("@anthropic-ai/sdk");
const { CATEGORY_BY_KEY } = require("./documentLibrary");
const { LANG_NAMES, normalizeLang } = require("./i18n");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
const CATEGORY_LABELS = Object.fromEntries(Object.entries(CATEGORY_BY_KEY).map(([k, v]) => [k, v.label]));

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const err = new Error(
      "ANTHROPIC_API_KEY ist nicht gesetzt. Bitte in den Railway-Variablen hinterlegen."
    );
    err.code = "NO_API_KEY";
    throw err;
  }
  return new Anthropic({ apiKey });
}

/**
 * Anthropic's tool-use output can, on dense/nested array fields, come back
 * with the array JSON-stringified instead of emitted as a real array --
 * confirmed live on Railway for the experience-supplement flow: schema
 * correctly declares `experience: { type: "array", ... }`, the request
 * succeeds (200 OK, ~40s, no truncation), but `toolUse.input.experience` was
 * the STRING "[\n  {\n    \"org\": \"...\"...]" rather than an actual array.
 * Downstream code (mergeAdditionalExperience, profile merge, etc.) does
 * `Array.isArray(...)` checks, so a stringified array silently looked like
 * "the document had no positions" instead of a formatting quirk. This
 * coerces defensively rather than trusting the model's output shape.
 */
function coerceArrayField(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not valid JSON either -- fall through to the empty-array default.
    }
  }
  return [];
}

function sanitizeExtractedArrays(input, fields) {
  const out = Object.assign({}, input);
  fields.forEach((field) => {
    if (field in out) out[field] = coerceArrayField(out[field]);
  });
  return out;
}

const TOOL_SCHEMA = {
  name: "generate_application",
  description:
    "Liefert eine vollständig auf die Stelle zugeschnittene Bewerbung, basierend ausschliesslich auf den bereitgestellten Fakten.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "language",
      "jobTitle",
      "company",
      "headline",
      "summary",
      "selectedStrengths",
      "emailSubject",
      "emailBody",
      "coverLetterBody",
      "experienceHighlights",
      "digitalPageIntro",
      "whyThisRole",
      "fitScore",
      "fitScoreReasoning"
    ],
    properties: {
      language: {
        type: "string",
        enum: ["de", "fr", "en"],
        description: "Sprache, in der diese Bewerbung verfasst wurde (vom Nutzer explizit gewählt, siehe Systemanweisung)."
      },
      jobTitle: { type: "string", description: "Exakter oder sinngemäss übernommener Stellentitel." },
      company: { type: "string", description: "Firmenname laut Inserat. Falls unbekannt: bester Hinweis oder 'Unbekannt'." },
      location: { type: "string", description: "Arbeitsort laut Inserat, falls vorhanden." },
      contactName: {
        type: "string",
        description: "Name der Ansprechperson/HR-Kontakt falls im Inserat genannt, sonst leer lassen."
      },
      contactEmail: {
        type: "string",
        description:
          "E-Mail-Adresse der Ansprechperson/HR-Abteilung, FALLS im Stelleninserat explizit genannt (z.B. bei 'Bewerbungen an ...' oder im Kontaktblock). Leer lassen, wenn im Inserat keine E-Mail-Adresse steht (z.B. bei Online-Bewerbungsportalen ohne direkte Adresse) — NIEMALS eine Adresse erfinden oder raten."
      },
      headline: {
        type: "string",
        description: "Kurzer, punchy Titel/Claim für diese Bewerbung (max. 8 Wörter), z.B. Positionierung auf die Stelle zugeschnitten."
      },
      summary: {
        type: "string",
        description: "Tailored Profil-Zusammenfassung, 50-90 Wörter, 3. oder 1. Person je nach CV-Konvention, ausschliesslich Fakten aus dem Profil."
      },
      selectedStrengths: {
        type: "array",
        minItems: 4,
        maxItems: 6,
        items: {
          type: "object",
          required: ["title", "why"],
          properties: {
            title: { type: "string" },
            why: { type: "string", description: "1 kurzer Satz, warum diese Stärke für DIESE Stelle relevant ist." }
          }
        }
      },
      emailSubject: { type: "string", description: "Betreffzeile für die Bewerbungs-E-Mail." },
      emailBody: {
        type: "string",
        description:
          "Fertiger, kopierbarer E-Mail-Text für die Bewerbung per E-Mail. Kurz (ca. 120-180 Wörter), inkl. Anrede, 2-3 knappe Absätze, Grussformel, Name. Kein Briefkopf/Adresse nötig."
      },
      coverLetterBody: {
        type: "string",
        description:
          "Fliesstext des formellen Motivationsschreibens: beginnt mit der Anrede (z.B. 'Sehr geehrte Frau ...' oder 'Sehr geehrte Damen und Herren') und endet mit dem letzten inhaltlichen Absatz. OHNE Briefkopf/Adresse/Datum/Betreffzeile UND OHNE Schlussformel/Grussformel (z.B. 'Freundliche Grüsse') und ohne Namen — diese werden separat gerendert. Ca. 250-380 Wörter, Absätze getrennt durch doppelten Zeilenumbruch. Ausschliesslich auf Fakten aus dem Profil gestützt."
      },
      experienceHighlights: {
        type: "object",
        description:
          "Map von experience-id (siehe Profil) auf ein Array von 2-4 zugeschnittenen, wahrheitsgetreuen Bullet-Point-Formulierungen für den CV, die für DIESE Stelle relevant sind. Nur ids verwenden, die im Profil vorkommen. Nicht alle Erfahrungen müssen enthalten sein, aber jede enthaltene id soll thematisch zur Stelle passen.",
        additionalProperties: {
          type: "array",
          items: { type: "string" }
        }
      },
      digitalPageIntro: {
        type: "string",
        description: "Kurzer, selbstbewusster Hero-Intro-Satz (1-2 Sätze) für die digitale Bewerbungsseite, auf die Stelle zugeschnitten."
      },
      whyThisRole: {
        type: "string",
        description: "Kurzer Absatz (3-5 Sätze) 'Warum diese Stelle / warum ich', für die digitale Bewerbungsseite."
      },
      fitScore: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "Realistische, kalibrierte Einschätzung (0-100) in Prozent, wie gut das TATSÄCHLICHE Profil (Rohdaten) die Anforderungen DIESES konkreten Stelleninserats erfüllt. Nicht routinemässig hoch ansetzen und nicht schönreden — berücksichtige harte Anforderungen (Ausbildung, Berufserfahrung, geforderte Skills/Zertifikate) genauso wie weiche Faktoren. Ein ehrlicher Wert (auch mal 40-60%) ist nützlicher als ein beschönigter."
      },
      fitScoreReasoning: {
        type: "string",
        description:
          "2-3 kurze, konkrete Sätze: was genau für einen guten Fit spricht (mit Bezug auf Rohdaten) und wo die grössten Lücken oder Unsicherheiten liegen, falls vorhanden. Nüchtern und ehrlich, kein Marketing-Ton — das ist eine interne Einschätzung, nicht Teil der Bewerbung."
      }
    }
  }
};

function buildSystemPrompt(profile, libraryDocs = [], language = "de") {
  const lang = normalizeLang(language);
  const languageName = LANG_NAMES[lang].de; // instructions themselves stay German; only the target language name is looked up
  const libraryBlock = libraryDocs.length
    ? `\n\nZUSÄTZLICHE NACHWEISE (vom Nutzer separat hochgeladene Dokumente — weitere Zertifikate, Diplome, Referenzschreiben etc., ergänzend zu den Rohdaten oben):\n${libraryDocs
        .map((d, i) => `${i + 1}. [${CATEGORY_LABELS[d.category] || d.category}] "${d.title}"${d.skillsText ? " — " + d.skillsText : ""}`)
        .join("\n")}\nBaue daraus hervorgehende, wahrheitsgetreue Fähigkeiten/Fakten natürlich in summary, selectedStrengths und/oder experienceHighlights ein, WENN sie zur Stelle passen — aber nur dort, wo es die Aussagekraft der Bewerbung tatsächlich erhöht (nicht erzwingen). Erwähne die Dokumente nicht explizit als "hochgeladenes Dokument"; die Dokumente selbst werden dem Empfänger ohnehin automatisch als Download angeboten.`
    : "";

  const clarificationsBlock =
    profile && Array.isArray(profile.clarifications) && profile.clarifications.length
      ? `\n\nBESONDERHEITEN IM WERDEGANG (vom Nutzer selbst erklärt, z.B. Lücken oder Unstimmigkeiten im CV):\n${profile.clarifications
          .map((c, i) => `${i + 1}. ${c.description} — Erklärung: ${c.explanation}`)
          .join("\n")}\nDiese Erklärungen darfst du, wenn es zur Stelle passt, kurz und natürlich einfliessen lassen (z.B. ein Halbsatz im Anschreiben) — aber nur wenn es die Bewerbung glaubwürdiger/runder macht, nicht erzwingen und nicht breittreten.`
      : "";

  const name = (profile && profile.personal && profile.personal.name) || "die Person";

  return `Du bist ein erstklassiger Karriereberater und Werbetexter und hilfst ${name}, für ein konkretes Stelleninserat eine massgeschneiderte, beeindruckende Bewerbung zu erstellen.

WICHTIGSTE REGEL: Erfinde NIEMALS Fakten, Erfahrungen, Zahlen, Titel oder Daten. Nutze ausschliesslich die folgenden Rohdaten (und ggf. die unten aufgeführten Zusatzdokumente). Du darfst Formulierung, Auswahl, Reihenfolge und Gewichtung frei an die Stelle anpassen, aber jede Aussage muss durch diese Quellen gedeckt sein.

Stil: Selbstbewusst, konkret, ohne Floskeln. Kein generisches Bewerbungs-Blabla ("Hiermit bewerbe ich mich..."). Zeig Verständnis für die ausgeschriebene Stelle und verbinde es glaubwürdig mit dem echten Werdegang der Person. Ziel: Ein HR-Manager soll denken "diese Bewerbung ist anders, die will ich treffen".

WICHTIG — Sprache: Verfasse die GESAMTE Bewerbung (Anschreiben, E-Mail, Zusammenfassung, digitalPageIntro, whyThisRole, alle Texte) ausschliesslich auf ${languageName}, unabhängig davon, in welcher Sprache das Stelleninserat selbst verfasst ist. Setze das Feld "language" im Tool-Call entsprechend auf "${lang}". Eigennamen (Firmenname, Personennamen, Ortsnamen) bleiben unverändert.

Zusätzlich zur Bewerbung selbst lieferst du eine interne, ehrliche Fit-Einschätzung (fitScore/fitScoreReasoning) — das ist NICHT Teil der Bewerbung, sondern eine private Kalibrierung, wie realistisch die Chancen auf DIESE Stelle stehen. Sei hier bewusst kritischer und nüchterner als im Bewerbungstext selbst.

ROHDATEN (JSON):
${JSON.stringify(profile, null, 2)}
${libraryBlock}
${clarificationsBlock}

Verwende KEINE der unter "doNotInclude" gelisteten Punkte. Beachte die "usageNote"-Hinweise bei einzelnen Erfahrungen (z.B. Bali-Erfahrung bei technischen Stellen kurz halten).`;
}

async function generateApplication({ profile, jobPostingText, jobUrl, libraryDocs = [], language = "de" }) {
  const client = getClient();

  const userContent = [
    jobUrl ? `Link zum Stelleninserat: ${jobUrl}` : null,
    "Stelleninserat (Text):",
    "---",
    jobPostingText,
    "---",
    "Erstelle jetzt die massgeschneiderte Bewerbung über den generate_application-Tool-Call."
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: buildSystemPrompt(profile, libraryDocs, language),
    tools: [TOOL_SCHEMA],
    tool_choice: { type: "tool", name: "generate_application" },
    messages: [{ role: "user", content: userContent }]
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) {
    throw new Error("Die KI hat keine strukturierte Antwort geliefert. Bitte erneut versuchen.");
  }
  return toolUse.input;
}

// ---------------------------------------------------------------------
// CV import: extracts the raw-profile facts (lib/profile.js shape) out of
// an uploaded/pasted CV, so a new account isn't starting from a completely
// blank profile. Deliberately narrower than the full profile shape — fields
// like referenceQuote/strengthsConfirmedByLehrzeugnis/optionalYouthProject
// are tied to a specific reference document (a Lehrzeugnis quote, in
// Raffael's case) that a generic CV import has no equivalent for; those
// stay empty and can be added manually later via /profile if relevant.
function buildExtractSchema(uiLangName) {
  return {
  name: "extract_profile",
  description:
    "Extrahiert strukturierte Rohdaten-Fakten aus einem Lebenslauf-Text, ausschliesslich basierend auf dem bereitgestellten Text.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["personal", "experience", "education", "languages", "itSkills"],
    properties: {
      personal: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          strasse: { type: "string" },
          plz: { type: "string" },
          ort: { type: "string" },
          land: { type: "string" },
          telefon: { type: "string" },
          email: { type: "string" },
          geburtsdatum: { type: "string", description: "Falls im CV genannt, sonst leer lassen." },
          heimatort: { type: "string" },
          staatsangehoerigkeit: { type: "string" },
          fuehrerausweis: { type: "string" },
          linkedin: { type: "string", description: "LinkedIn-Profil-URL oder -Handle, falls im CV genannt, sonst leer lassen." }
        }
      },
      links: {
        type: "array",
        description: "Weitere im CV genannte Links (Portfolio, GitHub, persönliche Website, Behance etc.) — NICHT LinkedIn (das steht in personal.linkedin).",
        items: {
          type: "object",
          required: ["label", "url"],
          properties: { label: { type: "string" }, url: { type: "string" } }
        }
      },
      narrativeSummary: {
        type: "string",
        description: "2-4 Sätze zusammenfassendes Profil, ausschliesslich basierend auf dem CV-Inhalt (z.B. aus einem vorhandenen Profil-/Summary-Abschnitt destilliert oder aus dem Werdegang abgeleitet). Leer lassen, falls nicht sinnvoll ableitbar."
      },
      recommendedCoreStrengths: {
        type: "array",
        items: { type: "string" },
        description: "Kernkompetenzen/Stärken, die klar aus dem CV hervorgehen (z.B. explizit gelistete Skills oder klar wiederkehrende Fähigkeiten). Nichts erfinden."
      },
      experience: {
        type: "array",
        description: "Berufserfahrung, Praktika, eigene Unternehmen/Projekte — chronologisch wie im CV.",
        items: {
          type: "object",
          required: ["org", "role"],
          properties: {
            org: { type: "string" },
            role: { type: "string" },
            period: { type: "string", description: "z.B. 'Januar 2022 – heute' oder 'Juni 2021 – Juli 2023', wie im CV angegeben." },
            ongoing: { type: "boolean" },
            location: { type: "string" },
            bullets: { type: "array", items: { type: "string" }, description: "Stichpunkte/Aufgaben/Erfolge, wortnah aus dem CV übernommen." }
          }
        }
      },
      education: {
        type: "array",
        items: {
          type: "object",
          required: ["org"],
          properties: {
            org: { type: "string" },
            role: { type: "string", description: "Abschluss/Ausbildungsbezeichnung, falls vorhanden." },
            period: { type: "string" },
            note: { type: "string", description: "Note/Abschluss-Details, falls im CV genannt." }
          }
        }
      },
      languages: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "level"],
          properties: { name: { type: "string" }, level: { type: "string" } }
        }
      },
      itSkills: {
        type: "array",
        items: { type: "string" },
        description: "IT-/Software-/Tool-Kenntnisse, wie im CV gelistet."
      },
      interests: {
        type: "array",
        items: { type: "string" },
        description: "Hobbys/Interessen, falls im CV ein entsprechender Abschnitt vorhanden ist."
      },
      detectedIssues: {
        type: "array",
        description:
          "Erkannte Unstimmigkeiten im Lebenslauf: Lücken im Werdegang (ca. 3+ Monate unerklärt zwischen zwei Perioden), sich widersprechende oder überlappende Datumsangaben, oder auffällig fehlende typische Angaben (z.B. gar keine Kontaktdaten). Nur tatsächlich auffällige Punkte melden, nicht jede kleine Lücke oder Kleinigkeit. Leeres Array, wenn nichts Auffälliges gefunden wird.",
        items: {
          type: "object",
          required: ["id", "type", "description"],
          properties: {
            id: { type: "string", description: "Kurzer, stabiler Slug für diesen Punkt, z.B. 'gap-2023-2024'." },
            type: { type: "string", enum: ["gap", "missing", "contradiction"] },
            description: {
              type: "string",
              description: `Kurze, freundliche, konkrete Beschreibung des Punkts, geschrieben auf ${uiLangName} (unabhängig von der Sprache des restlichen CVs) — z.B. 'Lücke zwischen Juli 2022 und März 2023 (ca. 8 Monate) zwischen Praktikum bei X und Studium bei Y.' Diese Beschreibung wird direkt im UI angezeigt.`
            }
          }
        }
      }
    }
  }
  };
}

/**
 * Extracts raw-profile facts from CV text (already plain-text extracted from
 * a PDF/DOCX upload, or pasted directly by the user). WICHTIGSTE REGEL, same
 * as generateApplication: never invent facts not present in the source text.
 * Returns a plain object matching (a subset of) the lib/profile.js shape —
 * callers are expected to merge it onto EMPTY_PROFILE so every field the
 * rest of the app expects still exists, just possibly empty.
 */
async function extractProfileFromCv({ cvText, uiLang = "de" }) {
  const client = getClient();
  const lang = normalizeLang(uiLang);
  const uiLangName = LANG_NAMES[lang].de;
  const system = `Du extrahierst strukturierte Lebenslauf-Fakten aus rohem CV-Text, um ein Bewerbungsprofil vorzubefüllen.

WICHTIGSTE REGEL: Erfinde NICHTS. Übernimm ausschliesslich Informationen, die tatsächlich im bereitgestellten Text stehen. Bei Unsicherheit oder fehlenden Angaben: das jeweilige Feld leer lassen (bzw. leeres Array), NIEMALS raten oder plausibel wirkende Werte ergänzen. Übersetze nichts — übernimm Texte in der Sprache, in der sie im CV stehen. AUSNAHME: Die Beschreibungstexte im Feld "detectedIssues[].description" sollen auf ${uiLangName} verfasst werden, da sie direkt im UI der Person angezeigt werden — das betrifft NUR diese Beschreibungstexte, nicht die extrahierten Profildaten selbst.

Prüfe den Lebenslauf zusätzlich auf Unstimmigkeiten (Lücken im Werdegang, sich widersprechende/überlappende Datumsangaben, auffällig fehlende typische Angaben) und melde diese im Feld "detectedIssues" — aber nur wirklich auffällige Punkte, nicht jede Kleinigkeit.`;

  const response = await client.messages.create({
    model: MODEL,
    // Dense source documents (e.g. a LinkedIn "Erfahrung" export with a dozen-plus,
    // partly-overlapping positions plus bullets) can genuinely need more than the
    // 4000 tokens used elsewhere in this file — if generation gets cut off mid-JSON,
    // fields ordered late in the schema (like "experience") can end up empty even
    // though the request otherwise "succeeds". 8000 gives real headroom.
    max_tokens: 8000,
    system,
    tools: [buildExtractSchema(uiLangName)],
    tool_choice: { type: "tool", name: "extract_profile" },
    messages: [
      {
        role: "user",
        content: `CV-Text:\n---\n${String(cvText || "").slice(0, 20000)}\n---\n\nBitte jetzt extrahieren.`
      }
    ]
  });

  if (response.stop_reason === "max_tokens") {
    const err = new Error(
      "Die Analyse wurde wegen der Dokumentlänge abgeschnitten, bevor sie fertig war (zu viele Positionen/Details auf einmal). Bitte das Dokument in kleineren Teilen hochladen oder den relevanten Text direkt einfügen."
    );
    err.code = "TRUNCATED";
    throw err;
  }

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) {
    throw new Error("Die KI hat keine strukturierte Antwort geliefert. Bitte erneut versuchen.");
  }
  return sanitizeExtractedArrays(toolUse.input, [
    "links",
    "recommendedCoreStrengths",
    "experience",
    "education",
    "languages",
    "itSkills",
    "interests",
    "detectedIssues"
  ]);
}

// Narrow schema for the "supplementary CV/LinkedIn upload" flow (POST
// /api/profile/experience/import). That flow's merge logic
// (mergeAdditionalExperience in lib/profile.js) only ever reads
// extracted.experience / extracted.education -- it ignores personal info,
// narrativeSummary, recommendedCoreStrengths, languages, itSkills, interests
// and detectedIssues entirely. Asking extractProfileFromCv's full schema for
// all of that anyway was wasteful AND risky: a dense source document (a
// LinkedIn "Erfahrung" export with a dozen-plus overlapping positions) gives
// the model a lot of unrelated work to do first (personal info, a narrative
// summary, gap/contradiction detection across the whole document), which
// measured ~58s for one real request and came back with a genuinely empty
// "experience" array even though the position data was plainly present in
// the source text -- no truncation, no error, just an empty result after a
// long, unfocused generation. This schema asks for exactly what's used.
function buildExperienceOnlySchema() {
  return {
    name: "extract_experience_supplement",
    description:
      "Extrahiert ausschliesslich Berufserfahrung und Ausbildung aus einem CV-/LinkedIn-Text, ausschliesslich basierend auf dem bereitgestellten Text.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      required: ["experience", "education"],
      properties: {
        experience: {
          type: "array",
          description: "Berufserfahrung, Praktika, eigene Unternehmen/Projekte — chronologisch wie im Text. Leeres Array, falls wirklich keine Positionen im Text stehen.",
          items: {
            type: "object",
            required: ["org", "role"],
            properties: {
              org: { type: "string" },
              role: { type: "string" },
              period: { type: "string", description: "z.B. 'Januar 2022 – heute' oder 'Juni 2021 – Juli 2023', wie im Text angegeben." },
              ongoing: { type: "boolean" },
              location: { type: "string" },
              bullets: { type: "array", items: { type: "string" }, description: "Stichpunkte/Aufgaben/Erfolge, wortnah aus dem Text übernommen." }
            }
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            required: ["org"],
            properties: {
              org: { type: "string" },
              role: { type: "string", description: "Abschluss/Ausbildungsbezeichnung, falls vorhanden." },
              period: { type: "string" },
              note: { type: "string", description: "Note/Abschluss-Details, falls im Text genannt." }
            }
          }
        }
      }
    }
  };
}

/**
 * Leaner counterpart to extractProfileFromCv, used only by the "upload a
 * supplementary CV/LinkedIn export" flow (see buildExperienceOnlySchema
 * above for why this exists as a separate, narrower call rather than reusing
 * the full extraction).
 */
async function extractExperienceSupplementOnce({ cvText }) {
  const client = getClient();
  const system = `Du extrahierst Berufserfahrung und Ausbildung aus rohem CV-/LinkedIn-Text, um ein bestehendes Bewerbungsprofil zu ergänzen.

WICHTIGSTE REGEL: Erfinde NICHTS. Übernimm ausschliesslich Informationen, die tatsächlich im bereitgestellten Text stehen. Bei Unsicherheit oder fehlenden Angaben: das jeweilige Feld leer lassen (bzw. leeres Array), NIEMALS raten. Übersetze nichts — übernimm Texte in der Sprache, in der sie im Text stehen. Gib jede im Text erkennbare Position einzeln aus, auch wenn mehrere Positionen zur gleichen Firma gehören (z.B. mehrere LinkedIn-Einträge für verwandte Rollen) — nicht zusammenfassen.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system,
    tools: [buildExperienceOnlySchema()],
    tool_choice: { type: "tool", name: "extract_experience_supplement" },
    messages: [
      {
        role: "user",
        content: `Text:\n---\n${String(cvText || "").slice(0, 20000)}\n---\n\nBitte jetzt Berufserfahrung und Ausbildung extrahieren.`
      }
    ]
  });

  if (response.stop_reason === "max_tokens") {
    const err = new Error(
      "Die Analyse wurde wegen der Dokumentlänge abgeschnitten, bevor sie fertig war (zu viele Positionen/Details auf einmal). Bitte das Dokument in kleineren Teilen hochladen oder den relevanten Text direkt einfügen."
    );
    err.code = "TRUNCATED";
    throw err;
  }

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) {
    throw new Error("Die KI hat keine strukturierte Antwort geliefert. Bitte erneut versuchen.");
  }
  return sanitizeExtractedArrays(toolUse.input, ["experience", "education"]);
}

/**
 * Wraps extractExperienceSupplementOnce with a single automatic retry when
 * the first attempt comes back with BOTH arrays genuinely empty. Confirmed
 * live in production: on the exact same dense LinkedIn document, with the
 * exact same code, consecutive calls alternated between correctly returning
 * ~8 real positions and returning a fully empty (but well-formed, non-array
 * -coercion-related) result -- plain model output non-determinism on this
 * kind of document, not a bug in the extraction/parsing code. A single retry
 * costs one extra ~20-40s round trip only in the empty case, and
 * substantially cuts how often a genuinely-non-empty document surfaces the
 * scary "nothing could be read" error to the user.
 */
async function extractExperienceSupplement({ cvText, uiLang = "de" }) {
  const first = await extractExperienceSupplementOnce({ cvText, uiLang });
  if (first.experience.length === 0 && first.education.length === 0) {
    return extractExperienceSupplementOnce({ cvText, uiLang });
  }
  return first;
}

module.exports = { generateApplication, extractProfileFromCv, extractExperienceSupplement, MODEL };
