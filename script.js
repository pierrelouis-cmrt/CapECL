document.addEventListener("DOMContentLoaded", function () {
  // Configuration et métadonnées
  const DS_CONFIG = {
    totalDS: 11,
    metadata: {
      1: {
        title: "Bases Mathématiques",
        tags: [
          "bases",
          "complexes",
          "logique",
          "raisonnement",
          "trigonométrie",
          "nombres complexes",
          "calcul",
        ],
        difficulty: "moyen",
        topics: ["bases mathématiques", "nombres complexes"],
      },
      2: {
        title: "Sommes et Raisonnements",
        tags: [
          "sommes",
          "récurrence",
          "raisonnements",
          "sigma",
          "produits",
          "démonstration",
          "absurde",
          "contraposée",
        ],
        difficulty: "difficile",
        topics: ["sommes", "raisonnements"],
      },
      3: {
        title: "Equations Différentielles",
        tags: [
          "équations",
          "différentielles",
          "solutions",
          "homogène",
          "particulière",
          "EDL1",
          "EDL2",
          "premier ordre",
          "second ordre",
          "Cauchy",
        ],
        difficulty: "moyen",
        topics: ["analyse", "equa diff", "fonctions"],
      },
      4: {
        title: "Ensembles, suites et fonctions (début)",
        tags: [
          "ensembles",
          "suites",
          "fonctions",
          "récurrence",
          "limite",
          "monotonie",
          "bornée",
          "analyse",
        ],
        difficulty: "difficile",
        topics: ["analyse", "ensembles", "suites récurrentes", "fonctions"],
      },
      5: {
        title: "Fonctions et dérivation",
        tags: [
          "fonctions",
          "dérivée",
          "dérivation",
          "étude de fonction",
          "variations",
          "tangente",
          "accroissements finis",
          "analyse",
        ],
        difficulty: "moyen",
        topics: ["analyse", "fonctions", "dérivées"],
      },
      6: {
        title: " Polynômes et algèbre linéaire (début)",
        tags: [
          "polynômes",
          "racines",
          "division euclidienne",
          "algèbre linéaire",
          "espace vectoriel",
          "base",
          "dimension",
          "sev",
        ],
        difficulty: "facile",
        topics: ["polynômes", "algèbre linéaire"],
      },
      7: {
        title: "Développements limités",
        tags: [
          "développements limités",
          "DL",
          "Taylor",
          "limites",
          "équivalents",
          "asymptote",
          "calcul",
          "analyse",
        ],
        difficulty: "moyen",
        topics: ["analyse", "DL", "fonctions", "limites"],
      },
      8: {
        title: "Intégration",
        tags: [
          "intégration",
          "intégrale",
          "primitive",
          "IPP",
          "intégration par parties",
          "changement de variable",
          "calcul d'aire",
          "Riemann",
          "analyse",
        ],
        difficulty: "difficile",
        topics: ["analyse", "intégrales", "fonctions"],
      },
      9: {
        title: "Algèbre linéaire (suite) et matrices (début)",
        tags: [
          "algèbre linéaire",
          "matrices",
          "matrice",
          "systèmes linéaires",
          "pivot de Gauss",
          "inverse matrice",
          "application linéaire",
          "rang",
          "noyau",
          "image",
        ],
        difficulty: "moyen",
        topics: ["algèbre linéaire", "matrices", "systèmes d'équations"],
      },
      10: {
        title: "Non disponible",
        tags: [],
        difficulty: "NA",
        topics: ["NA"],
      },
      11: {
        title: "Non disponible",
        tags: [],
        difficulty: "NA",
        topics: ["NA"],
      },
    },
  };

  // Éléments DOM
  const header = document.getElementById("main-header");
  const folderContainer = document.getElementById("folder-container");
  const searchInput = document.getElementById("search");
  const searchSuggestions = document.getElementById("search-suggestions");
  const searchOverlay = document.getElementById("search-overlay");
  const loadingPlaceholder = document.getElementById("loading-placeholder");
  const dateTimeDisplay = document.getElementById("datetime-display");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  const noResultsDiv = document.getElementById("no-results");

  // État
  let favorites = JSON.parse(localStorage.getItem("dsFavorites") || "[]");
  let lastScrollPosition = 0;
  let dateTimeInterval;
  let activeSearch = false;

  // Initialisation avec délai simulé
  setTimeout(() => {
    loadingPlaceholder.style.display = "none";
    createFolders(); // Initial folder creation
  }, 800);

  // Setup
  initSearch();
  setupScrollEffects();
  startDateTimeUpdate();
  setupFolderEventListeners();

  // --- Fonctions ---

  function createFolders(filterIds = null) {
    folderContainer.innerHTML = ""; // Clear previous content

    let dsList = [];
    for (let i = 1; i <= DS_CONFIG.totalDS; i++) {
      // If filtering, only include matching IDs
      if (filterIds === null || filterIds.includes(String(i))) {
        dsList.push({
          id: i,
          isFavorite: favorites.includes(`folder-${i}`),
        });
      }
    }

    // Sort by favorite status first, then by ID
    dsList.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.id - b.id;
    });

    let delay = 0;
    const favoriteItems = dsList.filter((item) => item.isFavorite);
    const nonFavoriteItems = dsList.filter((item) => !item.isFavorite);

    // Add "Favoris" separator if needed
    if (favoriteItems.length > 0) {
      folderContainer.insertAdjacentHTML(
        "beforeend",
        createSeparatorHTML("Favoris")
      );
      favoriteItems.forEach((item) => {
        createFolderHTML(item, delay);
        delay += 40;
      });
    }

    // Add "Tous les documents" or "Documents" separator if needed
    if (
      favoriteItems.length > 0 &&
      nonFavoriteItems.length > 0 &&
      filterIds === null
    ) {
      folderContainer.insertAdjacentHTML(
        "beforeend",
        createSeparatorHTML("Tous les documents")
      );
    } else if (favoriteItems.length === 0 && nonFavoriteItems.length > 0) {
      folderContainer.insertAdjacentHTML(
        "beforeend",
        createSeparatorHTML("Documents")
      );
    }

    // Add non-favorite items
    nonFavoriteItems.forEach((item) => {
      createFolderHTML(item, delay);
      delay += 40;
    });

    // Show "No results" message if applicable
    noResultsDiv.style.display = dsList.length === 0 ? "block" : "none";
    // Hide separators if no results
    document
      .querySelectorAll(".separator")
      .forEach(
        (sep) => (sep.style.display = dsList.length === 0 ? "none" : "flex")
      );

    /// Re-apply fade-in animation to newly created elements
    folderContainer
      .querySelectorAll(".folder-item")
      .forEach((folder, index) => {
        folder.style.opacity = "0"; // Start invisible
        folder.style.animationDelay = `${index * 40}ms`;
        folder.classList.add("fade-in");
        setTimeout(() => {
          folder.style.opacity = "1";
        }, index * 40 + 500); // 500ms is the fade-in duration
      });
  }

  function createSeparatorHTML(text) {
    // Use Tailwind classes for responsive margins
    return `
      <div class="separator">
        <span class="separator-text">${text}</span>
      </div>
    `;
  }

  function createFolderHTML(item, delay) {
    const i = item.id;
    const dsMetadata = DS_CONFIG.metadata[i];
    const isFolderFav = item.isFavorite;

    // Use Tailwind classes for responsive layout within the folder header
    const folderHtml = `
      <div class="folder-item ${isFolderFav ? "favorite-item" : ""}"
           data-id="${i}"
           data-title="${dsMetadata.title.toLowerCase()}"
           data-tags="${dsMetadata.tags.join(",").toLowerCase()}"
           data-topics="${dsMetadata.topics.join(",").toLowerCase()}"
           data-difficulty="${dsMetadata.difficulty.toLowerCase()}"
           >
        <div class="folder-header flex justify-between items-center gap-2">
          <div class="flex-1 min-w-0"> <!-- Added min-w-0 for flex shrink -->
            <!-- Stack number/title vertically on mobile, row on md+ -->
            <div class="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2 mb-1 md:mb-0">
              <div class="folder-number mono">DS.${String(i).padStart(
                2,
                "0"
              )}</div>
              <!-- Adjusted margin for mobile -->
              <div class="folder-title md:ml-4 truncate">${
                dsMetadata.title
              }</div>
            </div>
            <!-- Stack difficulty/topics below on mobile -->
            <div class="mt-1 md:mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center">
              <span class="difficulty difficulty-${dsMetadata.difficulty}">${
      dsMetadata.difficulty
    }</span>
              <span class="text-xs text-gray-400 mono">${dsMetadata.topics.join(
                " · "
              )}</span>
            </div>
          </div>
          <!-- Icons container with adjusted gap -->
          <div class="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <div class="fav-icon" data-id="${i}">
              ${
                isFolderFav
                  ? '<i class="fas fa-star text-sm"></i>'
                  : '<i class="far fa-star text-sm"></i>'
              }
            </div>
            <div class="toggle-icon"></div>
          </div>
        </div>
        <div class="folder-content">
          <!-- Adjusted padding for mobile -->
          <div class="px-3 py-2 md:px-4 md:py-3">
            <div class="file-item mb-1">
              <a href="pdfs/ds${i}.pdf" target="_blank" data-id="${i}">
                <span class="text-sm mr-3 mono opacity-50">01</span>
                <span>Énoncé</span>
              </a>
            </div>
            <div class="file-item">
              <a href="pdfs/corrige${i}.pdf" target="_blank" data-id="${i}">
                <span class="text-sm mr-3 mono opacity-50">02</span>
                <span>Corrigé</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    folderContainer.insertAdjacentHTML("beforeend", folderHtml);
  }

  function setupFolderEventListeners() {
    folderContainer.addEventListener("click", function (e) {
      const folderHeader = e.target.closest(".folder-header");
      const favIcon = e.target.closest(".fav-icon");

      if (folderHeader && !favIcon) {
        toggleFolder(folderHeader);
      } else if (favIcon) {
        toggleFavorite(favIcon);
      }
    });
  }

  function toggleFolder(header) {
    const folder = header.closest(".folder-item");
    folder.classList.toggle("folder-open");
    const content = folder.querySelector(".folder-content");
    if (folder.classList.contains("folder-open")) {
      // Set max-height dynamically based on content scrollHeight
      // Add a small buffer (e.g., 10px) if needed, but scrollHeight usually works
      content.style.maxHeight = content.scrollHeight + "px";
    } else {
      // Explicitly set back to 0 when closing
      content.style.maxHeight = "0";
    }
  }

  function toggleFavorite(favIcon) {
    const id = favIcon.dataset.id;
    const favKey = `folder-${id}`;
    const folder = favIcon.closest(".folder-item");
    const isCurrentlyFavorite = favorites.includes(favKey);

    if (isCurrentlyFavorite) {
      favorites = favorites.filter((item) => item !== favKey);
      favIcon.innerHTML = '<i class="far fa-star text-sm"></i>';
      folder.classList.remove("favorite-item");
    } else {
      favorites.push(favKey);
      favIcon.innerHTML = '<i class="fas fa-star text-sm"></i>';
      folder.classList.add("favorite-item");
    }

    localStorage.setItem("dsFavorites", JSON.stringify(favorites));

    // Re-render respecting the current search filter (if any)
    // Get current filter state before re-rendering
    const currentSearchTerm = searchInput.value.toLowerCase().trim();
    let filterIds = null;
    if (currentSearchTerm.length > 0) {
      filterIds = findMatchingDSIds(currentSearchTerm);
    }
    createFolders(filterIds);
  }

  function initSearch() {
    searchInput.addEventListener("focus", () => {
      // Use Tailwind class for z-index control
      searchInput.closest(".search-container").classList.add("z-50");
      toggleSearchOverlay(true);
    });

    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        if (!searchInput.matches(":focus")) {
          hideSearchSuggestions();
          // Use Tailwind class for z-index control
          searchInput.closest(".search-container").classList.remove("z-50");
          // Only hide overlay if search is not active (no text entered)
          if (!activeSearch) {
            toggleSearchOverlay(false);
          }
        }
      }, 150);
    });

    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      activeSearch = searchTerm.length > 0;
      toggleSearchOverlay(activeSearch); // Show overlay whenever there's text

      if (searchTerm.length > 0) {
        showSearchSuggestions(searchTerm);
        // Apply live filtering as user types
        applySearchFilter(searchTerm, false); // Pass false to prevent hiding suggestions
      } else {
        hideSearchSuggestions();
        createFolders(); // Show all folders when search is cleared
      }
    });

    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      activeSearch = false;
      toggleSearchOverlay(false);
      hideSearchSuggestions();
      createFolders(); // Show all folders
      // searchInput.focus(); // Optional: Keep focus after clearing
    });

    // Keyboard navigation for suggestions
    searchInput.addEventListener("keydown", (e) => {
      const suggestions = searchSuggestions.querySelectorAll(".search-item");
      if (
        suggestions.length === 0 ||
        !searchSuggestions.classList.contains("show")
      )
        return;

      let activeIndex = Array.from(suggestions).findIndex((item) =>
        item.classList.contains("active-suggestion")
      );

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = (activeIndex + 1) % suggestions.length;
        highlightSuggestion(suggestions, activeIndex);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex =
          activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
        highlightSuggestion(suggestions, activeIndex);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0) {
          suggestions[activeIndex].click(); // Simulate click
        } else if (searchInput.value.trim().length > 0) {
          // Enter pressed with text but no suggestion selected
          applySearchFilter(searchInput.value.toLowerCase().trim(), true); // Hide suggestions on Enter
          hideSearchSuggestions(); // Ensure suggestions hide
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        hideSearchSuggestions();
        // Optional: Clear search on Escape? Or just close suggestions?
        // searchInput.value = "";
        // activeSearch = false;
        // toggleSearchOverlay(false);
        // createFolders();
        searchInput.blur(); // Remove focus
      }
    });

    // Close search when clicking the overlay
    searchOverlay.addEventListener("click", () => {
      searchInput.blur(); // Remove focus first
      // Check if there was active text, if so, keep it filtered
      if (searchInput.value.trim().length === 0) {
        activeSearch = false;
        createFolders(); // Reset if search was empty
      }
      toggleSearchOverlay(false);
      hideSearchSuggestions();
    });
  }

  function toggleSearchOverlay(show) {
    if (show) {
      searchOverlay.classList.add("active");
    } else {
      searchOverlay.classList.remove("active");
    }
  }

  // Find matching DS IDs based on improved search
  function findMatchingDSIds(searchTerm) {
    return Object.entries(DS_CONFIG.metadata)
      .filter(([id, data]) => {
        const searchTerms = searchTerm
          .toLowerCase()
          .split(" ")
          .filter((term) => term.length > 0);
        if (searchTerms.length === 0) return false;

        return searchTerms.every((term) => {
          const dsFormats = [
            `ds${id}`,
            `ds ${id}`,
            `ds.${id}`,
            `ds.${String(id).padStart(2, "0")}`,
            `${id}`,
          ];
          const isNumberMatch = dsFormats.some((format) =>
            format.includes(term)
          );
          const titleMatch = data.title.toLowerCase().includes(term);
          const tagsMatch = data.tags.some((tag) =>
            tag.toLowerCase().includes(term)
          );
          const topicsMatch = data.topics.some((topic) =>
            topic.toLowerCase().includes(term)
          );
          const difficultyMatch = data.difficulty.toLowerCase().includes(term);
          return (
            isNumberMatch ||
            titleMatch ||
            tagsMatch ||
            topicsMatch ||
            difficultyMatch
          );
        });
      })
      .map(([id]) => id);
  }

  // Apply actual filtering
  // Added 'hideSuggest' parameter to control suggestion visibility
  function applySearchFilter(searchTerm, hideSuggest = true) {
    const matchingIds = findMatchingDSIds(searchTerm);
    createFolders(matchingIds); // Create filtered folders

    if (hideSuggest) {
      hideSearchSuggestions();
      // Only reset activeSearch and overlay if we intend to finalize the search
      activeSearch = searchTerm.length > 0;
      toggleSearchOverlay(activeSearch);
    }
  }

  function highlightSuggestion(suggestions, index) {
    suggestions.forEach((item) => item.classList.remove("active-suggestion"));
    if (suggestions[index]) {
      suggestions[index].classList.add("active-suggestion");
      suggestions[index].scrollIntoView({ block: "nearest" });
    }
  }

  function showSearchSuggestions(searchTerm) {
    if (searchTerm.length < 1) {
      hideSearchSuggestions();
      return;
    }

    searchSuggestions.innerHTML = ""; // Clear previous suggestions

    const matchedDS = Object.entries(DS_CONFIG.metadata)
      .filter(([id, data]) => {
        // Use the improved matching function
        return findMatchingDSIds(searchTerm).includes(id);
      })
      .slice(0, 6); // Limit suggestions

    if (matchedDS.length > 0) {
      matchedDS.forEach(([id, data]) => {
        // Use Tailwind for responsive suggestion layout
        searchSuggestions.innerHTML += `
          <div class="py-2 px-3 md:py-3 md:px-4 search-item cursor-pointer" data-id="${id}">
            <div class="flex items-start md:items-baseline">
              <div class="mono text-xs mr-2 md:mr-3 opacity-70 pt-0.5 md:pt-0">DS.${String(
                id
              ).padStart(2, "0")}</div>
              <div class="flex-1 min-w-0"> <!-- Allow shrinking -->
                <div class="font-medium text-sm truncate">${data.title}</div>
                <div class="flex mt-1 items-center flex-wrap gap-x-2">
                  <span class="difficulty difficulty-${
                    data.difficulty
                  } text-[9px] md:text-[10px]">${data.difficulty}</span>
                  <span class="text-xs opacity-50">${data.topics.join(
                    " · "
                  )}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      });

      searchSuggestions.classList.add("show");

      // Add click listeners to new suggestions
      searchSuggestions.querySelectorAll(".search-item").forEach((item) => {
        item.addEventListener("click", function () {
          const id = this.dataset.id;
          const selectedTitle = DS_CONFIG.metadata[id].title;
          searchInput.value = selectedTitle; // Populate search bar

          // Apply actual filtering and hide suggestions
          applySearchFilter(selectedTitle.toLowerCase().trim(), true);

          // Scroll to and open the selected folder
          const targetFolder = folderContainer.querySelector(
            `.folder-item[data-id="${id}"]`
          );
          if (targetFolder) {
            // Scroll immediately
            targetFolder.scrollIntoView({
              behavior: "smooth", // Keep smooth scroll
              block: "center", // Center it vertically
            });
            // Open after a short delay to allow scroll to finish
            setTimeout(() => {
              if (!targetFolder.classList.contains("folder-open")) {
                const header = targetFolder.querySelector(".folder-header");
                toggleFolder(header);
              }
              // Ensure overlay is hidden after selection
              toggleSearchOverlay(false);
              activeSearch = false; // Finalize search state
            }, 350); // Slightly longer delay for smooth scroll
          } else {
            // Fallback if folder not found immediately (e.g., due to filtering race condition)
            toggleSearchOverlay(false);
            activeSearch = false;
          }
        });
      });
    } else {
      searchSuggestions.innerHTML = `
        <div class="p-3 text-center">
          <p class="mono text-xs tracking-widest opacity-50">AUCUN RÉSULTAT</p>
        </div>
      `;
      searchSuggestions.classList.add("show");
    }
  }

  function hideSearchSuggestions() {
    searchSuggestions.classList.remove("show");
    const active = searchSuggestions.querySelector(".active-suggestion");
    if (active) active.classList.remove("active-suggestion");
    setTimeout(() => {
      if (!searchSuggestions.classList.contains("show")) {
        searchSuggestions.innerHTML = "";
      }
    }, 200);
  }

  function setupScrollEffects() {
    window.addEventListener(
      "scroll",
      () => {
        const currentScroll =
          window.pageYOffset || document.documentElement.scrollTop;
        // Apply shadow earlier on mobile if needed, but 20px is probably fine
        if (currentScroll > 20) {
          header.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
        } else {
          header.style.boxShadow = "";
        }
        lastScrollPosition = currentScroll <= 0 ? 0 : currentScroll;
      },
      { passive: true }
    ); // Use passive listener for scroll performance
  }

  function updateDateTime() {
    const now = new Date();
    const dateOptions = {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    const timeOptions = { hour: "2-digit", minute: "2-digit" };
    const dateString = now.toLocaleDateString("fr-FR", dateOptions);
    const timeString = now.toLocaleTimeString("fr-FR", timeOptions);
    dateTimeDisplay.textContent = `${dateString} ${timeString}`;
  }

  function startDateTimeUpdate() {
    updateDateTime();
    dateTimeInterval = setInterval(updateDateTime, 1000 * 30);
  }

  window.addEventListener("beforeunload", () => {
    if (dateTimeInterval) {
      clearInterval(dateTimeInterval);
    }
  });

  // Close suggestions on outside click (improved)
  document.addEventListener("click", (e) => {
    const searchContainer = e.target.closest(".search-container");
    if (!searchContainer && searchSuggestions.classList.contains("show")) {
      hideSearchSuggestions();
      // Also potentially hide overlay if search isn't active
      if (!activeSearch) {
        toggleSearchOverlay(false);
      }
    }
  });
});
