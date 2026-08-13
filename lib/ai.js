const Anthropic = require("@anthropic-ai/sdk");
const { CATEGORY_BY_KEY } = require("./documentLibrary");

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
        enum: ["de", "en"],
        description: "Sprache des Stelleninserats / der Bewerbung."
      },
      jobTitle: { type: "string", description: "Exakter oder sinngemäss übernommener Stellentitel." },
      company: { type: "string", description: "Firmenname laut Inserat. Falls unbekannt: bester Hinweis oder 'Unbekannt'." },
      location: { type: "string", description: "Arbeitsort laut Inserat, falls vorhanden." },
      contactName: {
        type: "string",
        description: "Name der Ansprechperson/HR-Kontakt falls im Inserat genannt, sonst leer lassen."
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
          "Realistische, kalibrierte Einschätzung (0-100) in Prozent, wie gut Raffaels TATSÄCHLICHES Profil (Rohdaten) die Anforderungen DIESES konkreten Stelleninserats erfüllt. Nicht routinemässig hoch ansetzen und nicht schönreden — berücksichtige harte Anforderungen (Ausbildung, Berufserfahrung, geforderte Skills/Zertifikate) genauso wie weiche Faktoren. Ein ehrlicher Wert (auch mal 40-60%) ist nützlicher als ein beschönigter."
      },
      fitScoreReasoning: {
        type: "string",
        description:
          "2-3 kurze, konkrete Sätze: was genau für einen guten Fit spricht (mit Bezug auf Rohdaten) und wo die grössten Lücken oder Unsicherheiten liegen, falls vorhanden. Nüchtern und ehrlich, kein Marketing-Ton — das ist eine interne Einschätzung für Raffael selbst, nicht Teil der Bewerbung."
      }
    }
  }
};

function buildSystemPrompt(profile, libraryDocs = []) {
  const libraryBlock = libraryDocs.length
    ? `\n\nZUSÄTZLICHE NACHWEISE (vom Nutzer separat hochgeladene Dokumente — weitere Zertifikate, Diplome, Referenzschreiben etc., ergänzend zu den Rohdaten oben):\n${libraryDocs
        .map((d, i) => `${i + 1}. [${CATEGORY_LABELS[d.category] || d.category}] "${d.title}"${d.skillsText ? " — " + d.skillsText : ""}`)
        .join("\n")}\nBaue daraus hervorgehende, wahrheitsgetreue Fähigkeiten/Fakten natürlich in summary, selectedStrengths und/oder experienceHighlights ein, WENN sie zur Stelle passen — aber nur dort, wo es die Aussagekraft der Bewerbung tatsächlich erhöht (nicht erzwingen). Erwähne die Dokumente nicht explizit als "hochgeladenes Dokument"; die Dokumente selbst werden dem Empfänger ohnehin automatisch als Download angeboten.`
    : "";

  return `Du bist ein erstklassiger Karriereberater und Werbetexter und hilfst Raffael Putra Wyss, für ein konkretes Stelleninserat eine massgeschneiderte, beeindruckende Bewerbung zu erstellen.

WICHTIGSTE REGEL: Erfinde NIEMALS Fakten, Erfahrungen, Zahlen, Titel oder Daten. Nutze ausschliesslich die folgenden Rohdaten (und ggf. die unten aufgeführten Zusatzdokumente). Du darfst Formulierung, Auswahl, Reihenfolge und Gewichtung frei an die Stelle anpassen, aber jede Aussage muss durch diese Quellen gedeckt sein.

Stil: Selbstbewusst, konkret, ohne Floskeln. Kein generisches Bewerbungs-Blabla ("Hiermit bewerbe ich mich..."). Zeig Verständnis für die ausgeschriebene Stelle und verbinde es glaubwürdig mit Raffaels echtem Werdegang. Ziel: Ein HR-Manager soll denken "diese Bewerbung ist anders, die will ich treffen".

Wähle die Sprache passend zum Stelleninserat (Deutsch als Standard, Englisch falls das Inserat auf Englisch ist).

Zusätzlich zur Bewerbung selbst lieferst du eine interne, ehrliche Fit-Einschätzung (fitScore/fitScoreReasoning) — das ist NICHT Teil der Bewerbung, sondern eine private Kalibrierung für Raffael, wie realistisch seine Chancen auf DIESE Stelle stehen. Sei hier bewusst kritischer und nüchterner als im Bewerbungstext selbst.

ROHDATEN (JSON):
${JSON.stringify(profile, null, 2)}
${libraryBlock}

Verwende KEINE der unter "doNotInclude" gelisteten Punkte. Beachte die "usageNote"-Hinweise bei einzelnen Erfahrungen (z.B. Bali-Erfahrung bei technischen Stellen kurz halten).`;
}

async function generateApplication({ profile, jobPostingText, jobUrl, libraryDocs = [] }) {
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
    system: buildSystemPrompt(profile, libraryDocs),
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

module.exports = { generateApplication, MODEL };
