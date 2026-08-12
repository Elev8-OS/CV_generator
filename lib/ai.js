const Anthropic = require("@anthropic-ai/sdk");

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

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
      "whyThisRole"
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
          "Vollständiger Fliesstext des formellen Motivationsschreibens (ohne Briefkopf/Adresse/Datum/Betreffzeile, diese werden separat gerendert). Anrede bis Schlussformel vor der Unterschrift. Ca. 250-380 Wörter, Absätze getrennt durch doppelten Zeilenumbruch. Ausschliesslich auf Fakten aus dem Profil gestützt."
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
      }
    }
  }
};

function buildSystemPrompt(profile) {
  return `Du bist ein erstklassiger Karriereberater und Werbetexter und hilfst Raffael Putra Wyss, für ein konkretes Stelleninserat eine massgeschneiderte, beeindruckende Bewerbung zu erstellen.

WICHTIGSTE REGEL: Erfinde NIEMALS Fakten, Erfahrungen, Zahlen, Titel oder Daten. Nutze ausschliesslich die folgenden Rohdaten. Du darfst Formulierung, Auswahl, Reihenfolge und Gewichtung frei an die Stelle anpassen, aber jede Aussage muss durch die Rohdaten gedeckt sein.

Stil: Selbstbewusst, konkret, ohne Floskeln. Kein generisches Bewerbungs-Blabla ("Hiermit bewerbe ich mich..."). Zeig Verständnis für die ausgeschriebene Stelle und verbinde es glaubwürdig mit Raffaels echtem Werdegang. Ziel: Ein HR-Manager soll denken "diese Bewerbung ist anders, die will ich treffen".

Wähle die Sprache passend zum Stelleninserat (Deutsch als Standard, Englisch falls das Inserat auf Englisch ist).

ROHDATEN (JSON):
${JSON.stringify(profile, null, 2)}

Verwende KEINE der unter "doNotInclude" gelisteten Punkte. Beachte die "usageNote"-Hinweise bei einzelnen Erfahrungen (z.B. Bali-Erfahrung bei technischen Stellen kurz halten).`;
}

async function generateApplication({ profile, jobPostingText, jobUrl }) {
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
    system: buildSystemPrompt(profile),
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
