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

    <div class="card">
      <h2 class="title" style="font-size:18px;">${esc(t(l, "account.title"))}</h2>
      <p class="subtitle">${esc(t(l, "account.subtitle"))}</p>
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

      <div class="field-row" style="margin-top:26px;">
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
        <div><label>${esc(t(l, "profile.fieldPhone"))}</label><input type="text" id="cPhone"></div>
      </div>
      <div class="field-row">
        <div><label>${esc(t(l, "profile.fieldStreet"))}</label><input type="text" id="cStreet"></div>
        <div><label>${esc(t(l, "profile.fieldZip"))}</label><input type="text" id="cZip"></div>
        <div><label>${esc(t(l, "profile.fieldCity"))}</label><input type="text" id="cCity"></div>
      </div>
      <div class="field-row">
        <div style="flex-basis:100%;"><label>${esc(t(l, "profile.fieldLinkedin"))}</label><input type="text" id="cLinkedin" placeholder="linkedin.com/in/…"></div>
      </div>
      <label style="margin-top:22px;">${esc(t(l, "profile.otherLinksTitle"))}</label>
      <div class="subtitle" style="margin:2px 0 0;font-size:12.5px;">${esc(t(l, "profile.otherLinksHint"))}</div>
      <div id="linksList"></div>
      <div class="row">
        <button type="button" id="addLinkBtn" class="btn btn-outline">${esc(t(l, "profile.addLink"))}</button>
      </div>
      <div class="row">
        <button type="button" id="importCvBtn" class="btn btn-outline">${esc(t(l, "profile.importCvBtn"))}</button>
      </div>
    </div>

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
        invalidColor: ${JSON.stringify(t(l, "theme.invalidColor"))}
      };
      var DEFAULT_ACCENT_COLOR = ${JSON.stringify(DEFAULT_ACCENT)};
      var HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

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
