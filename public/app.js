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
      document.getElementById("mailtoHint").textContent = data.generated.contactEmail
        ? "Wird vorbereitet an: " + data.generated.contactEmail + " — Anhänge sind als Links im Text enthalten (E-Mail-Programme können keine Dateien automatisch anhängen)."
        : "Im Inserat wurde keine Kontakt-E-Mail gefunden — bitte Empfänger im E-Mail-Programm manuell eintragen. Anhänge sind als Links im Text enthalten.";

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
