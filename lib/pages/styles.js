const { normalizeAccentColor, accentSoft, accentDark, accentPillText, accentRgb, DEFAULT_ACCENT } = require("../accentColor");

// Shared base CSS for every server-rendered page. Historically a static
// string with a hardcoded accent color — now a factory so each page can pass
// in the account's own customizable accent color (see lib/accentColor.js).
// Pages with no known account/color yet (login, signup, the deactivated
// notice) simply call baseCss() with no argument and get the default accent.
function baseCss(accentColor) {
  const accent = normalizeAccentColor(accentColor);
  const soft = accentSoft(accent);
  const dark = accentDark(accent);
  const pillText = accentPillText(accent);
  const rgb = accentRgb(accent);
  return `
  :root {
    --ink: #14181f;
    --ink-soft: #3a4150;
    --paper: #ffffff;
    --paper-soft: #f6f4f0;
    --accent: ${accent};
    --accent-soft: ${soft};
    --accent-dark: ${dark};
    --accent-rgb: ${rgb};
    --grey: #6b7280;
    --grey-light: #9aa1ad;
    --border: #e7e4de;
    --radius: 14px;
    --shadow: 0 10px 30px -12px rgba(20, 24, 31, 0.18);
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--ink);
    background: var(--paper-soft);
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  .container { max-width: 980px; margin: 0 auto; padding: 0 24px; }
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 14.5px;
    text-decoration: none; border: 1px solid transparent; cursor: pointer;
    transition: transform .15s ease, box-shadow .15s ease, background .15s ease;
    font-family: inherit;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 8px 20px -6px rgba(${rgb},.55); }
  .btn-primary:hover { background: var(--accent-dark); }
  .btn-dark { background: var(--ink); color: #fff; }
  .btn-dark:hover { background: #262c38; }
  .btn-outline { background: transparent; color: var(--ink); border-color: var(--border); }
  .btn-outline:hover { border-color: var(--ink); }
  .btn-ghost { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.35); }
  .btn-ghost:hover { background: rgba(255,255,255,.2); }
  .btn[disabled] { opacity: .55; cursor: not-allowed; }
  .pill {
    display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px;
    font-weight: 600; letter-spacing: .02em; background: var(--accent-soft); color: ${pillText};
  }
  .card {
    background: #fff; border: 1px solid var(--border); border-radius: var(--radius);
    padding: 22px; box-shadow: var(--shadow);
  }
  .section-title {
    font-size: 12.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
    color: var(--grey); margin: 0 0 14px 0;
  }
  .section-title::after {
    content: ''; display: block; width: 34px; height: 3px; background: var(--accent); margin-top: 8px; border-radius: 2px;
  }
  textarea, input[type=text], input[type=url], input[type=password], input[type=email], input[type=tel] {
    width: 100%; font-family: inherit; font-size: 14.5px; padding: 12px 14px;
    border-radius: 10px; border: 1.5px solid var(--border); background: #fff; color: var(--ink);
    resize: vertical; transition: border-color .15s;
  }
  textarea:focus, input:focus { outline: none; border-color: var(--accent); }
  .lang-switcher { display: inline-flex; gap: 2px; }
  .lang-link { font-size: 12px; font-weight: 700; text-decoration: none; color: var(--grey-light); padding: 4px 7px; border-radius: 7px; }
  .lang-link.active { color: var(--ink); background: var(--paper-soft); }
  header.top .lang-link { color: #9aa1ad; }
  header.top .lang-link.active { color: #fff; background: rgba(255,255,255,.14); }
  ::selection { background: var(--accent-soft); }
  @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
}

module.exports = { baseCss, DEFAULT_ACCENT };
