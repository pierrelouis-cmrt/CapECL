// SYSTÈME DE FILTRAGE DES MANUELS (avec persistance)
document.addEventListener("DOMContentLoaded", function () {
  const yearFilters = document.querySelectorAll('input[name="year"]');
  const subjectFilters = document.querySelectorAll('input[name="subject"]');
  const resetButton = document.querySelector(".filter-reset");
  const manualItems = document.querySelectorAll(".manual-item");
  const resultsCount = document.querySelector(".results-count");
  const noResults = document.querySelector(".no-results");

  const STORAGE_KEY = "manualFilters:v1"; // changez la version si vous modifiez la structure

  // --- Persistance ---
  function saveFilters(year, subjects) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ year, subjects }));
    } catch (_) {
      // stockage indisponible (quota, mode privé...) : ignorer
    }
  }

  function loadFilters() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const { year, subjects } = JSON.parse(raw) || {};

      // Restaurer l'année (radio)
      if (year) {
        let found = false;
        yearFilters.forEach((input) => {
          if (input.value === year) {
            input.checked = true;
            found = true;
          }
        });
        // si l'année sauvegardée n'existe plus: ne rien forcer
      }

      // Restaurer les matières (checkboxes)
      if (Array.isArray(subjects) && subjects.length) {
        // Tout décocher d'abord
        subjectFilters.forEach((input) => (input.checked = false));
        // Puis cocher celles sauvegardées si elles existent toujours
        subjectFilters.forEach((input) => {
          if (subjects.includes(input.value)) input.checked = true;
        });
      }
    } catch (_) {
      // JSON invalide : ignorer
    }
  }

  function getSelectedYear() {
    const checked = document.querySelector('input[name="year"]:checked');
    return checked ? checked.value : undefined;
  }

  function getSelectedSubjects() {
    return Array.from(
      document.querySelectorAll('input[name="subject"]:checked')
    ).map((i) => i.value);
  }

  function updateResults() {
    // Lire l'état courant des filtres
    let selectedYear = getSelectedYear();
    const selectedSubjects = getSelectedSubjects();

    // Sécurité: s'il n'y a aucune année cochée, cocher la première disponible
    if (!selectedYear && yearFilters.length) {
      yearFilters[0].checked = true;
      selectedYear = yearFilters[0].value;
    }

    // Sauvegarder l'état courant
    saveFilters(selectedYear, selectedSubjects);

    // Phase 1: Faire disparaître tous les éléments
    manualItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-8px)";
      item.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    });

    // Phase 2: Après 100ms, filtrer et faire réapparaître
    setTimeout(() => {
      let visibleCount = 0;
      const visibleItems = [];

      manualItems.forEach((item) => {
        const itemYear = item.dataset.year;
        const itemSubject = item.dataset.subject;

        const yearMatch = selectedYear ? itemYear === selectedYear : true;
        const subjectMatch =
          selectedSubjects.length > 0
            ? selectedSubjects.includes(itemSubject)
            : false;

        if (yearMatch && subjectMatch) {
          visibleItems.push(item);
          item.classList.remove("hidden");
          visibleCount++;
        } else {
          item.classList.add("hidden");
          item.style.opacity = "0";
        }
      });

      if (resultsCount) resultsCount.textContent = visibleCount;
      if (noResults)
        noResults.style.display = visibleCount === 0 ? "block" : "none";

      // Phase 3: Réapparition progressive
      visibleItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
          item.style.transition =
            "opacity 0.3s cubic-bezier(0.77, 0, 0.175, 1), transform 0.3s cubic-bezier(0.77, 0, 0.175, 1)";
        }, index * 40);
      });
    }, 100);
  }

  // Restaurer l'état sauvegardé AVANT de lancer le premier rendu
  loadFilters();

  // Écouteurs
  yearFilters.forEach((filter) =>
    filter.addEventListener("change", updateResults)
  );
  subjectFilters.forEach((filter) =>
    filter.addEventListener("change", updateResults)
  );

  resetButton?.addEventListener("click", function () {
    // Remettre toutes les matières cochées
    subjectFilters.forEach((filter) => (filter.checked = true));
    // Ne pas toucher à l'année; recalcul & sauvegarde
    updateResults();
  });

  // Rendu initial (tient compte de l'état restauré)
  updateResults();
});
