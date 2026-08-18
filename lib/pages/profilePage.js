const { baseCss } = require("./styles");
const { normalizeAccentColor, DEFAULT_ACCENT } = require("../accentColor");
const { t, normalizeLang, DEFAULT_LANG } = require("../i18n");
const { renderLangSwitcher } = require("./langSwitcher");

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderProfilePage({
  profileJson,
  media = {},
  libraryDocs = [],
  libraryCategories = [],
  username = "",
  lang = "de",
  imported = false,
  accentColor
}) {
  const l = normalizeLang(lang);
  const currentAccent = normalizeAccentColor(accentColor);
  const categoryLabel = (key) => t(l, `docCategory.${key}`);

  const libraryRows = libraryDocs.length
    ? libraryDocs
        .map(
          (d) => `
      <div class="doc-row">
        <div>
          <div style="font-weight:600;">${esc(d.title)}</div>
          <div style="margin-top:4px;"><span class="pill">${esc(categoryLabel(d.category))}</span></div>
          ${d.skillsText ? `<div style="margin-top:6px;font-size:12.5px;color:var(--grey);max-width:480px;">${esc(d.skillsText)}</div>` : ""}
        </div>
        <div class="doc-actions">
          <a class="btn btn-outline" href="/documents/library/${esc(d.id)}" target="_blank">${esc(t(l, "common.view"))}</a>
          <button class="btn btn-outline" style="color:#b3261e;border-color:#f3c6c6;" data-lib-delete="${esc(d.id)}">${esc(t(l, "common.delete"))}</button>
        </div>
      </div>`
        )
        .join("")
    : `<div style="padding:8px 0;font-size:13.5px;color:var(--grey);">${esc(t(l, "profile.noDocs"))}</div>`;

  const categoryOptions = libraryCategories.map((c) => `<option value="${esc(c.key)}">${esc(categoryLabel(c.key))}</option>`).join("");

  const mediaRow = (key, label, hint) => {
    const m = media[key] || {};
    const badge = m.available
      ? `<span class="pill" style="background:#dff5e6;color:#166534;">${esc(t(l, "profile.uploaded"))}</span>`
      : `<span class="pill" style="background:#fde3e3;color:#b3261e;">${esc(t(l, "profile.missing"))}</span>`;
    return `
      <div class="doc-row">
        <div>
          <div style="font-weight:600;">${label}</div>
          <div style="margin-top:4px;">${badge}</div>
          ${hint ? `<div style="margin-top:4px;font-size:12.5px;color:var(--grey);">${hint}</div>` : ""}
        </div>
        <div class="doc-actions">
          ${m.available ? `<a class="btn btn-outline" href="/api/media/mine/${key}" target="_blank">${esc(t(l, "common.view"))}</a>` : ""}
          <label class="btn btn-dark" style="cursor:pointer;">
            ${esc(t(l, "common.upload"))}
            <input type="file" accept="image/jpeg,image/png,image/webp" data-media="${key}" style="display:none;">
          </label>
        </div>
      </div>`;
  };

  const avatarInitial = esc((username || "?").trim().charAt(0).toUpperCase() || "?");
  const avatarInner =
    media.photo && media.photo.available ? `<img src="/api/media/mine/photo" alt="">` : avatarInitial;

  return `<!doctype html>
<html lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t(l, "profile.title"))}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${baseCss(accentColor)}
  header.top { background: var(--ink); color: #fff; padding: 26px 0; }
  header.top .container { display: flex; justify-content: space-between; align-items: center; }
  header.top h1 { font-size: 18px; margin: 0; font-weight: 700; }
  header.top a.navlink { font-size: 13.5px; color: #cfd3da; text-decoration: none; }
  main { padding: 40px 0 80px; }
  h2.title { font-size: 22px; margin: 0 0 6px; font-weight: 800; }
  p.subtitle { color: var(--grey); margin: 0 0 20px; line-height: 1.5; max-width: 720px; }
  textarea#profileJson { min-height: 640px; font-family: 'SFMono-Regular', Consolas, monospace; font-size: 13px; line-height: 1.5; }
  .row { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  .status { font-size: 13.5px; color: var(--grey); margin-top: 10px; }
  .status.ok { color: #1a7f37; }
  .status.err { color: #b3261e; }
  .card + .card { margin-top: 22px; }
  .doc-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 16px; }
  .doc-row:last-child { border-bottom: none; }
  .doc-actions { display: flex; gap: 8px; align-items: center; flex: none; }
  select { width: 100%; font-family: inherit; font-size: 14.5px; padding: 12px 14px; border-radius: 10px; border: 1.5px solid var(--border); background: #fff; color: var(--ink); }
  select:focus { outline: none; border-color: var(--accent); }
  .field-row { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 14px; }
  .field-row > div { flex: 1 1 220px; }
  .field-row label { margin: 0 0 6px; }
  .link-row { display: flex; gap: 10px; align-items: center; margin-top: 10px; }
  .link-row input { flex: 1 1 auto; }
  .banner-imported { background: #eaf5ff; border: 1px solid #bcdcf7; color: #1c4e73; padding: 12px 14px; border-radius: 10px; font-size: 13.5px; margin-bottom: 18px; }

  /* --- Profile header (avatar + tagline) --- */
  .profile-header {
    display: flex; align-items: center; gap: 22px; padding: 30px 32px; margin-bottom: 26px;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
    border-radius: var(--radius); color: #fff; box-shadow: var(--shadow); position: relative; overflow: hidden;
  }
  .profile-header::after {
    content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%;
    background: rgba(255,255,255,.08); pointer-events: none;
  }
  .profile-avatar {
    width: 76px; height: 76px; border-radius: 50%; flex: none; overflow: hidden; position: relative; z-index: 1;
    background: rgba(255,255,255,.18); border: 2px solid rgba(255,255,255,.5);
    display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800;
  }
  .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-header-text { position: relative; z-index: 1; }
  .profile-header-text h2 { margin: 0 0 6px; font-size: 23px; font-weight: 800; }
  .profile-header-text p { margin: 0; opacity: .92; font-size: 13.5px; max-width: 560px; line-height: 1.5; }

  /* --- Tabs --- */
  .profile-tabs { display: flex; gap: 4px; margin-bottom: 26px; flex-wrap: wrap; border-bottom: 1.5px solid var(--border); }
  .profile-tab-btn {
    background: transparent; border: none; font-family: inherit; font-size: 14px; font-weight: 700; color: var(--grey);
    padding: 12px 20px; cursor: pointer; border-radius: 10px 10px 0 0; position: relative; transition: color .15s, background .15s;
  }
  .profile-tab-btn:hover { color: var(--ink); background: var(--paper-soft); }
  .profile-tab-btn.active { color: var(--accent-dark); }
  .profile-tab-btn.active::after {
    content: ''; position: absolute; left: 12px; right: 12px; bottom: -1.5px; height: 3px;
    background: var(--accent); border-radius: 3px 3px 0 0;
  }
  .profile-tab-panel { display: none; }
  .profile-tab-panel.active { display: block; animation: profileFadeIn .25s ease; }
  @keyframes profileFadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

  .panels-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; align-items: start; }
  @media (max-width: 860px) { .panels-2col { grid-template-columns: 1fr; } }

  /* --- Experience editor --- */
  .exp-card {
    border: 1px solid var(--border); border-radius: 12px; padding: 18px; margin-top: 14px; background: var(--paper-soft);
  }
  .exp-card .exp-remove-row { justify-content: flex-end; }
  .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 12px; }
  .checkbox-row input[type=checkbox] { width: auto; accent-color: var(--accent); cursor: pointer; }
  .checkbox-row label { margin: 0; cursor: pointer; }
</style>
</head>
<body>
  <header class="top">
    <div class="container">
      <h1>🛠️ ${esc(t(l, "common.appName"))}</h1>
      <span style="display:flex;align-items:center;gap:16px;">
        ${renderLangSwitcher(l, "/profile")}
        ${username ? `<span class="navlink">${esc(t(l, "common.loggedInAs", { username }))}</span>` : ""}
        <a class="navlink" href="/">${esc(t(l, "common.toolLink"))}</a>
        <a class="navlink" href="#" id="logoutLink">${esc(t(l, "common.logout"))}</a>
      </span>
    </div>
  </header>
  <main class="container">
    ${imported ? `<div class="banner-imported">✓ ${esc(t(l, "profile.importedBanner"))}</div>` : ""}

    <div class="profile-header">
      <div class="profile-avatar">${avatarInner}</div>
      <div class="profile-header-text">
        <h2>${esc(username || t(l, "profile.title"))}</h2>
        <p>${esc(t(l, "profile.headerTagline"))}</p>
      </div>
    </div>

    <div class="profile-tabs">
      <button type="button" class="profile-tab-btn" data-tab="profil">${esc(t(l, "profile.tabProfile"))}</button>
      <button type="button" class="profile-tab-btn" data-tab="erfahrung">${esc(t(l, "profile.tabExperience"))}</button>
      <button type="button" class="profile-tab-btn" data-tab="dokumente">${esc(t(l, "profile.tabDocuments"))}</button>
      <button type="button" class="profile-tab-btn" data-tab="konto">${esc(t(l, "profile.tabAccount"))}</button>
      <button type="button" class="profile-tab-btn" data-tab="erweitert">${esc(t(l, "profile.tabAdvanced"))}</button>
    </div>

    <div class="profile-tab-panel" id="tab-profil">
      <div class="panels-2col">
        <div class="card">
          <h2 class="title" style="font-size:18px;">${esc(t(l, "profile.portraitTitle"))}</h2>
          <p class="subtitle">${esc(t(l, "profile.portraitSubtitle"))}</p>
          ${mediaRow("photo", esc(t(l, "profile.photoLabel")), esc(t(l, "profile.photoHint")))}
          ${mediaRow("signature", esc(t(l, "profile.signatureLabel")), esc(t(l, "profile.signatureHint")))}
          <div id="mediaStatus" class="status"></div>
        </div>

        <div class="card">
          <h2 class="title" style="font-size:18px;">${esc(t(l, "profile.contactLinksTitle"))}</h2>
          <p class="subtitle">${esc(t(l, "profile.contactLinksSubtitle"))}</p>
          <div class="field-row">
            <div><label>${esc(t(l, "profile.fieldName"))}</label><input type="text" id="cName"></div>
            <div><label>${esc(t(l, "profile.fieldEmail"))}</label><input type="text" id="cEmail"></div>
          </div>
          <div class="field-row">
            <div><label>${esc(t(l, "profile.fieldPhone"))}</label><input type="text" id="cPhone"></div>
            <div><label>${esc(t(l, "profile.fieldLinkedin"))}</label><input type="text" id="cLinkedin" placeholder="linkedin.com/in/…"></div>
          </div>
          <div class="field-row">
            <div><label>${esc(t(l, "profile.fieldStreet"))}</label><input type="text" id="cStreet"></div>
            <div><label>${esc(t(l, "profile.fieldZip"))}</label><input type="text" id="cZip"></div>
            <div><label>${esc(t(l, "profile.fieldCity"))}</label><input type="text" id="cCity"></div>
          </div>
          <label style="margin-top:22px;">${esc(t(l, "profile.otherLinksTitle"))}</label>
          <div class="subtitle" style="margin:2px 0 0;font-size:12.5px;">${esc(t(l, "profile.otherLinksHint"))}</div>
          <div id="linksList"></div>
          <div class="row">
            <button type="button" id="addLinkBtn" class="btn btn-outline">${esc(t(l, "profile.addLink"))}</button>
          </div>
          <div class="row">
            <button type="button" id="saveContactBtn" class="btn btn-primary">${esc(t(l, "common.save"))}</button>
            <button type="button" id="importCvBtn" class="btn btn-outline">${esc(t(l, "profile.importCvBtn"))}</button>
          </div>
          <div id="contactStatus" class="status"></div>
        </div>
      </div>
    </div>

    <div class="profile-tab-panel" id="tab-erfahrung">
      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "profile.experienceTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "profile.experienceSubtitle"))}</p>
        <div id="expList"></div>
        <div class="row">
          <button type="button" id="addExpBtn" class="btn btn-outline">${esc(t(l, "profile.experienceAddBtn"))}</button>
        </div>
        <div class="row">
          <button type="button" id="saveExpBtn" class="btn btn-primary">${esc(t(l, "common.save"))}</button>
        </div>
        <div id="expStatus" class="status"></div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "profile.experienceSupplementTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "profile.experienceSupplementSubtitle"))}</p>
        <div class="row">
          <label class="btn btn-dark" style="cursor:pointer;">
            ${esc(t(l, "profile.experienceSupplementBtn"))}
            <input type="file" id="expImportFile" accept="application/pdf,image/jpeg,image/png,image/webp,.txt,.doc,.docx" style="display:none;">
          </label>
        </div>
        <div id="expImportStatus" class="status"></div>
      </div>
    </div>

    <div class="profile-tab-panel" id="tab-dokumente">
      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "profile.otherDocsTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "profile.otherDocsSubtitle"))}</p>
        <div id="libraryList">${libraryRows}</div>
        <div class="field-row">
          <div>
            <label>${esc(t(l, "profile.docTitleLabel"))}</label>
            <input type="text" id="libTitle" placeholder="${esc(t(l, "profile.docTitlePlaceholder"))}">
          </div>
          <div>
            <label>${esc(t(l, "profile.docCategoryLabel"))}</label>
            <select id="libCategory">${categoryOptions}</select>
          </div>
        </div>
        <label>${esc(t(l, "profile.docSkillsLabel"))}</label>
        <textarea id="libSkills" rows="2" placeholder="${esc(t(l, "profile.docSkillsPlaceholder"))}"></textarea>
        <div class="row">
          <label class="btn btn-dark" style="cursor:pointer;">
            ${esc(t(l, "profile.uploadAndSave"))}
            <input type="file" id="libFile" accept="application/pdf,image/jpeg,image/png,image/webp" style="display:none;">
          </label>
        </div>
        <div id="libStatus" class="status"></div>
      </div>
    </div>

    <div class="profile-tab-panel" id="tab-konto">
      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "account.usernameCardTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "account.usernameCardSubtitle"))}</p>
        <div class="field-row">
          <div>
            <label>${esc(t(l, "account.newUsernameLabel"))}</label>
            <input type="text" id="accNewUsername" value="${esc(username)}">
          </div>
          <div>
            <label>${esc(t(l, "account.currentPasswordLabel"))}</label>
            <input type="password" id="accUsernameCurrentPassword" autocomplete="current-password">
          </div>
        </div>
        <div class="row">
          <button type="button" id="saveUsernameBtn" class="btn btn-outline">${esc(t(l, "account.saveUsernameBtn"))}</button>
        </div>
        <div id="usernameStatus" class="status"></div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "account.passwordCardTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "account.passwordCardSubtitle"))}</p>
        <div class="field-row">
          <div>
            <label>${esc(t(l, "account.currentPasswordLabel"))}</label>
            <input type="password" id="accPasswordCurrentPassword" autocomplete="current-password">
          </div>
          <div>
            <label>${esc(t(l, "account.newPasswordLabel"))}</label>
            <input type="password" id="accNewPassword" autocomplete="new-password">
          </div>
          <div>
            <label>${esc(t(l, "account.confirmNewPasswordLabel"))}</label>
            <input type="password" id="accNewPasswordConfirm" autocomplete="new-password">
          </div>
        </div>
        <div class="row">
          <button type="button" id="savePasswordBtn" class="btn btn-outline">${esc(t(l, "account.savePasswordBtn"))}</button>
        </div>
        <div id="passwordStatus" class="status"></div>
      </div>

      <div class="card">
        <h2 class="title" style="font-size:18px;">${esc(t(l, "theme.title"))}</h2>
        <p class="subtitle">${esc(t(l, "theme.subtitle"))}</p>
        <div class="field-row">
          <div style="flex:none;">
            <label>${esc(t(l, "theme.colorLabel"))}</label>
            <input type="color" id="accentColorPicker" value="${esc(currentAccent)}" style="width:64px;height:44px;padding:2px;cursor:pointer;border:1.5px solid var(--border);border-radius:10px;background:#fff;">
          </div>
          <div>
            <label>${esc(t(l, "theme.hexLabel"))}</label>
            <input type="text" id="accentColorHex" value="${esc(currentAccent)}" maxlength="7" placeholder="#e2572b">
          </div>
        </div>
        <div class="row">
          <button type="button" id="saveAccentBtn" class="btn btn-primary">${esc(t(l, "theme.saveBtn"))}</button>
          <button type="button" id="resetAccentBtn" class="btn btn-outline">${esc(t(l, "theme.resetBtn"))}</button>
        </div>
        <div id="accentStatus" class="status"></div>
      </div>
    </div>

    <div class="profile-tab-panel" id="tab-erweitert">
      <div class="card">
        <h2 class="title">${esc(t(l, "profile.rawProfileTitle"))}</h2>
        <p class="subtitle">${esc(t(l, "profile.rawProfileSubtitle"))}</p>
        <textarea id="profileJson" spellcheck="false">${profileJson}</textarea>
        <div class="row">
          <button id="saveBtn" class="btn btn-primary">${esc(t(l, "common.save"))}</button>
          <button id="resetBtn" class="btn btn-outline">${esc(t(l, "profile.resetBtn"))}</button>
        </div>
        <div id="status" class="status"></div>
      </div>
    </div>
  </main>
  <script>
    (function () {
      var LBL = {
        linkLabelPh: ${JSON.stringify(t(l, "profile.linkLabelPlaceholder"))},
        linkUrlPh: ${JSON.stringify(t(l, "profile.linkUrlPlaceholder"))},
        removeLink: ${JSON.stringify(t(l, "profile.removeLink"))},
        importCvConfirm: ${JSON.stringify(t(l, "profile.importCvConfirm"))},
        invalidJson: ${JSON.stringify(t(l, "profile.invalidJson"))},
        savedOk: ${JSON.stringify(t(l, "profile.savedOk"))},
        errorPrefix: ${JSON.stringify(t(l, "common.errorPrefix"))},
        resetConfirm: ${JSON.stringify(t(l, "profile.resetConfirm"))},
        deleteDocConfirm: ${JSON.stringify(t(l, "profile.deleteDocConfirm"))},
        usernameChanged: ${JSON.stringify(t(l, "account.usernameChanged"))},
        passwordChanged: ${JSON.stringify(t(l, "account.passwordChanged"))},
        passwordMismatch: ${JSON.stringify(t(l, "account.passwordMismatch"))},
        invalidColor: ${JSON.stringify(t(l, "theme.invalidColor"))},
        experienceOrgLabel: ${JSON.stringify(t(l, "profile.experienceOrgLabel"))},
        experienceRoleLabel: ${JSON.stringify(t(l, "profile.experienceRoleLabel"))},
        experiencePeriodLabel: ${JSON.stringify(t(l, "profile.experiencePeriodLabel"))},
        experienceLocationLabel: ${JSON.stringify(t(l, "profile.experienceLocationLabel"))},
        experienceOngoingLabel: ${JSON.stringify(t(l, "profile.experienceOngoingLabel"))},
        experienceBulletsLabel: ${JSON.stringify(t(l, "profile.experienceBulletsLabel"))},
        experienceBulletsHint: ${JSON.stringify(t(l, "profile.experienceBulletsHint"))},
        experienceRemoveBtn: ${JSON.stringify(t(l, "profile.experienceRemoveBtn"))},
        experienceNoEntries: ${JSON.stringify(t(l, "profile.experienceNoEntries"))},
        experienceSupplementStatusAnalyzing: ${JSON.stringify(t(l, "profile.experienceSupplementStatusAnalyzing"))},
        experienceSupplementDone: ${JSON.stringify(t(l, "profile.experienceSupplementDone"))},
        experienceSupplementNoNew: ${JSON.stringify(t(l, "profile.experienceSupplementNoNew"))},
        experienceSupplementError: ${JSON.stringify(t(l, "profile.experienceSupplementError"))}
      };
      var DEFAULT_ACCENT_COLOR = ${JSON.stringify(DEFAULT_ACCENT)};
      var HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

      // ---------- Tabs (hash-based, survives the reloads several save
      // handlers below trigger) ----------
      var TAB_IDS = ['profil', 'erfahrung', 'dokumente', 'konto', 'erweitert'];
      function activateTab(id) {
        if (TAB_IDS.indexOf(id) === -1) id = 'profil';
        document.querySelectorAll('.profile-tab-btn').forEach(function (btn) {
          btn.classList.toggle('active', btn.dataset.tab === id);
        });
        document.querySelectorAll('.profile-tab-panel').forEach(function (panel) {
          panel.classList.toggle('active', panel.id === 'tab-' + id);
        });
      }
      document.querySelectorAll('.profile-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.dataset.tab;
          window.location.hash = id;
          activateTab(id);
        });
      });
      activateTab((window.location.hash || '#profil').replace('#', ''));

      function getParsedProfile() {
        try { return JSON.parse(document.getElementById('profileJson').value); }
        catch (e) { return null; }
      }
      function writeParsedProfile(obj) {
        document.getElementById('profileJson').value = JSON.stringify(obj, null, 2);
      }
      function buildLinkRow(label, url) {
        var div = document.createElement('div');
        div.className = 'link-row';
        var labelInput = document.createElement('input');
        labelInput.type = 'text'; labelInput.className = 'link-label'; labelInput.placeholder = LBL.linkLabelPh; labelInput.value = label || '';
        var urlInput = document.createElement('input');
        urlInput.type = 'text'; urlInput.className = 'link-url'; urlInput.placeholder = LBL.linkUrlPh; urlInput.value = url || '';
        var removeBtn = document.createElement('button');
        removeBtn.type = 'button'; removeBtn.className = 'btn btn-outline'; removeBtn.textContent = LBL.removeLink;
        labelInput.addEventListener('blur', syncContactIntoJson);
        urlInput.addEventListener('blur', syncContactIntoJson);
        removeBtn.addEventListener('click', function () { div.remove(); syncContactIntoJson(); });
        div.appendChild(labelInput); div.appendChild(urlInput); div.appendChild(removeBtn);
        return div;
      }
      function renderLinksList(links) {
        var wrap = document.getElementById('linksList');
        wrap.innerHTML = '';
        (links || []).forEach(function (link) { wrap.appendChild(buildLinkRow(link.label, link.url)); });
      }
      function populateContactFields() {
        var p = getParsedProfile();
        if (!p) return;
        var personal = p.personal || {};
        document.getElementById('cName').value = personal.name || '';
        document.getElementById('cEmail').value = personal.email || '';
        document.getElementById('cPhone').value = personal.telefon || '';
        document.getElementById('cStreet').value = personal.strasse || '';
        document.getElementById('cZip').value = personal.plz || '';
        document.getElementById('cCity').value = personal.ort || '';
        document.getElementById('cLinkedin').value = personal.linkedin || '';
        renderLinksList(p.links || []);
      }
      function syncContactIntoJson() {
        var p = getParsedProfile();
        if (!p) return; // underlying JSON currently invalid — don't clobber it
        p.personal = p.personal || {};
        p.personal.name = document.getElementById('cName').value;
        p.personal.email = document.getElementById('cEmail').value;
        p.personal.telefon = document.getElementById('cPhone').value;
        p.personal.strasse = document.getElementById('cStreet').value;
        p.personal.plz = document.getElementById('cZip').value;
        p.personal.ort = document.getElementById('cCity').value;
        p.personal.linkedin = document.getElementById('cLinkedin').value;
        var links = [];
        document.querySelectorAll('#linksList .link-row').forEach(function (row) {
          var label = row.querySelector('.link-label').value.trim();
          var url = row.querySelector('.link-url').value.trim();
          if (label || url) links.push({ label: label, url: url });
        });
        p.links = links;
        writeParsedProfile(p);
      }
      ['cName', 'cEmail', 'cPhone', 'cStreet', 'cZip', 'cCity', 'cLinkedin'].forEach(function (id) {
        document.getElementById(id).addEventListener('blur', syncContactIntoJson);
      });
      document.getElementById('addLinkBtn').addEventListener('click', function () {
        document.getElementById('linksList').appendChild(buildLinkRow('', ''));
      });
      document.getElementById('importCvBtn').addEventListener('click', function () {
        if (!confirm(LBL.importCvConfirm)) return;
        window.location.href = '/onboarding/cv-import?returnTo=' + encodeURIComponent('/profile');
      });
      populateContactFields();

      document.getElementById('saveContactBtn').addEventListener('click', async function () {
        syncContactIntoJson();
        var status = document.getElementById('contactStatus');
        var p = getParsedProfile();
        if (!p) { status.textContent = LBL.invalidJson; status.className = 'status err'; return; }
        status.textContent = '…';
        status.className = 'status';
        try {
          const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
          const data = await res.json();
          if (res.ok) { status.textContent = LBL.savedOk; status.className = 'status ok'; }
          else { status.textContent = LBL.errorPrefix + data.error; status.className = 'status err'; }
        } catch (err) {
          status.textContent = LBL.errorPrefix + err.message;
          status.className = 'status err';
        }
      });

      // ---------- Experience editor (manual add/edit/remove of positions,
      // synced into the hidden profileJson textarea on save) ----------
      function slugifyClient(s) {
        return String(s || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      var expEntries = [];
      function loadExpEntries() {
        var p = getParsedProfile();
        expEntries = (p && Array.isArray(p.experience)) ? JSON.parse(JSON.stringify(p.experience)) : [];
      }
      function buildExpField(labelText, value, onInput) {
        var wrap = document.createElement('div');
        var label = document.createElement('label');
        label.textContent = labelText;
        var input = document.createElement('input');
        input.type = 'text';
        input.value = value || '';
        input.addEventListener('input', function () { onInput(input.value); });
        wrap.appendChild(label);
        wrap.appendChild(input);
        return wrap;
      }
      function buildExpCard(entry, idx) {
        var card = document.createElement('div');
        card.className = 'exp-card';

        var row1 = document.createElement('div'); row1.className = 'field-row';
        row1.appendChild(buildExpField(LBL.experienceOrgLabel, entry.org, function (v) { entry.org = v; }));
        row1.appendChild(buildExpField(LBL.experienceRoleLabel, entry.role, function (v) { entry.role = v; }));
        card.appendChild(row1);

        var row2 = document.createElement('div'); row2.className = 'field-row';
        row2.appendChild(buildExpField(LBL.experiencePeriodLabel, entry.period, function (v) { entry.period = v; }));
        row2.appendChild(buildExpField(LBL.experienceLocationLabel, entry.location, function (v) { entry.location = v; }));
        card.appendChild(row2);

        var checkboxRow = document.createElement('div'); checkboxRow.className = 'checkbox-row';
        var checkboxId = 'expOngoing' + idx;
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox'; checkbox.id = checkboxId; checkbox.checked = Boolean(entry.ongoing);
        checkbox.addEventListener('change', function () { entry.ongoing = checkbox.checked; });
        var cbLabel = document.createElement('label');
        cbLabel.setAttribute('for', checkboxId);
        cbLabel.textContent = LBL.experienceOngoingLabel;
        checkboxRow.appendChild(checkbox); checkboxRow.appendChild(cbLabel);
        card.appendChild(checkboxRow);

        var bulletsLabel = document.createElement('label');
        bulletsLabel.style.marginTop = '14px';
        bulletsLabel.textContent = LBL.experienceBulletsLabel;
        var bulletsHint = document.createElement('div');
        bulletsHint.style.cssText = 'margin:2px 0 8px;font-size:12px;color:var(--grey);';
        bulletsHint.textContent = LBL.experienceBulletsHint;
        var bulletsArea = document.createElement('textarea');
        bulletsArea.rows = 4;
        bulletsArea.value = Array.isArray(entry.bullets) ? entry.bullets.join('\\n') : '';
        bulletsArea.addEventListener('input', function () {
          entry.bullets = bulletsArea.value.split('\\n').map(function (s) { return s.trim(); }).filter(Boolean);
        });
        card.appendChild(bulletsLabel);
        card.appendChild(bulletsHint);
        card.appendChild(bulletsArea);

        var removeRow = document.createElement('div'); removeRow.className = 'row exp-remove-row';
        var removeBtn = document.createElement('button');
        removeBtn.type = 'button'; removeBtn.className = 'btn btn-outline';
        removeBtn.style.color = '#b3261e'; removeBtn.style.borderColor = '#f3c6c6';
        removeBtn.textContent = LBL.experienceRemoveBtn;
        removeBtn.addEventListener('click', function () {
          expEntries.splice(idx, 1);
          renderExpList();
        });
        removeRow.appendChild(removeBtn);
        card.appendChild(removeRow);

        return card;
      }
      function renderExpList() {
        var wrap = document.getElementById('expList');
        wrap.innerHTML = '';
        if (!expEntries.length) {
          var empty = document.createElement('div');
          empty.style.cssText = 'padding:8px 0;font-size:13.5px;color:var(--grey);';
          empty.textContent = LBL.experienceNoEntries;
          wrap.appendChild(empty);
          return;
        }
        expEntries.forEach(function (entry, idx) {
          wrap.appendChild(buildExpCard(entry, idx));
        });
      }
      document.getElementById('addExpBtn').addEventListener('click', function () {
        expEntries.push({ id: '', org: '', role: '', period: '', ongoing: false, location: '', type: 'sonstiges', tags: [], bullets: [] });
        renderExpList();
      });
      document.getElementById('saveExpBtn').addEventListener('click', async function () {
        var status = document.getElementById('expStatus');
        var p = getParsedProfile();
        if (!p) { status.textContent = LBL.invalidJson; status.className = 'status err'; return; }
        var usedIds = {};
        var finalEntries = expEntries.map(function (entry, i) {
          var id = entry.id;
          if (!id) id = slugifyClient(entry.org + '-' + entry.role) || ('erfahrung-' + (i + 1));
          while (usedIds[id]) id = id + '-' + (i + 1);
          usedIds[id] = true;
          return {
            id: id,
            org: entry.org || '',
            role: entry.role || '',
            period: entry.period || '',
            ongoing: Boolean(entry.ongoing),
            location: entry.location || '',
            type: entry.type || 'sonstiges',
            tags: Array.isArray(entry.tags) ? entry.tags : [],
            bullets: Array.isArray(entry.bullets) ? entry.bullets : []
          };
        });
        p.experience = finalEntries;
        writeParsedProfile(p);
        status.textContent = '…';
        status.className = 'status';
        try {
          const res = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
          const data = await res.json();
          if (res.ok) { status.textContent = LBL.savedOk; status.className = 'status ok'; }
          else { status.textContent = LBL.errorPrefix + data.error; status.className = 'status err'; }
        } catch (err) {
          status.textContent = LBL.errorPrefix + err.message;
          status.className = 'status err';
        }
      });
      loadExpEntries();
      renderExpList();

      document.getElementById('expImportFile').addEventListener('change', async function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var status = document.getElementById('expImportStatus');
        status.textContent = LBL.experienceSupplementStatusAnalyzing;
        status.className = 'status';
        var formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('/api/profile/experience/import', { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok) {
            if (data.addedCount > 0) {
              status.textContent = LBL.experienceSupplementDone.replace('{{n}}', data.addedCount);
              status.className = 'status ok';
              window.location.hash = 'erfahrung';
              setTimeout(function () { window.location.reload(); }, 900);
            } else {
              status.textContent = LBL.experienceSupplementNoNew;
              status.className = 'status';
            }
          } else {
            status.textContent = LBL.errorPrefix + data.error;
            status.className = 'status err';
          }
        } catch (err) {
          status.textContent = LBL.experienceSupplementError;
          status.className = 'status err';
        }
      });

      document.getElementById('logoutLink').addEventListener('click', async (e) => {
        e.preventDefault();
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
      });
      document.querySelectorAll('[data-media]').forEach((input) => {
        input.addEventListener('change', async () => {
          const file = input.files[0];
          if (!file) return;
          const key = input.dataset.media;
          const status = document.getElementById('mediaStatus');
          status.textContent = '…';
          status.className = 'status';
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/media/' + key, { method: 'POST', body: formData });
          const data = await res.json();
          if (res.ok) { status.textContent = LBL.savedOk; status.className = 'status ok'; setTimeout(() => window.location.reload(), 800); }
          else { status.textContent = LBL.errorPrefix + data.error; status.className = 'status err'; }
        });
      });
      document.getElementById('libFile').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const status = document.getElementById('libStatus');
        status.textContent = '…';
        status.className = 'status';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', document.getElementById('libTitle').value);
        formData.append('category', document.getElementById('libCategory').value);
        formData.append('skillsText', document.getElementById('libSkills').value);
        const res = await fetch('/api/documents/library', { method: 'POST', body: formData });
        const data = await res.json();
        if (res.ok) { status.textContent = LBL.savedOk; status.className = 'status ok'; setTimeout(() => window.location.reload(), 800); }
        else { status.textContent = LBL.errorPrefix + data.error; status.className = 'status err'; }
      });
      document.querySelectorAll('[data-lib-delete]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm(LBL.deleteDocConfirm)) return;
          const id = btn.dataset.libDelete;
          const res = await fetch('/api/documents/library/' + id, { method: 'DELETE' });
          if (res.ok) window.location.reload();
        });
      });
      document.getElementById('saveBtn').addEventListener('click', async () => {
        const status = document.getElementById('status');
        const raw = document.getElementById('profileJson').value;
        let parsed;
        try { parsed = JSON.parse(raw); }
        catch (e) { status.textContent = LBL.invalidJson + e.message; status.className = 'status err'; return; }
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed)
        });
        const data = await res.json();
        if (res.ok) { status.textContent = LBL.savedOk; status.className = 'status ok'; }
        else { status.textContent = LBL.errorPrefix + data.error; status.className = 'status err'; }
      });
      document.getElementById('resetBtn').addEventListener('click', async () => {
        if (!confirm(LBL.resetConfirm)) return;
        const res = await fetch('/api/profile/reset', { method: 'POST' });
        if (res.ok) window.location.reload();
      });

      document.getElementById('saveUsernameBtn').addEventListener('click', async () => {
        const status = document.getElementById('usernameStatus');
        const newUsername = document.getElementById('accNewUsername').value.trim();
        const currentPassword = document.getElementById('accUsernameCurrentPassword').value;
        status.textContent = '…';
        status.className = 'status';
        const res = await fetch('/api/account/username', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newUsername: newUsername, currentPassword: currentPassword })
        });
        const data = await res.json();
        if (res.ok) {
          status.textContent = LBL.usernameChanged;
          status.className = 'status ok';
          document.getElementById('accUsernameCurrentPassword').value = '';
          window.location.hash = 'konto';
          setTimeout(() => window.location.reload(), 800);
        } else {
          status.textContent = LBL.errorPrefix + data.error;
          status.className = 'status err';
        }
      });

      document.getElementById('savePasswordBtn').addEventListener('click', async () => {
        const status = document.getElementById('passwordStatus');
        const currentPassword = document.getElementById('accPasswordCurrentPassword').value;
        const newPassword = document.getElementById('accNewPassword').value;
        const newPasswordConfirm = document.getElementById('accNewPasswordConfirm').value;
        if (newPassword !== newPasswordConfirm) {
          status.textContent = LBL.passwordMismatch;
          status.className = 'status err';
          return;
        }
        status.textContent = '…';
        status.className = 'status';
        const res = await fetch('/api/account/password', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
        });
        const data = await res.json();
        if (res.ok) {
          status.textContent = LBL.passwordChanged;
          status.className = 'status ok';
          document.getElementById('accPasswordCurrentPassword').value = '';
          document.getElementById('accNewPassword').value = '';
          document.getElementById('accNewPasswordConfirm').value = '';
        } else {
          status.textContent = LBL.errorPrefix + data.error;
          status.className = 'status err';
        }
      });

      // Accent-color card: a native color picker + a synced hex text input,
      // with an immediate live preview (CSS custom property update, no
      // reload needed) before the value is actually saved. Saving reuses the
      // same /api/profile endpoint as the raw-JSON editor below — accentColor
      // is just another field on the same profile object.
      (function () {
        var picker = document.getElementById('accentColorPicker');
        var hexInput = document.getElementById('accentColorHex');
        var status = document.getElementById('accentStatus');

        function applyPreview(hex) {
          if (!HEX_COLOR_RE.test(hex)) return;
          document.documentElement.style.setProperty('--accent', hex);
        }

        picker.addEventListener('input', function () {
          hexInput.value = picker.value;
          applyPreview(picker.value);
        });
        hexInput.addEventListener('input', function () {
          var v = hexInput.value.trim();
          if (HEX_COLOR_RE.test(v)) {
            picker.value = v;
            applyPreview(v);
          }
        });

        document.getElementById('saveAccentBtn').addEventListener('click', async function () {
          var hex = hexInput.value.trim();
          if (!HEX_COLOR_RE.test(hex)) {
            status.textContent = LBL.invalidColor;
            status.className = 'status err';
            return;
          }
          var p = getParsedProfile();
          if (!p) {
            status.textContent = LBL.invalidJson;
            status.className = 'status err';
            return;
          }
          p.accentColor = hex;
          writeParsedProfile(p);
          status.textContent = '…';
          status.className = 'status';
          try {
            const res = await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(p)
            });
            const data = await res.json();
            if (res.ok) {
              status.textContent = LBL.savedOk;
              status.className = 'status ok';
              window.location.hash = 'konto';
              setTimeout(() => window.location.reload(), 600);
            } else {
              status.textContent = LBL.errorPrefix + data.error;
              status.className = 'status err';
            }
          } catch (err) {
            status.textContent = LBL.errorPrefix + err.message;
            status.className = 'status err';
          }
        });

        document.getElementById('resetAccentBtn').addEventListener('click', function () {
          hexInput.value = DEFAULT_ACCENT_COLOR;
          picker.value = DEFAULT_ACCENT_COLOR;
          applyPreview(DEFAULT_ACCENT_COLOR);
        });
      })();
    })();
  </script>
</body>
</html>`;
}

module.exports = { renderProfilePage };
