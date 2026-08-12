(function () {
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
})();
