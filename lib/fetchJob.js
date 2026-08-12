const cheerio = require("cheerio");

/**
 * Best-effort fetch + text extraction of a job posting URL.
 * Many job boards (LinkedIn etc.) block server-side fetches or require login -
 * in that case we throw and the frontend asks the user to paste the text instead.
 */
async function fetchJobPostingText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  let res;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml"
      }
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    throw new Error(`Seite konnte nicht geladen werden (Status ${res.status}).`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html") && !contentType.includes("text")) {
    throw new Error("Die URL liefert keinen lesbaren HTML-Inhalt.");
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, iframe, header nav, footer nav").remove();

  let text = $("body").text();
  text = text.replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim();

  if (text.length < 200) {
    throw new Error(
      "Konnte auf dieser Seite kaum Text finden (evtl. Login-geschützt oder JavaScript-Rendering). Bitte den Inserat-Text stattdessen einfügen."
    );
  }

  // Cap length to keep prompts reasonable.
  return text.slice(0, 15000);
}

module.exports = { fetchJobPostingText };
