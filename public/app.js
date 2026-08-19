(function () {
  // Server-injected translations (see lib/pages/indexPage.js) — APP_I18N is
  // the dashboard's own UI language, MAIL_I18N carries all three languages
  // fully so the "just generated" result panel below can render its mailto
  // boilerplate in THAT application's language (data.generated.language),
  // independent of the dashboard's own UI language.
  const I18N = window.APP_I18N || {};
  const MAIL_I18N = window.MAIL_I18N || {};
  const APP_LANG = window.APP_LANG || "de";

  // Mirrors lib/mailto.js's buildApplicationMailto server-side logic, for the
  // freshly-generated result panel (no page reload needed to get the link).
  function buildMailto(generated, slug) {
    const g = generated || {};
    const mi = MAIL_I18N[g.language] || MAIL_I18N[APP_LANG] || {};
    const to = String(g.contactEmail || "").trim();
    const subject = g.emailSubject || (mi.defaultSubject || "%JOB_TITLE%").replace("%JOB_TITLE%", g.jobTitle || "");
    const base = window.location.origin;
    const links = [
      (mi.cvLine || "%URL_CV%").replace("%URL_CV%", base + "/pdf/" + slug + "/cv"),
      (mi.coverLine || "%URL_COVER%").replace("%URL_COVER%", base + "/pdf/" + slug + "/cover"),
      (mi.appPageLine || "%URL_APP%").replace("%URL_APP%", base + "/a/" + slug)
    ];
    const body = (g.emailBody || "") + "\n\n---\n" + (mi.downloadsHeader || "") + "\n" + links.join("\n");
    const qs = "subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return "mailto:" + to + "?" + qs;
  }

  // ---- Logout ----
  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    });
  }

  const tabBtns = document.querySelectorAll(".tab-btn");
  const fieldText = document.getElementById("field-text");
  const fieldUrl = document.getElementById("field-url");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      fieldText.classList.toggle("active", tab === "text");
      fieldUrl.classList.toggle("active", tab === "url");
    });
  });

  const generateBtn = document.getElementById("generateBtn");
  const spinner = document.getElementById("spinner");
  const genStatus = document.getElementById("genStatus");
  const result = document.getElementById("result");

  const jobLangSelect = document.getElementById("jobLang");

  generateBtn.addEventListener("click", async () => {
    const jobText = document.getElementById("jobText").value.trim();
    const jobUrl = document.getElementById("jobUrl").value.trim();
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;
    const language = (jobLangSelect && jobLangSelect.value) || APP_LANG;

    if (activeTab === "text" && !jobText) {
      genStatus.textContent = I18N.errorNeedText || "Bitte zuerst den Stelleninserat-Text einfügen.";
      genStatus.className = "status err";
      return;
    }
    if (activeTab === "url" && !jobUrl) {
      genStatus.textContent = I18N.errorNeedUrl || "Bitte zuerst einen Link einfügen.";
      genStatus.className = "status err";
      return;
    }

    generateBtn.disabled = true;
    spinner.classList.add("on");
    genStatus.textContent = I18N.generating || "Generiere massgeschneiderte Bewerbung … (kann 15–30 Sekunden dauern)";
    genStatus.className = "status";
    result.style.display = "none";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign(activeTab === "url" ? { jobUrl } : { jobText }, { language }))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || I18N.errorGeneric || "Unbekannter Fehler");

      if (data.duplicateWarning) {
        const w = data.duplicateWarning;
        const dateStr = new Date(w.createdAt).toLocaleDateString();
        const tmpl = I18N.duplicateWarningTemplate || "⚠️ %DATE% / %STATUS%";
        alert(tmpl.replace("%DATE%", dateStr).replace("%STATUS%", w.statusLabel || w.status));
      }

      const mi = MAIL_I18N[data.generated.language] || MAIL_I18N[APP_LANG] || {};
      document.getElementById("emailText").value =
        (data.generated.emailSubject ? "Betreff: " + data.generated.emailSubject + "\n\n" : "") +
        data.generated.emailBody +
        (mi.attachmentsSuffix || "");
      document.getElementById("coverText").value = data.generated.coverLetterBody;
      document.getElementById("dlCv").href = `/pdf/${data.slug}/cv`;
      document.getElementById("dlCover").href = `/pdf/${data.slug}/cover`;
      document.getElementById("dlApp").href = `/a/${data.slug}`;
      document.getElementById("appUrl").value = window.location.origin + "/a/" + data.slug;
      document.getElementById("dlMailto").href = buildMailto(data.generated, data.slug);
      document.getElementById("dlEml").href = "/api/applications/" + data.slug + "/eml";
      document.getElementById("mailtoHint").textContent =
        (data.generated.contactEmail
          ? (I18N.mailtoHintWithEmail || "%EMAIL%").replace("%EMAIL%", data.generated.contactEmail)
          : I18N.mailtoHintNoEmail || "") + (I18N.mailtoHintSuffix || "");

      result.style.display = "block";
      genStatus.textContent = I18N.generatedDone || "Fertig!";
      setTimeout(() => window.location.reload(), 4000);
    } catch (err) {
      genStatus.textContent = (I18N.errorPrefix || "Fehler: ") + err.message;
      genStatus.className = "status err";
    } finally {
      generateBtn.disabled = false;
      spinner.classList.remove("on");
    }
  });

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.dataset.copy);
      el.select();
      navigator.clipboard.writeText(el.value).then(() => {
        const old = btn.textContent;
        btn.textContent = I18N.copiedBtn || "Kopiert ✓";
        setTimeout(() => (btn.textContent = old), 1500);
      });
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(I18N.deleteAppConfirm || "Diese Bewerbung wirklich löschen?")) return;
      const slug = btn.dataset.delete;
      const res = await fetch(`/api/applications/${slug}`, { method: "DELETE" });
      if (res.ok) btn.closest("tr").remove();
    });
  });

  // ---- Gespeicherte Suchen (Jobsuche-Schnellzugriff) ----
  const addSearchForm = document.getElementById("addSearchForm");
  if (addSearchForm) {
    addSearchForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const label = document.getElementById("searchLabel").value.trim();
      const url = document.getElementById("searchUrl").value.trim();
      const searchStatus = document.getElementById("searchStatus");
      if (!label || !url) return;
      try {
        const res = await fetch("/api/searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, url })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
        window.location.reload();
      } catch (err) {
        searchStatus.textContent = "Fehler: " + err.message;
        searchStatus.className = "status err";
      }
    });
  }

  document.querySelectorAll("[data-delete-search]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm(I18N.deleteSearchConfirm || "Diese gespeicherte Suche entfernen?")) return;
      const id = btn.dataset.deleteSearch;
      try {
        const res = await fetch(`/api/searches/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        btn.closest(".search-chip").remove();
      } catch {
        alert(I18N.searchRemoveError || "Suche konnte nicht entfernt werden.");
      }
    });
  });

  // ---- Nachfassen: Mail öffnen + Status im Hintergrund auf "Follow-up gemacht" setzen ----
  // Kein preventDefault: der mailto:-Link soll ganz normal das Mail-Programm
  // öffnen (das entlädt die Seite nicht), der Status-PATCH läuft parallel dazu.
  document.querySelectorAll("[data-followup]").forEach((link) => {
    link.addEventListener("click", async () => {
      const slug = link.dataset.followup;
      try {
        const res = await fetch(`/api/applications/${slug}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "follow_up" })
        });
        if (!res.ok) return;
        const tr = document.querySelector(`tr[data-row="${slug}"]`);
        if (!tr) return;
        const sel = tr.querySelector("[data-status-select]");
        const dot = tr.querySelector(".status-dot");
        if (sel) {
          sel.value = "follow_up";
          const opt = sel.options[sel.selectedIndex];
          if (dot && opt) dot.style.background = opt.dataset.color || dot.style.background;
        }
        tr.dataset.status = "follow_up";
      } catch {
        // Stiller Fehlschlag: Die Mail wurde trotzdem geöffnet, der
        // Status-Update ist nur ein Komfort-Extra.
      }
    });
  });

  // ---- Firmen-Insights: Live-Websuche + PDF-Briefing zur Gesprächsvorbereitung ----
  // Dauert ca. 15-20s (Websuche + KI-Aufbereitung), daher sichtbares
  // Zwischen-Feedback im Button-Text statt einer stillen Wartezeit.
  document.querySelectorAll("[data-gen-insights], [data-regen-insights]").forEach((link) => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const slug = link.dataset.genInsights || link.dataset.regenInsights;
      const original = link.textContent;
      link.textContent = I18N.insightsResearching || "🔎 Recherchiere …";
      link.style.pointerEvents = "none";
      try {
        const res = await fetch(`/api/applications/${slug}/company-insights`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || I18N.errorGeneric || "Unbekannter Fehler");
        window.open(`/pdf/${slug}/insights`, "_blank");
        window.location.reload();
      } catch (err) {
        alert((I18N.insightsError || "Fehler: ") + err.message);
        link.textContent = original;
        link.style.pointerEvents = "";
      }
    });
  });

  // ---- Öffentliche Seite deaktivieren/aktivieren (Datenschutz) ----
  document.querySelectorAll("[data-toggle-public]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.togglePublic;
      const currentlyDisabled = btn.dataset.publicDisabled === "1";
      const nextDisabled = !currentlyDisabled;
      if (nextDisabled && !confirm(I18N.deactivateConfirm || "Öffentliche Seite offline nehmen?")) {
        return;
      }
      try {
        const res = await fetch(`/api/applications/${slug}/public`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disabled: nextDisabled })
        });
        if (!res.ok) throw new Error();
        window.location.reload();
      } catch {
        alert(I18N.publicToggleError || "Konnte den Status der öffentlichen Seite nicht ändern.");
      }
    });
  });

  // ---- Status-Dropdown pro Bewerbung ----
  document.querySelectorAll("[data-status-select]").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const slug = sel.dataset.statusSelect;
      const dot = sel.closest(".status-select-wrap").querySelector(".status-dot");
      const prevColor = dot.style.background;
      try {
        const res = await fetch(`/api/applications/${slug}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: sel.value })
        });
        if (!res.ok) throw new Error();
        const opt = sel.options[sel.selectedIndex];
        dot.style.background = opt.dataset.color || prevColor;
        sel.closest("tr").dataset.status = sel.value;
      } catch {
        alert(I18N.statusSaveError || "Status konnte nicht gespeichert werden.");
      }
    });
  });

  // ---- Notiz pro Bewerbung (speichert beim Verlassen des Felds) ----
  document.querySelectorAll("[data-note-input]").forEach((input) => {
    let lastSaved = input.value;
    input.addEventListener("blur", async () => {
      if (input.value === lastSaved) return;
      const slug = input.dataset.noteInput;
      try {
        const res = await fetch(`/api/applications/${slug}/note`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: input.value })
        });
        if (!res.ok) throw new Error();
        lastSaved = input.value;
      } catch {
        alert(I18N.noteSaveError || "Notiz konnte nicht gespeichert werden.");
      }
    });
  });

  // ---- Status-Filter ----
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      // Close any open RAV panel first -- otherwise one can be left visible
      // hanging below a row the filter just hid.
      document.querySelectorAll(".rav-panel-row.rav-open").forEach((tr) => tr.classList.remove("rav-open"));
      const wanted = statusFilter.value;
      const rows = document.querySelectorAll("#appTableBody tr[data-row]");
      let visibleCount = 0;
      rows.forEach((tr) => {
        const match = !wanted || tr.dataset.status === wanted;
        tr.toggleAttribute("data-hidden", !match);
        if (match) visibleCount++;
      });
      const emptyMsg = document.getElementById("filterEmpty");
      if (emptyMsg) emptyMsg.style.display = rows.length && !visibleCount ? "block" : "none";
    });
  }

  // ---- RAV-Angaben pro Bewerbung (Nachweis der persönlichen Arbeitsbemühungen) ----
  // Toggle: show/hide the hidden panel row injected right below each
  // application row (see lib/pages/indexPage.js ravPanelRow).
  document.querySelectorAll("[data-rav-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.ravToggle;
      const panel = document.querySelector(`[data-rav-panel="${slug}"]`);
      if (panel) panel.classList.toggle("rav-open");
    });
  });

  document.querySelectorAll("[data-rav-save]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const slug = btn.dataset.ravSave;
      const panel = document.querySelector(`[data-rav-panel="${slug}"]`);
      if (!panel) return;
      const statusEl = panel.querySelector(`[data-rav-status="${slug}"]`);
      const body = {
        ravAssignment: panel.querySelector(`[data-rav-assignment="${slug}"]`).checked,
        pensumType: panel.querySelector(`[data-rav-pensum-type="${slug}"]`).value,
        pensumPercent: panel.querySelector(`[data-rav-pensum-percent="${slug}"]`).value,
        bewerbungsart: panel.querySelector(`[data-rav-art="${slug}"]`).value,
        companyAddress: panel.querySelector(`[data-rav-address="${slug}"]`).value,
        contactPhone: panel.querySelector(`[data-rav-phone="${slug}"]`).value,
        absagegrund: panel.querySelector(`[data-rav-reason="${slug}"]`).value
      };
      if (statusEl) { statusEl.textContent = "…"; statusEl.className = "status"; }
      try {
        const res = await fetch(`/api/applications/${slug}/rav`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error();
        if (statusEl) { statusEl.textContent = I18N.ravSaveOk || "Gespeichert ✓"; statusEl.className = "status ok"; }
      } catch {
        if (statusEl) { statusEl.textContent = I18N.ravSaveError || "Konnte nicht gespeichert werden."; statusEl.className = "status err"; }
      }
    });
  });

  // ---- RAV-Nachweis PDF (Monat/Jahr) ----
  const ravMonthLocale = { de: "de-CH", fr: "fr-CH", en: "en-US" }[APP_LANG] || "de-CH";
  function ravFilenameFor(year, month) {
    return `Nachweis_Arbeitsbemuehungen_${year}-${String(month).padStart(2, "0")}.pdf`;
  }
  function ravSelectedYearMonth() {
    const monthInput = document.getElementById("ravMonth");
    const value = monthInput && monthInput.value; // "YYYY-MM"
    if (!value) return null;
    const [year, month] = value.split("-").map((n) => parseInt(n, 10));
    return { year, month };
  }

  const ravDownloadBtn = document.getElementById("ravDownloadBtn");
  if (ravDownloadBtn) {
    ravDownloadBtn.addEventListener("click", () => {
      const ym = ravSelectedYearMonth();
      if (!ym) return;
      window.open(`/pdf/nachweis/${ym.year}/${ym.month}`, "_blank");
    });
  }

  // "An Berater:in senden": since a mailto: link can never carry a real file
  // attachment (see the .eml route above for why that route exists instead
  // for the regular application emails), this opens the PDF download AND a
  // prefilled mailto: side by side — the person still has to attach the
  // just-downloaded PDF themselves in their mail client.
  const ravSendBtn = document.getElementById("ravSendBtn");
  if (ravSendBtn) {
    ravSendBtn.addEventListener("click", () => {
      const ym = ravSelectedYearMonth();
      if (!ym) return;
      const monthLabel = new Date(ym.year, ym.month - 1, 1).toLocaleDateString(ravMonthLocale, { month: "long", year: "numeric" });
      const filename = ravFilenameFor(ym.year, ym.month);
      const advisorName = I18N.ravAdvisorName || "";
      const applicantName = I18N.applicantName || "";
      const greeting = advisorName
        ? (I18N.ravMailtoGreetingWithName || "%NAME%").replace("%NAME%", advisorName)
        : I18N.ravMailtoGreetingGeneric || "";
      const subject = (I18N.ravMailtoSubjectTemplate || "%MONTH%").replace("%MONTH%", monthLabel).replace("%NAME%", applicantName);
      const body =
        greeting +
        "\n\n" +
        (I18N.ravMailtoBodyTemplate || "").replace("%MONTH%", monthLabel).replace("%FILENAME%", filename) +
        "\n\n" +
        (I18N.ravMailtoClosing || "") +
        "\n" +
        applicantName;
      window.open(`/pdf/nachweis/${ym.year}/${ym.month}`, "_blank");
      window.location.href = `mailto:${(I18N.ravAdvisorEmail || "").trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
