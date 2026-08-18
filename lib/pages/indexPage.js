const { BASE_CSS } = require("./styles");
const { buildApplicationMailto } = require("../mailto");
const { buildFollowUpMailto } = require("../followup");
const { t, normalizeLang, localeFor, LANGS, LANG_NAMES } = require("../i18n");
const { renderLangSwitcher } = require("./langSwitcher");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function daysAgo(iso, l) {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d <= 0) return t(l, "dashboard.dayToday");
  if (d === 1) return t(l, "dashboard.dayYesterday");
  return t(l, "dashboard.daysAgo", { n: d });
}

// Honest AI-generated estimate of how well the account owner's actual profile
// matches a given posting's requirements — shown as a colour-coded badge with
// the short reasoning as a hover tooltip (title attribute) for a bit of
// context without cluttering the row.
function scoreBadge(generated, l) {
  const score = generated && typeof generated.fitScore === "number" ? generated.fitScore : null;
  if (score === null) {
    return `<span class="score-badge na" title="${esc(t(l, "dashboard.scoreNaTooltip"))}">–</span>`;
  }
  const cls = score >= 75 ? "high" : score >= 50 ? "mid" : "low";
  const reasoning = esc(generated.fitScoreReasoning || "");
  return `<span class="score-badge ${cls}" title="${reasoning}">${score}%</span>`;
}

// Simple current-status snapshot, not a historical funnel (the app only
// stores one status per application, not a full history) — labelled
// accordingly so the numbers aren't read as more than they are.
function computeStats(applications) {
  const total = applications.length;
  const sent = applications.filter((a) => a.status !== "entwurf").length;
  const responded = applications.filter((a) =>
    ["interview", "in_auswahl", "zusage", "absage"].includes(a.status)
  ).length;
  const inConversation = applications.filter((a) => ["interview", "in_auswahl"].includes(a.status)).length;
  const offers = applications.filter((a) => a.status === "zusage").length;
  const rejections = applications.filter((a) => a.status === "absage").length;
  const responseRate = sent > 0 ? Math.round((responded / sent) * 100) : null;
  return { total, sent, responseRate, inConversation, offers, rejections };
}

