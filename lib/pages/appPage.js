const { BASE_CSS } = require("./styles");
const { resolveMedia } = require("../media");
const { CATEGORY_BY_KEY } = require("../documentLibrary");
const { buildApplicationMailto } = require("../mailto");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function nl2p(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function linkedinHref(linkedin) {
  const v = String(linkedin || "").trim();
  if (!v) return "";
  return v.startsWith("http") ? v : `https://${v}`;
}

function telHref(tel) {
  const digits = String(tel || "").replace(/[^\d+]/g, "");
  return digits.startsWith("0") ? `+41${digits.slice(1)}` : digits;
}

function renderAppPage({ profile, generated, entry, libraryDocs = [], baseUrl }) {
  const p = profile.personal;
  const g = generated;
  const photo = resolveMedia("photo");
  const quote = profile.referenceQuote;
  const experienceById = Object.fromEntries(profile.experience.map((e) => [e.id, e]));
  const order = Object.keys(g.experienceHighlights || {}).filter((id) => experienceById[id] && id !== "bbz");
  const orderedIds = order.length ? order : profile.experience.filter((e) => e.id !== "bbz").map((e) => e.id);

  const timelineHtml = orderedIds
    .map((id, i) => {
      const exp = experienceById[id];
      if (!exp) return "";
      const highlights = (g.experienceHighlights && g.experienceHighlights[id]) || exp.bullets.slice(0, 3);
      return `
        <div class="tl-item reveal" style="transition-delay:${Math.min(i, 5) * 70}ms">
          <div class="tl-dot"></div>
          <div class="tl-body">
            <div class="tl-head">
              <div>
                <div class="tl-role">${esc(exp.role)}</div>
                <div class="tl-org">${esc(exp.org)} — ${esc(exp.location)}</div>
              </div>
              <div class="tl-period">${esc(exp.period)}</div>
            </div>
            <ul class="tl-bullets">
              ${highlights.map((h) => `<li>${esc(h)}</li>`).join("")}
            </ul>
          </div>
        </div>`;
    })
    .join("");

  const strengthsHtml = (g.selectedStrengths || [])
    .map(
      (s, i) => `
      <div class="strength-card reveal" style="transition-delay:${Math.min(i, 5) * 60}ms">
        <div class="strength-title">${esc(s.title)}</div>
        <div class="strength-why">${esc(s.why)}</div>
      </div>`
    )
    .join("");

  const mailto = buildApplicationMailto({ generated: g, baseUrl, slug: entry.slug });
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.plz} ${p.ort}`)}`;

  const docs = [
    { href: `/pdf/${entry.slug}/cv`, label: "Lebenslauf (PDF)", sub: "Massgeschneidert auf diese Stelle" },
    { href: `/pdf/${entry.slug}/cover`, label: "Motivationsschreiben (PDF)", sub: "Individuell formuliert" },
    { href: "/documents/lehrzeugnis.pdf", label: "Lehrzeugnis R. Nussbaum AG", sub: "17.06.2025" },
    { href: "/documents/efz.pdf", label: "Fähigkeitszeugnis EFZ", sub: "Kanton Solothurn, 31.07.2025" },
    ...libraryDocs.map((d) => ({
      href: `/documents/library/${d.id}`,
      label: d.title,
      sub: (CATEGORY_BY_KEY[d.category] || {}).label || "Dokument"
    }))
  ];

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.name)} — Bewerbung ${g.jobTitle ? "als " + esc(g.jobTitle) : ""}${g.company ? " bei " + esc(g.company) : ""}</title>
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fraunces:ital,wght@0,500;1,500&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  .hero {
    background: radial-gradient(1100px 500px at 15% -10%, #262c3a 0%, var(--ink) 55%), var(--ink);
    color: #fff; padding: 72px 0 96px; position: relative; overflow: hidden;
  }
  .hero::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(500px 300px at 90% 10%, rgba(226,87,43,.35), transparent 70%);
  }
  .hero .container { position: relative; z-index: 1; }
  .hero .pill { background: rgba(226,87,43,.18); color: #ffb090; }
  .hero h1 { font-size: clamp(30px, 5vw, 46px); margin: 18px 0 4px; font-weight: 800; letter-spacing: -0.02em; }
  .hero .headline { color: var(--accent); font-size: clamp(16px, 2.4vw, 20px); font-weight: 700; margin: 0 0 18px; }
  .hero .intro { font-size: 17px; line-height: 1.55; color: #cfd3da; max-width: 640px; }
  .hero .cta-row { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 12px; }
  .hero .contact { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 18px; font-size: 14px; color: #b7bcc6; }
  .hero .contact a { display: inline-flex; align-items: center; gap: 6px; color: inherit; text-decoration: none; border-bottom: 1px solid transparent; transition: color .15s, border-color .15s; }
  .hero .contact a:hover { color: #fff; border-color: rgba(255,255,255,.45); }
  .hero-flex { display: flex; gap: 44px; align-items: center; justify-content: space-between; flex-wrap: wrap-reverse; }
  .hero-text { flex: 1 1 460px; min-width: 0; }
  .hero-photo { flex: none; }
  .hero-photo img { width: 168px; height: 168px; border-radius: 50%; object-fit: cover; border: 4px solid rgba(255,255,255,.12); box-shadow: 0 18px 40px rgba(0,0,0,.35); }
  @media (max-width: 640px) { .hero-photo img { width: 120px; height: 120px; } }

  .sticky-bar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 50;
    background: rgba(20,24,31,.92); backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255,255,255,.08);
    transform: translateY(-100%); transition: transform .25s ease;
  }
  .sticky-bar.show { transform: translateY(0); }
  .sticky-bar .container { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 24px; }
  .sticky-bar .who { color: #fff; font-size: 14px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sticky-bar .who span { color: var(--accent); font-weight: 600; }
  .sticky-bar .actions { display: flex; gap: 8px; flex: none; }
  .sticky-bar .btn { padding: 8px 14px; font-size: 13px; }

  main { margin-top: -50px; position: relative; z-index: 2; }
  section.block { background: #fff; border-radius: 20px; box-shadow: var(--shadow); border: 1px solid var(--border); padding: 36px; margin-bottom: 22px; }
  .profile-text { font-size: 17px; line-height: 1.65; color: var(--ink-soft); font-family: 'Fraunces', Georgia, serif; font-style: italic; }
  .why-card { background: var(--paper-soft); border-radius: 16px; padding: 24px 26px; border-left: 4px solid var(--accent); }
  .why-card p { margin: 0 0 10px; line-height: 1.6; color: var(--ink-soft); }
  .why-card p:last-child { margin-bottom: 0; }
  .strengths-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  .strength-card { border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; background: #fff; transition: transform .15s, box-shadow .15s; }
  .strength-card:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
  .strength-title { font-weight: 700; margin-bottom: 6px; }
  .strength-title::before { content: '✦ '; color: var(--accent); }
  .strength-why { font-size: 13.5px; color: var(--grey); line-height: 1.45; }
  .timeline { position: relative; padding-left: 6px; }
  .tl-item { display: flex; gap: 18px; padding-bottom: 26px; position: relative; }
  .tl-item:last-child { padding-bottom: 0; }
  .tl-item::before { content: ''; position: absolute; left: 5px; top: 18px; bottom: -8px; width: 2px; background: var(--border); }
  .tl-item:last-child::before { display: none; }
  .tl-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); margin-top: 5px; flex: none; box-shadow: 0 0 0 4px var(--accent-soft); }
  .tl-body { flex: 1; }
  .tl-head { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; align-items: baseline; }
  .tl-role { font-weight: 700; font-size: 16px; }
  .tl-org { font-size: 13.5px; color: var(--grey); font-style: italic; margin-top: 2px; }
  .tl-period { font-size: 12.5px; color: var(--grey-light); white-space: nowrap; font-weight: 600; }
  .tl-bullets { margin: 10px 0 0; padding-left: 18px; color: var(--ink-soft); font-size: 14.5px; line-height: 1.55; }
  .tl-bullets li { margin-bottom: 4px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  @media (max-width: 640px) { .two-col { grid-template-columns: 1fr; } }
  .kv-list div { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px dashed var(--border); font-size: 14.5px; }
  .kv-list div:last-child { border-bottom: none; }
  .kv-list b { font-weight: 600; }
  .kv-list span.grey { color: var(--grey); }
  .docs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; }
  .doc-link { display: flex; align-items: center; gap: 12px; border: 1.5px solid var(--border); border-radius: 14px; padding: 14px 16px; text-decoration: none; color: var(--ink); transition: border-color .15s, transform .15s; }
  .doc-link:hover { border-color: var(--accent); transform: translateY(-2px); }
  .doc-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent-soft); display: flex; align-items: center; justify-content: center; font-size: 17px; flex: none; }
  .doc-label { font-weight: 600; font-size: 14px; }
  .doc-sub { font-size: 12px; color: var(--grey); margin-top: 1px; }
  .quote-card { position: relative; padding: 8px 8px 8px 30px; }
  .quote-card::before {
    content: '"'; position: absolute; left: -8px; top: -24px; font-family: 'Fraunces', Georgia, serif;
    font-size: 96px; color: var(--accent-soft); line-height: 1; font-weight: 700;
  }
  .quote-text { position: relative; font-family: 'Fraunces', Georgia, serif; font-style: italic; font-size: 19px; line-height: 1.55; color: var(--ink); }
  .quote-attr { margin-top: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
  .quote-who { font-size: 13.5px; color: var(--grey); }
  .quote-who b { color: var(--ink); font-weight: 700; }
  .quote-link { font-size: 12.5px; color: var(--accent); text-decoration: none; font-weight: 600; white-space: nowrap; }
  .quote-link:hover { text-decoration: underline; }
  .transparency { background: linear-gradient(135deg, #14181f, #262c3a); color: #e7e9ee; border-radius: 20px; padding: 30px 34px; margin-bottom: 22px; }
  .transparency .tag { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #ffb090; margin-bottom: 12px; }
  .transparency p { line-height: 1.6; color: #d6d9e0; margin: 0; font-size: 14.5px; }
  footer { text-align: center; padding: 30px 0 60px; color: var(--grey-light); font-size: 13px; }
  .fade-up { animation: fadeUp .7s ease both; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .reveal { opacity: 0; transform: translateY(18px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.in-view { opacity: 1; transform: translateY(0); }
  @media print {
    .sticky-bar { display: none !important; }
    .hero { background: #fff !important; color: #14181f !important; padding: 20px 0; }
    .hero::after { display: none; }
    .hero .cta-row, .hero .pill { display: none; }
    .hero h1, .hero .headline { color: #14181f !important; }
    .hero .intro, .hero .contact { color: #444 !important; }
    main { margin-top: 0; }
    section.block, .transparency { box-shadow: none !important; border: 1px solid #ddd !important; break-inside: avoid; }
    .transparency { background: #f4f4f4 !important; color: #14181f !important; }
    .strength-card:hover, .doc-link:hover { transform: none; }
  }
</style>
</head>
<body>
  <nav class="sticky-bar" id="stickyBar">
    <div class="container">
      <div class="who">${esc(p.name)} <span>· ${esc(g.jobTitle || "Bewerbung")}</span></div>
      <div class="actions">
        <a class="btn btn-primary" href="/pdf/${entry.slug}/cv" target="_blank" rel="noopener">CV</a>
        <a class="btn btn-primary" href="/pdf/${entry.slug}/cover" target="_blank" rel="noopener">Anschreiben</a>
      </div>
    </div>
  </nav>

  <div class="hero">
    <div class="container">
      <div class="hero-flex fade-up">
        <div class="hero-text">
          <span class="pill">Bewerbung${g.company ? " für " + esc(g.company) : ""}</span>
          <h1>${esc(p.name)}</h1>
          <div class="headline">${esc(g.headline)}${g.jobTitle ? " · " + esc(g.jobTitle) : ""}</div>
          <p class="intro">${esc(g.digitalPageIntro)}</p>
          <div class="cta-row">
            <a class="btn btn-primary" href="/pdf/${entry.slug}/cv" target="_blank" rel="noopener">⬇ Lebenslauf (PDF)</a>
            <a class="btn btn-primary" href="/pdf/${entry.slug}/cover" target="_blank" rel="noopener">⬇ Motivationsschreiben (PDF)</a>
            <a class="btn btn-ghost" href="${esc(mailto)}">✉ Bewerbung per E-Mail senden</a>
          </div>
          ${
            !g.contactEmail
              ? `<div style="font-size:12.5px;color:#9aa0ab;margin-top:10px;">Hinweis: Im Inserat war keine Kontakt-E-Mail zu finden — im E-Mail-Programm bitte den Empfänger manuell eintragen.</div>`
              : ""
          }
          <div class="contact">
            <a href="mailto:${esc(p.email)}">✉ ${esc(p.email)}</a>
            <a href="tel:${esc(telHref(p.telefon))}">☎ ${esc(p.telefon)}</a>
            <a href="${mapsHref}" target="_blank" rel="noopener">📍 ${esc(p.plz)} ${esc(p.ort)}</a>
            <a href="${esc(linkedinHref(p.linkedin))}" target="_blank" rel="noopener">🔗 ${esc(p.linkedin)}</a>
          </div>
        </div>
        ${photo ? `<div class="hero-photo"><img src="/media/photo" alt="${esc(p.name)}"></div>` : ""}
      </div>
    </div>
  </div>

  <main class="container">
    <section class="block reveal">
      <div class="section-title">Profil</div>
      <div class="profile-text">${esc(g.summary)}</div>
    </section>

    <section class="block reveal">
      <div class="section-title">Warum diese Stelle</div>
      <div class="why-card">${nl2p(g.whyThisRole)}</div>
    </section>

    <section class="block reveal">
      <div class="section-title">Kernstärken für diese Stelle</div>
      <div class="strengths-grid">${strengthsHtml}</div>
    </section>

    <section class="block reveal">
      <div class="section-title">Erfahrung</div>
      <div class="timeline">${timelineHtml}</div>
    </section>

    ${
      quote
        ? `
    <section class="block reveal">
      <div class="section-title">Referenzstimme</div>
      <div class="quote-card">
        <div class="quote-text">${esc(quote.text)}</div>
        <div class="quote-attr">
          <div class="quote-who"><b>${esc(quote.author)}</b> — ${esc(quote.role)}</div>
          <a class="quote-link" href="/documents/lehrzeugnis.pdf" target="_blank" rel="noopener">Original-Lehrzeugnis ansehen ↗</a>
        </div>
      </div>
    </section>`
        : ""
    }

    <section class="block reveal">
      <div class="two-col">
        <div>
          <div class="section-title">Sprachen</div>
          <div class="kv-list">
            ${profile.languages.map((l) => `<div><b>${esc(l.name)}</b><span class="grey">${esc(l.level)}</span></div>`).join("")}
          </div>
        </div>
        <div>
          <div class="section-title">Ausbildung &amp; Kenntnisse</div>
          <div class="kv-list">
            <div><b>Polymechaniker EFZ</b><span class="grey">Note 4.8</span></div>
            <div><b>R. Nussbaum AG</b><span class="grey">2021–2025</span></div>
            ${profile.itSkills.slice(0, 3).map((s) => `<div><span>${esc(s)}</span></div>`).join("")}
          </div>
        </div>
      </div>
    </section>

    <section class="block reveal">
      <div class="section-title">Dokumente zum Download</div>
      <div class="docs-grid">
        ${docs
          .map(
            (d) => `
          <a class="doc-link" href="${d.href}" target="_blank" rel="noopener">
            <div class="doc-icon">📄</div>
            <div>
              <div class="doc-label">${esc(d.label)}</div>
              <div class="doc-sub">${esc(d.sub)}</div>
            </div>
          </a>`
          )
          .join("")}
      </div>
    </section>

    <div class="transparency reveal">
      <div class="tag">✦ Transparenz</div>
      <p>
        Diese Bewerbung wurde mit gezielter KI-Unterstützung erstellt und auf diese Stelle zugeschnitten — nicht aus Bequemlichkeit,
        sondern aus Überzeugung: Wer heute die richtigen Tools nutzt, kann schneller, gründlicher und passgenauer arbeiten. Genau diese
        Haltung bringe ich auch in meine Arbeit ein. Alle Fakten in diesem Dossier sind echt und geprüft — ich gehe mit der Zeit, heute
        und morgen.
      </p>
    </div>

    <footer>
      Erstellt am ${esc(new Date(entry.createdAt).toLocaleDateString("de-CH"))} · ${esc(p.name)}
    </footer>
  </main>

  <script>
    // Scroll-triggered reveal: sections & cards animate in as they enter view
    // instead of all firing at once on load.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in-view'));
    }

    // Sticky quick-action bar once the hero has scrolled out of view.
    const heroEl = document.querySelector('.hero');
    const bar = document.getElementById('stickyBar');
    if (heroEl && bar) {
      const toggleBar = () => {
        const past = heroEl.getBoundingClientRect().bottom < 0;
        bar.classList.toggle('show', past);
      };
      window.addEventListener('scroll', toggleBar, { passive: true });
      toggleBar();
    }
  </script>
</body>
</html>`;
}

module.exports = { renderAppPage };
