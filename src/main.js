document.addEventListener("DOMContentLoaded", function () {
  // ------------------------------------------------------------
  //  DOM ELEMENTS
  // ------------------------------------------------------------
  const folderContainer = document.getElementById("folder-container");
  const header = document.getElementById("main-header"); // may be null in your HTML

  // ------------------------------------------------------------
  //  STORAGE (page-scoped)
  // ------------------------------------------------------------
  const STORAGE_PREFIX = "dsFavorites";
  // Page-scoped storage key (no IIFE → Prettier friendly)
  const pageNamespace = getPageNamespace();
  const STORAGE_KEY = `${STORAGE_PREFIX}:${pageNamespace}`;

  function getPageNamespace() {
    // Normalize `/1A/maths/2024-2025/index.html` → `/1A/maths/2024-2025/`
    let p = window.location.pathname
      .replace(/\/index\.html?$/i, "") // strip index.html
      .replace(/\/+$/g, ""); // strip trailing slashes

    return `${p}/`;
  }

  // ------------------------------------------------------------
  //  STATE
  // ------------------------------------------------------------
  let favorites = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  let lastScrollPosition = 0;

  // Animation config
  const STAGGER = 40; // ms between each card animation
  const FADE_DURATION = 100; // ms duration of the fade-in CSS animation

  // ------------------------------------------------------------
  //  INIT
  // ------------------------------------------------------------
  ensureSections(); // Build the two sections (Favoris / Documents) from the raw HTML
  setupScrollEffects();
  setupFolderEventListeners();
  rebuildSections(); // Place every item in the right section immediately (also animates)

  // Additional functionality from HTML patch
  setupNoDescriptionItems();
  setupBreadcrumbReload();

  // ------------------------------------------------------------
  //  FUNCTIONS
  // ------------------------------------------------------------

  /** Create (once) two sections inside #folder-container:
   *   - a "Favoris" separator + container
   *   - a "Documents/Tous les documents" separator + container
   * Then move all existing raw .folder-item elements into the "others" section.
   */
  function ensureSections() {
    // Already transformed?
    if (
      folderContainer.querySelector("#favorites-section") &&
      folderContainer.querySelector("#others-section")
    ) {
      return;
    }

    const allFolders = Array.from(
      folderContainer.querySelectorAll(".folder-item")
    );

    // Remove any existing separators coming from raw HTML
    folderContainer.querySelectorAll(".separator").forEach((el) => el.remove());

    // Build new skeleton
    const favSep = createSeparator("Favoris");
    favSep.id = "favorites-separator";
    const favSec = document.createElement("div");
    favSec.id = "favorites-section";

    const otherSep = createSeparator(
      allFolders.length > 0 ? "Tous les documents" : "Documents"
    );
    otherSep.id = "others-separator";
    const otherSec = document.createElement("div");
    otherSec.id = "others-section";

    // Re-write the container
    folderContainer.innerHTML = "";
    folderContainer.appendChild(favSep);
    folderContainer.appendChild(favSec);
    folderContainer.appendChild(otherSep);
    folderContainer.appendChild(otherSec);

    // Put every raw item in the others section for now
    otherSec.append(...allFolders);
  }

  function createSeparator(text) {
    const div = document.createElement("div");
    div.className = "separator";
    const span = document.createElement("span");
    span.className = "separator-text";
    span.textContent = text;
    div.appendChild(span);
    return div;
  }

  /**
   * Re-build both sections in DOM order after any (un)favourite action or on load.
   * Favourites on top (sorted by id asc), then the rest (sorted by id asc).
   * Also (re)plays the original fade-in animation you used.
   */
  function rebuildSections() {
    const favSec = folderContainer.querySelector("#favorites-section");
    const favSep = folderContainer.querySelector("#favorites-separator");
    const otherSec = folderContainer.querySelector("#others-section");
    const otherSep = folderContainer.querySelector("#others-separator");

    const allItems = Array.from(
      folderContainer.querySelectorAll(".folder-item")
    );
    // Sort numerically by data-id for stable order
    allItems.sort(
      (a, b) => parseInt(a.dataset.id, 10) - parseInt(b.dataset.id, 10)
    );

    const favIds = new Set(favorites.map((k) => k.replace("folder-", "")));

    // Clear current sections
    favSec.innerHTML = "";
    otherSec.innerHTML = "";

    allItems.forEach((item) => {
      const id = item.dataset.id;
      const favIcon = item.querySelector(".fav-icon");

      if (favIds.has(id)) {
        item.classList.add("favorite-item");
        if (favIcon) favIcon.innerHTML = '<i class="fas fa-star text-sm"></i>';
        favSec.appendChild(item);
      } else {
        item.classList.remove("favorite-item");
        if (favIcon) favIcon.innerHTML = '<i class="far fa-star text-sm"></i>';
        otherSec.appendChild(item);
      }

      // Fix the max-height after move when closed
      const content = item.querySelector(".folder-content");
      if (content && !item.classList.contains("folder-open")) {
        content.style.maxHeight = "0";
      }

      // Reset animation-related inline styles so we can replay them
      resetAnimationState(item);
    });

    // Show/hide the Favoris bloc
    const hasFav = favSec.children.length > 0;
    favSep.style.display = hasFav ? "flex" : "none";
    favSec.style.display = hasFav ? "block" : "none";

    // Show/hide the Documents bloc (hide entirely if everyone is favourite)
    const hasOthers = otherSec.children.length > 0;
    otherSep.style.display = hasOthers ? "flex" : "none";
    otherSec.style.display = hasOthers ? "block" : "none";

    // Label for others depending on favourite presence (only matters if visible)
    const span = otherSep.querySelector(".separator-text");
    if (span && hasOthers)
      span.textContent = hasFav ? "Documents" : "Tous les documents";

    // Animate with the exact same fade-in you had before
    animateFolders();
  }

  /**
   * Delegated click handling for toggling folders open/closed and (un)favouriting.
   */
  function setupFolderEventListeners() {
    folderContainer.addEventListener("click", function (e) {
      const folderHeader = e.target.closest(".folder-header");
      const favIcon = e.target.closest(".fav-icon");

      if (favIcon) {
        toggleFavorite(favIcon);
        return;
      }

      if (folderHeader && !favIcon) {
        toggleFolder(folderHeader);
      }
    });
  }

  /**
   * Open/close the folder by animating the max-height of its content element.
   */
  function toggleFolder(header) {
    const folder = header.closest(".folder-item");
    const content = folder.querySelector(".folder-content");

    folder.classList.toggle("folder-open");
    if (folder.classList.contains("folder-open")) {
      content.style.maxHeight = `${content.scrollHeight}px`;
    } else {
      content.style.maxHeight = "0";
    }
  }

  /**
   * Add or remove the folder from the favourites list and persist to localStorage,
   * then rebuild sections so favourites are on the top.
   */
  function toggleFavorite(favIcon) {
    const id = favIcon.dataset.id;
    const favKey = `folder-${id}`;
    const isCurrentlyFavorite = favorites.includes(favKey);

    if (isCurrentlyFavorite) {
      favorites = favorites.filter((item) => item !== favKey);
    } else {
      favorites.push(favKey);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    rebuildSections();
  }

  /**
   * Adds a subtle drop shadow to the fixed header once the user scrolls.
   */
  function setupScrollEffects() {
    if (!header) return; // nothing to do if you don't have a #main-header
    window.addEventListener(
      "scroll",
      () => {
        const currentScroll =
          window.pageYOffset || document.documentElement.scrollTop;
        header.style.boxShadow =
          currentScroll > 20 ? "0 1px 3px rgba(0,0,0,0.05)" : "";
        lastScrollPosition = currentScroll <= 0 ? 0 : currentScroll;
      },
      { passive: true }
    );
  }

  /**
   * Replay the original CSS `.fade-in` animation you used previously, with a staggered delay.
   */
  function animateFolders() {
    const items = Array.from(folderContainer.querySelectorAll(".folder-item"));

    items.forEach((item, index) => {
      // remove then re-add fade-in to restart the animation
      item.classList.remove("fade-in");
      // force reflow
      void item.offsetWidth;

      item.style.opacity = "0";
      item.style.animationDelay = `${index * STAGGER}ms`;
      item.classList.add("fade-in");

      setTimeout(() => {
        item.style.opacity = "1";
      }, index * STAGGER + FADE_DURATION);
    });
  }

  /**
   * Cleanup any previously set inline animation styles so we can replay them.
   */
  function resetAnimationState(item) {
    item.style.opacity = "";
    item.style.animationDelay = "";
    item.classList.remove("fade-in");
  }

  /**
   * Mark folder items without description for CSS styling.
   */
  function setupNoDescriptionItems() {
    document.querySelectorAll(".folder-item").forEach((fi) => {
      const desc = (fi.dataset.description || "").trim();
      if (!desc) fi.classList.add("no-description");
    });
  }

  /**
   * Setup breadcrumb year button to reload the page when clicked.
   */
  function setupBreadcrumbReload() {
    document.querySelectorAll(".breadcrumb-year").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        location.reload();
      });
    });
  }
});
