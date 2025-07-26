// SYSTÈME DE FILTRAGE DES MANUELS
document.addEventListener("DOMContentLoaded", function () {
  const yearFilters = document.querySelectorAll('input[name="year"]');
  const subjectFilters = document.querySelectorAll('input[name="subject"]');
  const resetButton = document.querySelector(".filter-reset");
  const manualItems = document.querySelectorAll(".manual-item");
  const resultsCount = document.querySelector(".results-count");
  const noResults = document.querySelector(".no-results");

  function updateResults() {
    const selectedYear = document.querySelector(
      'input[name="year"]:checked'
    ).value;
    const selectedSubjects = Array.from(
      document.querySelectorAll('input[name="subject"]:checked')
    ).map((input) => input.value);

    // Phase 1: Faire disparaître tous les éléments
    manualItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-8px)";
      item.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    });

    // Phase 2: Après 200ms, filtrer et faire réapparaître
    setTimeout(() => {
      let visibleCount = 0;
      const visibleItems = [];

      // Déterminer quels éléments doivent être visibles
      manualItems.forEach((item) => {
        const itemYear = item.dataset.year;
        const itemSubject = item.dataset.subject;

        const yearMatch = itemYear === selectedYear;
        const subjectMatch = selectedSubjects.includes(itemSubject);

        if (yearMatch && subjectMatch) {
          visibleItems.push(item);
          item.classList.remove("hidden");
          visibleCount++;
        } else {
          item.classList.add("hidden");
          item.style.opacity = "0";
        }
      });

      // Mettre à jour le compteur
      resultsCount.textContent = visibleCount;

      // Afficher/masquer le message "aucun résultat"
      if (visibleCount === 0) {
        noResults.style.display = "block";
      } else {
        noResults.style.display = "none";
      }

      // Phase 3: Faire réapparaître les éléments visibles un par un
      visibleItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
          item.style.transition =
            "opacity 0.3s cubic-bezier(0.77, 0, 0.175, 1), transform 0.3s cubic-bezier(0.77, 0, 0.175, 1)";
        }, index * 40); // Délai de 40ms entre chaque élément
      });
    }, 100);
  }

  // Event listeners
  yearFilters.forEach((filter) => {
    filter.addEventListener("change", updateResults);
  });

  subjectFilters.forEach((filter) => {
    filter.addEventListener("change", updateResults);
  });

  resetButton.addEventListener("click", function () {
    // Sélectionner tous les checkboxes des matières
    subjectFilters.forEach((filter) => {
      filter.checked = true;
    });
    updateResults();
  });

  // Initial update
  updateResults();
});
