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

const DELIVER_SCHEMA = {
  name: "deliver_insights",
  description:
    "Liefert ein strukturiertes Interview-Vorbereitungs-Briefing, ausschliesslich basierend auf dem bereitgestellten Recherchetext.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["companyOverview", "productsServices", "recentNews", "likelyTopics", "suggestedQuestions"],
    properties: {
      companyOverview: {
        type: "string",
        description:
          "2-4 Sätze: Branche, ungefähre Grösse, Hauptsitz/Standorte, was die Firma macht. Nur Fakten aus dem Recherchetext übernehmen. Falls der Recherchetext kaum etwas hergibt, das ehrlich so schreiben (z.B. 'Zu dieser Firma wurden online nur wenige Informationen gefunden.') statt zu raten."
      },
      productsServices: {
        type: "string",
        description: "2-3 Sätze zu den wichtigsten Produkten/Dienstleistungen/Märkten der Firma, ausschliesslich laut Recherchetext."
      },
      recentNews: {
        type: "array",
        items: { type: "string" },
        description:
          "0-3 kurze, konkrete Stichpunkte zu aktuellen Entwicklungen/News der Firma aus dem Recherchetext (z.B. Expansion, neue Produkte, Auszeichnungen, Stellenabbau). Leeres Array, falls der Recherchetext dazu nichts Verlässliches hergibt — nichts erfinden oder verallgemeinern."
      },
      likelyTopics: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 4,
        description:
          "2-4 wahrscheinliche Gesprächsthemen für DIESES konkrete Vorstellungsgespräch, hergeleitet aus einer Kombination von recherchiertem Firmenprofil und Stelleninserat. Das darf sinnvolle fachliche Einschätzung/Erfahrungswissen sein (kein erfundenes Firmenfaktum)."
      },
      suggestedQuestions: {
        type: "array",
        items: { type: "string" },
        minItems: 2,
        maxItems: 3,
        description: "2-3 kluge, konkrete Fragen, die Raffael der Firma im Gespräch stellen kann — bezogen auf recherchierte Fakten und/oder die Stelle."
      }
    }
  }
};

// Step 1: let Claude actually search the web for the specific company — this
// is the whole point vs. just asking the model from memory, since smaller
// Swiss SMEs (REGO-FIX AG, Habasit AG, etc.) are exactly the kind of company
// a language model is likely to know little or nothing reliable about.
async function researchCompany({ client, company, jobTitle, jobPostingText }) {
  const system = `Du bist ein sorgfältiger Recherche-Assistent. Recherchiere die Firma "${company}" im Web, um jemandem bei der Vorbereitung auf ein Vorstellungsgespräch für die Stelle "${jobTitle}" zu helfen.

WICHTIGSTE REGEL: Nutze ausschliesslich Informationen, die du per Websuche findest. Erfinde NICHTS. Wenn du zu einem Punkt (z.B. aktuelle News) nichts Verlässliches findest, schreibe das explizit so ("keine aktuellen News gefunden" o.ä.) statt zu raten oder zu verallgemeinern. Bei mehreren Firmen mit ähnlichem Namen: bevorzuge die Schweizer Firma, die zur Branche des Stelleninserats passt.

Decke ab, sofern auffindbar: Branche/Tätigkeit, ungefähre Grösse & Standort(e), wichtigste Produkte/Dienstleistungen, aktuelle News/Entwicklungen (letzte ca. 12 Monate). Schreibe in normalem Fliesstext auf Deutsch.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
    messages: [
      {
        role: "user",
        content: `Firma: ${company}\nStelle: ${jobTitle}\n\nStelleninserat (Auszug):\n${String(jobPostingText || "").slice(0, 2000)}\n\nBitte recherchiere jetzt.`
      }
    ]
  });

  const textBlocks = response.content.filter((c) => c.type === "text");
  const researchText = textBlocks.map((b) => b.text).join("\n\n");

  // Prefer actual citations attached to the final answer (what the model
  // really relied on); fall back to the raw search-result list only if the
  // model didn't attach citations, so the Sources section still isn't empty.
  const sources = [];
  const seen = new Set();
  for (const block of textBlocks) {
    for (const citation of block.citations || []) {
      if (citation.url && !seen.has(citation.url)) {
        seen.add(citation.url);
        sources.push({ url: citation.url, title: citation.title || citation.url });
      }
    }
  }
  if (!sources.length) {
    for (const block of response.content) {
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const r of block.content) {
          if (r.url && !seen.has(r.url)) {
            seen.add(r.url);
            sources.push({ url: r.url, title: r.title || r.url });
          }
        }
      }
    }
  }

  return { researchText, sources };
}

// Step 2: purely reorganizes the already-researched text into a fixed shape
// for the PDF — no new tool, no new web access, so it can't introduce facts
// that weren't already in the (cited) research text from step 1.
async function structureInsights({ client, researchText, jobTitle, jobPostingText }) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1200,
    system:
      "Du strukturierst einen bereits recherchierten Text in ein festes Format. Füge KEINE neuen Fakten über die Firma hinzu, die nicht im Recherchetext stehen — nur bei likelyTopics/suggestedQuestions darfst du sinnvolle Ableitungen/Empfehlungen basierend auf Stelle + Firmenprofil ergänzen.",
    tools: [DELIVER_SCHEMA],
    tool_choice: { type: "tool", name: "deliver_insights" },
    messages: [
      {
        role: "user",
        content: `Stelle: ${jobTitle}\n\nStelleninserat (Auszug):\n${String(jobPostingText || "").slice(0, 1500)}\n\nRecherchetext über die Firma:\n---\n${researchText || "(Keine verwertbaren Informationen gefunden.)"}\n---`
      }
    ]
  });
  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) {
    throw new Error("Die KI hat keine strukturierte Antwort geliefert. Bitte erneut versuchen.");
  }
  return toolUse.input;
}

async function generateCompanyInsights({ company, jobTitle, jobPostingText }) {
  const client = getClient();
  const { researchText, sources } = await researchCompany({ client, company, jobTitle, jobPostingText });
  const structured = await structureInsights({ client, researchText, jobTitle, jobPostingText });
  return {
    ...structured,
    sources,
    generatedAt: new Date().toISOString()
  };
}

module.exports = { generateCompanyInsights };
