# Bewerbungs-Generator — Raffael Putra Wyss

Für jedes Stelleninserat auf Knopfdruck:

- ein kopierbarer **E-Mail-Anschreiben-Text**
- ein massgeschneidertes **Motivationsschreiben als PDF**
- ein passender **CV als PDF**
- eine **digitale Bewerbungsseite** mit eigener URL (`/a/<slug>`), inkl. Download von Lehrzeugnis & EFZ

Alles basiert ausschliesslich auf echten, hinterlegten Fakten (`lib/profile.js`, editierbar unter `/profile`) — die KI wählt und formuliert pro Stelle, erfindet aber nichts dazu.

## Nutzung

1. `/` öffnen, Stelleninserat als Text einfügen (oder Link, sofern öffentlich ohne Login abrufbar — bei LinkedIn & Co. lieber den Text kopieren).
2. „Bewerbung generieren" klicken (dauert ca. 15–30 Sek.).
3. E-Mail-Text kopieren, PDFs herunterladen, oder die digitale Bewerbungsseite direkt verlinken.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env   # ANTHROPIC_API_KEY eintragen
npm start
```

## Umgebungsvariablen

| Variable | Pflicht | Beschreibung |
|---|---|---|
| `ANTHROPIC_API_KEY` | ja | Claude-API-Key für die Generierung |
| `APP_PASSWORD` | nein | Schützt `/`, `/profile` und die Generierung per HTTP-Basic-Auth. Digitale Bewerbungsseiten & Downloads bleiben immer öffentlich. |
| `ANTHROPIC_MODEL` | nein | Standard: `claude-sonnet-4-5-20250929` |
| `DATA_DIR` | nein | Speicherort der JSON-"Datenbank". Auf Railway ein Volume mounten (z.B. `/data`), sonst gehen bisherige Bewerbungen bei jedem Redeploy verloren. |

## Deployment (Railway)

Das Projekt ist ein einfacher Node/Express-Server, keine Build-Schritte nötig (Nixpacks erkennt `npm start` automatisch). PDF-Erzeugung läuft über `pdfmake` (reines JS, kein Headless-Browser nötig).

**Wichtig:** Ein Railway-Volume auf `/data` mounten und `DATA_DIR=/data` setzen, damit generierte Bewerbungen und Profil-Änderungen einen Redeploy überleben.

## Struktur

```
server.js              Express-Routen
lib/profile.js         Rohdaten (Fakten) von Raffael
lib/ai.js              Anthropic-Aufruf, Prompt & Output-Schema
lib/fetchJob.js         Best-effort Job-URL → Text
lib/store.js            JSON-Persistenz (Bewerbungen + editierbares Profil)
lib/pdf/                CV- & Anschreiben-PDF-Layout (pdfmake)
lib/pages/              HTML-Seiten (Tool-UI, digitale Bewerbungsseite, Profil-Editor)
assets/documents/       Lehrzeugnis & EFZ (PDF), zum Download auf jeder Bewerbungsseite
```
