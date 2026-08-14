(function () {
  // Mirrors lib/mailto.js's buildApplicationMailto server-side logic, for the
  // freshly-generated result panel (no page reload needed to get the link).
  function buildMailto(generated, slug) {
    const g = generated || {};
    const to = String(g.contactEmail || "").trim();
    const subject = g.emailSubject || "Bewerbung als " + (g.jobTitle || "");
    const base = window.location.origin;
    const links = [
      "Lebenslauf (PDF): " + base + "/pdf/" + slug + "/cv",
      "Motivationsschreiben (PDF): " + base + "/pdf/" + slug + "/cover",
      "Digitale Bewerbungsseite: " + base + "/a/" + slug
    ];
    const body = (g.emailBody || "") + "\n\n---\nUnterlagen zum Download:\n" + links.join("\n");
    const qs = "subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return "mailto:" + to + "?" + qs;
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

  generateBtn.addEventListener("click", async () => {
    const jobText = document.getElementById("jobText").value.trim();
    const jobUrl = document.getElementById("jobUrl").value.trim();
    const activeTab = document.querySelector(".tab-btn.active").dataset.tab;

    if (activeTab === "text" && !jobText) {
      genStatus.textContent = "Bitte zuerst den Stelleninserat-Text einfügen.";
      genStatus.className = "status err";
      return;
    }
    if (activeTab === "url" && !jobUrl) {
      genStatus.textContent = "Bitte zuerst einen Link einfügen.";
      genStatus.className = "status err";
      return;
    }

    generateBtn.disabled = true;
    spinner.classList.add("on");
    genStatus.textContent = "Generiere massgeschneiderte Bewerbung … (kann 15–30 Sekunden dauern)";
    genStatus.className = "status";
    result.style.display = "none";

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeTab === "url" ? { jobUrl } : { jobText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");

      if (data.duplicateWarning) {
        const w = data.duplicateWarning;
        const dateStr = new Date(w.createdAt).toLocaleDateString("de-CH");
        alert(
          "⚠️ Achtung: Du hast dich bei dieser Firma bereits am " + dateStr + " beworben (Status: " +
          (w.statusLabel || w.status) + "). Diese neue Bewerbung wurde trotzdem gespeichert — bitte unten in der Liste prüfen und ggf. eine der beiden löschen."
        );
      }

      document.getElementById("emailText").value =
        (data.generated.emailSubject ? "Betreff: " + data.generated.emailSubject + "\n\n" : "") +
        data.generated.emailBody +
        "\n\nBeilagen: Lebenslauf, Motivationsschreiben, Lehrzeugnis R. Nussbaum AG, Fähigkeitszeugnis EFZ";
      document.getElementById("coverText").value = data.generated.coverLetterBody;
      document.getElementById("dlCv").href = `/pdf/${data.slug}/cv`;
      document.getElementById("dlCover").href = `/pdf/${data.slug}/cover`;
      document.getElementById("dlApp").href = `/a/${data.slug}`;
      document.getElementById("appUrl").value = window.location.origin + "/a/" + data.slug;
      document.getElementById("dlMailto").href = buildMailto(data.generated, data.slug);
      document.getElementById("dlEml").href = "/api/applications/" + data.slug + "/eml";
      document.getElementById("mailtoHint").textContent = (data.generated.contactEmail
        ? "Wird vorbereitet an: " + data.generated.contactEmail + ". "
        : "Im Inserat wurde keine Kontakt-E-Mail gefunden — bitte Empfänger manuell eintragen. ") +
        "Direkt öffnen = schnell, aber ohne echten Anhang (nur Links im Text). Herunterladen = mit Lebenslauf + Motivationsschreiben als echtem PDF-Anhang, danach im Mail-Programm öffnen und weiterleiten/senden.";

      result.style.display = "block";
      genStatus.textContent = "Fertig! Unten findest du alle Texte, Downloads und die digitale Bewerbungsseite.";
      setTimeout(() => window.location.reload(), 4000);
    } catch (err) {
      genStatus.textContent = "Fehler: " + err.message;
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
        btn.textContent = "Kopiert ✓";
        setTimeout(() => (btn.textContent = old), 1500);
      });
    });
  });

  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Diese Bewerbung wirklich löschen? (Die digitale Seite ist danach nicht mehr erreichbar.)")) return;
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
      if (!confirm("Diese gespeicherte Suche entfernen?")) return;
      const id = btn.dataset.deleteSearch;
      try {
        const res = await fetch(`/api/searches/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        btn.closest(".search-chip").remove();
      } catch {
        alert("Suche konnte nicht entfernt werden.");
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
      link.textContent = "🔎 Recherchiere … (ca. 15–20s)";
      link.style.pointerEvents = "none";
      try {
        const res = await fetch(`/api/applications/${slug}/company-insights`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unbekannter Fehler");
        window.open(`/pdf/${slug}/insights`, "_blank");
        window.location.reload();
      } catch (err) {
        alert("Firmen-Insights konnten nicht erstellt werden: " + err.message);
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
      if (nextDisabled && !confirm("Öffentliche Bewerbungsseite und PDF-Downloads für diese Bewerbung offline nehmen? Ein bereits versendeter Link zeigt danach nur noch 'nicht mehr verfügbar'. Im Dashboard bleibt alles erhalten.")) {
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
        alert("Konnte den Status der öffentlichen Seite nicht ändern.");
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
        alert("Status konnte nicht gespeichert werden.");
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
        alert("Notiz konnte nicht gespeichert werden.");
      }
    });
  });

  // ---- Status-Filter ----
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
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
})();
