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

const DEFAULT_PROFILE = {
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

module.exports = { DEFAULT_PROFILE, EMPTY_PROFILE };