function renderIndexPage({ applications, hasApiKey, statuses, baseUrl, savedSearches = [], username = "", lang = "de" }) {
  const l = normalizeLang(lang);
  const statusLabel = (key) => t(l, `status.${key}`);
  const statusOptions = (current) =>
    statuses
      .map(
        (s) =>
          `<option value="${esc(s.key)}" data-color="${esc(s.color)}" ${s.key === current ? "selected" : ""}>${esc(statusLabel(s.key))}</option>`
      )
      .join("");

  const statusByKey = Object.fromEntries(statuses.map((s) => [s.key, s]));
  const appBySlug = Object.fromEntries(applications.map((a) => [a.slug, a]));
  const stats = computeStats(applications);
  const statTiles = [
    { label: t(l, "dashboard.statTotalSent"), value: stats.sent, color: "#3b82f6" },
    { label: t(l, "dashboard.statResponseRate"), value: stats.responseRate === null ? "–" : `${stats.responseRate}%`, color: "#14181f" },
    { label: t(l, "dashboard.statInConversation"), value: stats.inConversation, color: "#e2572b" },
    { label: t(l, "dashboard.statOffers"), value: stats.offers, color: "#16a34a" },
    { label: t(l, "dashboard.statRejections"), value: stats.rejections, color: "#6b7280" }
  ];
  const statBarHtml = `
    <div class="stat-bar" title="${esc(t(l, "dashboard.statBarTitle"))}">
      ${statTiles
        .map(
          (tl) => `
        <div class="stat-tile">
          <span class="stat-dot" style="background:${tl.color}"></span>
          <div class="stat-value">${esc(String(tl.value))}</div>
          <div class="stat-label">${esc(tl.label)}</div>
        </div>`
        )
        .join("")}
    </div>`;

  const rows = applications
    .map((a) => {
      const st = statusByKey[a.status] || statuses[0];
      const appLang = normalizeLang(a.language);
      const mailto = buildApplicationMailto({ generated: a.generated, baseUrl, slug: a.slug, lang: appLang });
      const followupMailto = buildFollowUpMailto({ generated: a.generated, profile: a.profileSnapshot, entry: a, lang: appLang });
      const canFollowUp = ["gesendet", "follow_up"].includes(a.status);
      const canPrepInterview = a.status === "interview";
      const insightsReady = Boolean(a.companyInsights);
      const dupTarget = a.duplicateOfSlug ? appBySlug[a.duplicateOfSlug] : null;
      return `
      <tr id="row-${a.slug}" data-row="${a.slug}" data-status="${esc(a.status || "")}">
        <td>
          <div class="job-title">${esc(a.jobTitle || "—")}</div>
          <div class="job-company">${esc(a.company || "")}</div>
          <div class="job-meta">${new Date(a.createdAt).toLocaleDateString(localeFor(l))} · ${daysAgo(a.createdAt, l)}</div>
          ${
            dupTarget
              ? `<a class="dup-badge" href="#row-${esc(a.duplicateOfSlug)}" title="${esc(
                  t(l, "dashboard.duplicateBadgeTitle", {
                    company: a.company,
                    date: new Date(dupTarget.createdAt).toLocaleDateString(localeFor(l)),
                    status: statusLabel(dupTarget.status)
                  })
                )}">${esc(t(l, "dashboard.duplicateBadge"))}</a>`
              : ""
          }
        </td>
        <td class="fit-cell">${scoreBadge(a.generated, l)}</td>
        <td>
          <div class="status-select-wrap">
            <span class="status-dot" style="background:${st.color}"></span>
            <select class="status-select" data-status-select="${a.slug}">${statusOptions(a.status)}</select>
          </div>
          <input type="text" class="note-input" placeholder="${esc(t(l, "dashboard.notePlaceholder"))}" data-note-input="${a.slug}" value="${esc(a.note || "")}">
        </td>
        <td class="actions">
          ${
            a.publicDisabled
              ? `<span class="link disabled-note" title="${esc(t(l, "dashboard.pageDisabledTitle"))}">${esc(t(l, "dashboard.pageDisabled"))}</span>`
              : `<a href="/a/${a.slug}" target="_blank" class="link">${esc(t(l, "dashboard.linkAppPage"))}</a>
          <a href="/pdf/${a.slug}/cv" target="_blank" class="link">${esc(t(l, "dashboard.linkCv"))}</a>
          <a href="/pdf/${a.slug}/cover" target="_blank" class="link">${esc(t(l, "dashboard.linkCover"))}</a>`
          }
          <a href="/posting/${a.slug}" target="_blank" class="link">${esc(t(l, "dashboard.linkPosting"))}</a>
          <a href="${esc(mailto)}" class="link" title="${
        a.generated && a.generated.contactEmail
          ? esc(t(l, "dashboard.linkEmailTitleWithAddr", { email: a.generated.contactEmail }))
          : esc(t(l, "dashboard.linkEmailTitleNoAddr"))
      }">${esc(t(l, "dashboard.linkEmail"))}</a>
          <a href="/api/applications/${a.slug}/eml" class="link" title="${esc(t(l, "dashboard.linkEmailAttachmentTitle"))}">${esc(t(l, "dashboard.linkEmailAttachment"))}</a>
          ${
            canFollowUp
              ? `<a href="${esc(followupMailto)}" class="link" data-followup="${a.slug}" title="${esc(t(l, "dashboard.linkFollowupTitle"))}">${esc(t(l, "dashboard.linkFollowup"))}</a>`
              : ""
          }
          ${
            canPrepInterview
              ? insightsReady
                ? `<a href="/pdf/${a.slug}/insights" target="_blank" class="link" title="${esc(t(l, "dashboard.linkInsightsTitle"))}">${esc(t(l, "dashboard.linkInsights"))}</a>
             <a href="#" data-regen-insights="${a.slug}" class="link" style="font-size:11px;" title="${esc(t(l, "dashboard.linkInsightsRegenTitle"))}">↻</a>`
                : `<a href="#" data-gen-insights="${a.slug}" class="link" title="${esc(t(l, "dashboard.linkInsightsCreateTitle"))}">${esc(t(l, "dashboard.linkInsightsCreate"))}</a>`
              : ""
          }
          <button class="link ${a.publicDisabled ? "" : "danger"}" data-toggle-public="${a.slug}" data-public-disabled="${a.publicDisabled ? "1" : "0"}" title="${
        a.publicDisabled ? esc(t(l, "dashboard.activatePageTitle")) : esc(t(l, "dashboard.deactivatePageTitle"))
      }">${a.publicDisabled ? esc(t(l, "dashboard.activatePage")) : esc(t(l, "dashboard.deactivatePage"))}</button>
          <button class="link danger" data-delete="${a.slug}">${esc(t(l, "dashboard.deleteBtn"))}</button>
        </td>
      </tr>`;
    })
    .join("");

  const langOptions = LANGS.map((code) => `<option value="${code}" ${code === l ? "selected" : ""}>${esc(LANG_NAMES[code].native)}</option>`).join("");

  // Small, fully-populated (all 3 languages) dictionary embedded for the
  // client-side "just generated" result panel in app.js, which needs to
  // render mailto boilerplate in whichever language THAT application was
  // generated in (data.generated.language) — independent of this dashboard's
  // own UI language `l`.
  const mailI18n = Object.fromEntries(
    LANGS.map((code) => [
      code,
      {
        downloadsHeader: t(code, "mail.downloadsHeader"),
        cvLine: t(code, "mail.cvLine", { url: "%URL_CV%" }),
        coverLine: t(code, "mail.coverLine", { url: "%URL_COVER%" }),
        appPageLine: t(code, "mail.appPageLine", { url: "%URL_APP%" }),
        defaultSubject: t(code, "mail.defaultSubject", { jobTitle: "%JOB_TITLE%" }),
        attachmentsSuffix: t(code, "dashboard.attachmentsSuffix")
      }
    ])
  );

  const appI18n = {
    errorNeedText: t(l, "dashboard.errorNeedText"),
    errorNeedUrl: t(l, "dashboard.errorNeedUrl"),
    generating: t(l, "dashboard.generating"),
    generatedDone: t(l, "dashboard.generatedDone"),
    errorGeneric: t(l, "dashboard.errorGeneric"),
    errorPrefix: t(l, "common.errorPrefix"),
    duplicateWarningTemplate: t(l, "dashboard.duplicateWarning", { date: "%DATE%", status: "%STATUS%" }),
    copyBtn: t(l, "dashboard.copyBtn"),
    copiedBtn: t(l, "dashboard.copiedBtn"),
    mailtoHintWithEmail: t(l, "dashboard.mailtoHintWithEmail", { email: "%EMAIL%" }),
    mailtoHintNoEmail: t(l, "dashboard.mailtoHintNoEmail"),
    mailtoHintSuffix: t(l, "dashboard.mailtoHintSuffix"),
    deleteAppConfirm: t(l, "dashboard.deleteAppConfirm"),
    searchRemoveError: t(l, "dashboard.searchRemoveError"),
    deleteSearchConfirm: t(l, "dashboard.deleteSearchConfirm"),
    insightsResearching: t(l, "dashboard.insightsResearching"),
    insightsError: t(l, "dashboard.insightsError"),
    deactivateConfirm: t(l, "dashboard.deactivateConfirm"),
    publicToggleError: t(l, "dashboard.publicToggleError"),
    statusSaveError: t(l, "dashboard.statusSaveError"),
    noteSaveError: t(l, "dashboard.noteSaveError")
  };

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(l, "common.appName"))}${username ? " — " + esc(username) : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${BASE_CSS}
  header.top { background: var(--ink); color: #fff; padding: 26px 0; }
  header.top .container { display: flex; justify-content: space-between; align-items: center; }
  header.top h1 { font-size: 18px; margin: 0; font-weight: 700; }
  header.top a.navlink { font-size: 13.5px; color: #cfd3da; text-decoration: none; }
  main { padding: 40px 0 80px; }
  .grid { display: grid; grid-template-columns: 1.15fr 1fr; gap: 26px; align-items: start; }
  @media (max-width: 880px) { .grid { grid-template-columns: 1fr; } }
  h2.title { font-size: 24px; margin: 0 0 6px; font-weight: 800; letter-spacing: -0.01em; }
  p.subtitle { color: var(--grey); margin: 0 0 26px; line-height: 1.5; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 18px 0 6px; color: var(--ink-soft); }
  label:first-of-type { margin-top: 0; }
  .tab-row { display: flex; gap: 8px; margin-bottom: 6px; }
  .tab-btn { padding: 7px 14px; border-radius: 999px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--grey); }
  .tab-btn.active { border-color: var(--ink); color: var(--ink); background: var(--paper-soft); }
  .field-url, .field-text { display: none; }
  .field-url.active, .field-text.active { display: block; }
  .warning { background: #fff6ec; border: 1px solid #f3d9b6; color: #7a4b12; padding: 12px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 18px; }
  .result { margin-top: 10px; }
  .copybox { position: relative; }
  .copybox textarea { min-height: 160px; }
  .copybox .copybtn { position: absolute; top: 10px; right: 10px; }
  .dl-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 10px; min-height: 18px; }
  .status.err { color: #b3261e; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; padding: 0 8px 8px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--grey-light); border-bottom: 1px solid var(--border); }
  td { padding: 12px 8px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: top; }
  td.grey { color: var(--grey); white-space: nowrap; }
  td.fit-cell { white-space: nowrap; }
  .score-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; padding: 4px 9px; border-radius: 999px; font-size: 12.5px; font-weight: 700; cursor: help; }
  .score-badge.high { background: #dff5e6; color: #166534; }
  .score-badge.mid { background: #fff3d6; color: #9a6b00; }
  .score-badge.low { background: #fde3e3; color: #b3261e; }
  .score-badge.na { background: #eceef1; color: var(--grey-light); font-weight: 600; }
  .job-title { font-weight: 600; }
  .job-company { font-size: 12.5px; color: var(--grey); }
  .job-meta { font-size: 11.5px; color: var(--grey-light); margin-top: 3px; }
  .dup-badge { display: inline-block; margin-top: 6px; font-size: 11px; font-weight: 700; color: #9a6b00; background: #fff3d6; padding: 3px 9px; border-radius: 999px; text-decoration: none; }
  .dup-badge:hover { text-decoration: underline; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; white-space: nowrap; }
  .link { font-size: 12.5px; text-decoration: none; color: var(--accent); font-weight: 600; background: none; border: none; cursor: pointer; font-family: inherit; padding: 0; }
  .link.danger { color: var(--grey-light); }
  .link.danger:hover { color: #b3261e; }
  .empty { color: var(--grey); font-size: 14px; padding: 20px 0; }
  .stat-bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 14px 0 18px; }
  @media (max-width: 640px) { .stat-bar { grid-template-columns: repeat(2, 1fr); } }
  .stat-tile { border: 1px solid var(--border); border-radius: 12px; padding: 12px 10px; text-align: center; background: var(--paper-soft); position: relative; }
  .stat-dot { position: absolute; top: 10px; right: 10px; width: 7px; height: 7px; border-radius: 50%; }
  .stat-value { font-size: 20px; font-weight: 800; letter-spacing: -0.01em; }
  .stat-label { font-size: 11px; color: var(--grey); margin-top: 2px; text-transform: uppercase; letter-spacing: .04em; }
  .disabled-note { color: var(--grey-light); cursor: default; }
  .searches-card { margin-bottom: 22px; }
  .search-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
  .search-chip { display: flex; align-items: center; gap: 4px; background: var(--paper-soft); border: 1px solid var(--border); border-radius: 999px; padding: 6px 6px 6px 14px; font-size: 13px; }
  .search-chip a { text-decoration: none; color: var(--ink); font-weight: 600; }
  .search-chip a:hover { color: var(--accent); }
  .chip-x { border: none; background: none; color: var(--grey-light); cursor: pointer; font-size: 15px; line-height: 1; padding: 3px 7px; border-radius: 50%; font-family: inherit; }
  .chip-x:hover { background: #fde3e3; color: #b3261e; }
  .add-search-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .add-search-row input { flex: 1; min-width: 180px; }
  .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
  .filter-row label { margin: 0; white-space: nowrap; }
  .filter-row select { font-family: inherit; font-size: 13px; padding: 7px 10px; border-radius: 8px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); }
  .status-select-wrap { display: flex; align-items: center; gap: 6px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .status-select { font-family: inherit; font-size: 12.5px; padding: 5px 6px; border-radius: 7px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); max-width: 190px; }
  .note-input { margin-top: 6px; width: 100%; font-family: inherit; font-size: 12px; padding: 5px 8px; border-radius: 7px; border: 1.5px dashed var(--border); background: transparent; color: var(--ink-soft); }
  .note-input:focus { outline: none; border-color: var(--accent); border-style: solid; background: #fff; }
  tr[data-hidden="1"] { display: none; }
  #spinner { display: none; }
  #spinner.on { display: inline-block; }
  .spin { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.5); border-top-color: #fff; border-radius: 50%; animation: sp .7s linear infinite; display: inline-block; }
  @keyframes sp { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <header class="top">
    <div class="container">
      <h1>🛠️ ${esc(t(l, "common.appName"))}</h1>
      <span style="display:flex;align-items:center;gap:16px;">
        ${renderLangSwitcher(l, "/")}
        ${username ? `<span class="navlink">${esc(t(l, "common.loggedInAs", { username }))}</span>` : ""}
        <a class="navlink" href="/profile">${esc(t(l, "dashboard.editProfile"))}</a>
        <a class="navlink" href="#" id="logoutLink">${esc(t(l, "common.logout"))}</a>
      </span>
    </div>
  </header>

  <main class="container">
    ${!hasApiKey ? `<div class="warning">${esc(t(l, "dashboard.apiKeyWarning"))}</div>` : ""}

    <div class="card searches-card">
      <h2 class="title" style="font-size:16px;">${esc(t(l, "dashboard.savedSearchesTitle"))}</h2>
      <p class="subtitle" style="margin-bottom:14px;">${esc(t(l, "dashboard.savedSearchesSubtitle"))}</p>
      <div class="search-chips">
        ${
          savedSearches.length
            ? savedSearches
                .map(
                  (s) => `
          <div class="search-chip">
            <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>
            <button type="button" class="chip-x" data-delete-search="${esc(s.id)}" title="${esc(t(l, "dashboard.removeSearch"))}">×</button>
          </div>`
                )
                .join("")
            : `<span class="empty" style="padding:0;">${esc(t(l, "dashboard.noSavedSearches"))}</span>`
        }
      </div>
      <form id="addSearchForm" class="add-search-row">
        <input type="text" id="searchLabel" placeholder="${esc(t(l, "dashboard.searchNamePlaceholder"))}" required>
        <input type="url" id="searchUrl" placeholder="${esc(t(l, "dashboard.searchUrlPlaceholder"))}" required>
        <button type="submit" class="btn btn-outline">${esc(t(l, "dashboard.addSearch"))}</button>
      </form>
      <div id="searchStatus" class="status"></div>
    </div>

    <div class="grid">
      <div class="card">
        <h2 class="title">${esc(t(l, "dashboard.newAppTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "dashboard.newAppSubtitle"))}</p>

        <div class="tab-row">
          <button class="tab-btn active" data-tab="text">${esc(t(l, "dashboard.tabText"))}</button>
          <button class="tab-btn" data-tab="url">${esc(t(l, "dashboard.tabUrl"))}</button>
        </div>

        <div class="field-text active" id="field-text">
          <label>${esc(t(l, "dashboard.jobTextLabel"))}</label>
          <textarea id="jobText" rows="10" placeholder="${esc(t(l, "dashboard.jobTextPlaceholder"))}"></textarea>
        </div>
        <div class="field-url" id="field-url">
          <label>${esc(t(l, "dashboard.jobUrlLabel"))}</label>
          <input type="url" id="jobUrl" placeholder="https://…">
          <div class="status" style="margin-top:6px;">${esc(t(l, "dashboard.jobUrlHint"))}</div>
        </div>

        <label>${esc(t(l, "dashboard.languageLabel"))}</label>
        <select id="jobLang">${langOptions}</select>

        <button id="generateBtn" class="btn btn-primary" style="margin-top:18px; width:100%; justify-content:center;">
          <span id="spinner"><span class="spin"></span></span> ${esc(t(l, "dashboard.generateBtn"))}
        </button>
        <div id="genStatus" class="status"></div>

        <div id="result" class="result" style="display:none;">
          <hr style="border:none;border-top:1px solid var(--border);margin:24px 0;">

          <label>${esc(t(l, "dashboard.emailTextLabel"))}</label>
          <div class="copybox">
            <textarea id="emailText" rows="9" readonly></textarea>
            <button class="btn btn-outline copybtn" data-copy="emailText">${esc(t(l, "dashboard.copyBtn"))}</button>
          </div>

          <label>${esc(t(l, "dashboard.coverTextLabel"))}</label>
          <div class="copybox">
            <textarea id="coverText" rows="10" readonly></textarea>
            <button class="btn btn-outline copybtn" data-copy="coverText">${esc(t(l, "dashboard.copyBtn"))}</button>
          </div>

          <label>${esc(t(l, "dashboard.downloadsLabel"))}</label>
          <div class="dl-row">
            <a id="dlMailto" class="btn btn-primary" style="flex:1; justify-content:center;">${esc(t(l, "dashboard.sendEmailBtn"))}</a>
            <a id="dlEml" class="btn btn-outline" style="flex:1; justify-content:center;">${esc(t(l, "dashboard.downloadEmlBtn"))}</a>
          </div>
          <div id="mailtoHint" class="status" style="margin-top:-4px;"></div>
          <div class="dl-row">
            <a id="dlCv" class="btn btn-dark" target="_blank">${esc(t(l, "dashboard.downloadCv"))}</a>
            <a id="dlCover" class="btn btn-dark" target="_blank">${esc(t(l, "dashboard.downloadCover"))}</a>
          </div>
          <div class="dl-row">
            <a id="dlApp" class="btn btn-outline" target="_blank" style="flex:1; justify-content:center;">${esc(t(l, "dashboard.openAppPage"))}</a>
          </div>
          <div class="copybox" style="margin-top:10px;">
            <input type="text" id="appUrl" readonly>
            <button class="btn btn-outline copybtn" data-copy="appUrl" style="top:6px;">${esc(t(l, "dashboard.copyBtn"))}</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "dashboard.pastAppsTitle"))}</h2>
        ${stats.total ? statBarHtml : ""}
        <div class="filter-row">
          <label for="statusFilter" style="margin:0;">${esc(t(l, "dashboard.filterLabel"))}</label>
          <select id="statusFilter">
            <option value="">${esc(t(l, "dashboard.filterAll"))}</option>
            ${statuses.map((s) => `<option value="${esc(s.key)}">${esc(statusLabel(s.key))}</option>`).join("")}
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>${esc(t(l, "dashboard.colApplication"))}</th>
              <th title="${esc(t(l, "dashboard.fitTooltip"))}">${esc(t(l, "dashboard.colFit"))}</th>
              <th>${esc(t(l, "dashboard.colStatus"))}</th>
              <th>${esc(t(l, "dashboard.colActions"))}</th>
            </tr>
          </thead>
          <tbody id="appTableBody">
            ${rows || `<tr><td colspan="4" class="empty">${esc(t(l, "dashboard.noAppsYet"))}</td></tr>`}
          </tbody>
        </table>
        <div id="filterEmpty" class="empty" style="display:none;">${esc(t(l, "dashboard.noAppsFiltered"))}</div>
      </div>
    </div>
  </main>

  <script>
    window.APP_LANG = ${JSON.stringify(l)};
    window.APP_I18N = ${JSON.stringify(appI18n)};
    window.MAIL_I18N = ${JSON.stringify(mailI18n)};
  </script>
  <script src="/app.js"></script>
</body>
</html>`;
}

module.exports = { renderIndexPage };
