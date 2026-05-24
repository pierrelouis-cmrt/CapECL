document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ===== Page transitions =====
  document.documentElement.classList.add("page-ready");

  if (!prefersReducedMotion) {
    const isInternalPageLink = (link) => {
      if (!link || link.target || link.hasAttribute("download")) return false;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      if (url.pathname === window.location.pathname && url.hash) return false;

      return true;
    };

    document.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest("a[href]");
      if (!isInternalPageLink(link)) return;

      event.preventDefault();
      window.requestAnimationFrame(() => {
        document.documentElement.classList.add("page-leaving");
      });
      window.setTimeout(() => {
        window.location.href = link.href;
      }, 260);
    });

    window.addEventListener("pageshow", () => {
      document.documentElement.classList.remove("page-leaving");
    });
  }

  // ===== Expandable cards (Dynamic Height) =====
  const expandableCards = document.querySelectorAll(".expandable-card");

  // Helper: Calculate the height of the content as if it were expanded.
  // We use a clone to avoid messing with the visible element's state/transitions.
  const calculateExpandedHeight = (card, content) => {
    // Clone the content element
    const clone = content.cloneNode(true);
    
    // Set styles to make it invisible but measurable, and force the expanded state
    clone.style.cssText = `
      position: absolute;
      visibility: hidden;
      height: auto;
      width: ${content.offsetWidth}px;
      transition: none !important;
      overflow: visible;
    `;
    
    // Ensure the clone has the expanded class to include padding/margin/border
    clone.classList.add("expandable-card__content--expanded");
    
    // Append to the card so it inherits font styles, etc.
    card.appendChild(clone);
    
    const height = clone.scrollHeight;
    
    // Cleanup
    clone.remove();
    return height;
  };

  expandableCards.forEach((card) => {
    const toggle = card.querySelector(".expandable-card__toggle");
    const content = card.querySelector(".expandable-card__content");
    const plusIcon = card.querySelector(".expandable-card__icon--plus");
    const minusIcon = card.querySelector(".expandable-card__icon--minus");

    if (!toggle || !content || !plusIcon || !minusIcon) return;

    const interactiveSelector = "a, button, input, select, textarea, label";

    plusIcon.style.position = "absolute";
    minusIcon.style.position = "absolute";
    minusIcon.hidden = false;
    const refreshIconState = (expanded) => {
      if (expanded) {
        plusIcon.style.transform = "rotate(90deg)";
        plusIcon.style.opacity = "0";
        minusIcon.style.transform = "rotate(0deg)";
        minusIcon.style.opacity = "1";
      } else {
        plusIcon.style.transform = "rotate(0deg)";
        plusIcon.style.opacity = "1";
        minusIcon.style.transform = "rotate(-90deg)";
        minusIcon.style.opacity = "0";
      }
    };

    const applyExpandedStyles = () => {
      content.classList.add("expandable-card__content--expanded");
    };

    const clearExpandedStyles = () => {
      content.classList.remove("expandable-card__content--expanded");
    };

    const isInitiallyExpanded = toggle.getAttribute("aria-expanded") === "true";
    refreshIconState(isInitiallyExpanded);

    if (isInitiallyExpanded) {
      applyExpandedStyles();
      content.style.height = `${calculateExpandedHeight(card, content)}px`;
      content.style.opacity = "1";
    } else {
      content.style.height = "0px";
      content.style.opacity = "0";
    }

    const open = () => {
      toggle.setAttribute("aria-expanded", "true");
      refreshIconState(true);
      
      // Calculate target height BEFORE applying styles to the real element
      const targetHeight = calculateExpandedHeight(card, content);

      // Lock current visual height to start animation from wherever we are
      const startHeight = content.offsetHeight;
      
      // Now apply styles to trigger inner animations (padding, etc.)
      applyExpandedStyles();

      if (prefersReducedMotion) {
        content.style.opacity = "1";
        content.style.height = `${targetHeight}px`;
        return;
      }

      content.style.opacity = "1";
      content.style.height = `${startHeight}px`; // Start from current height
      void content.offsetHeight; // Force reflow
      content.style.height = `${targetHeight}px`;
    };

    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      refreshIconState(false);

      // Lock current height explicitly before collapsing
      // This handles cases where content size changed or animation was interrupted
      const currentHeight = content.offsetHeight;

      if (prefersReducedMotion) {
        content.style.height = "0px";
        content.style.opacity = "0";
        clearExpandedStyles();
        return;
      }

      // Start from current pixel height
      content.style.height = `${currentHeight}px`;
      void content.offsetHeight; // Force reflow
      
      // Animate to 0
      content.style.opacity = "0";
      content.style.height = "0px";
    };

    toggle.addEventListener("click", () => {
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        close();
      } else {
        open();
      }
    });

    card.addEventListener("click", (event) => {
      if (event.target.closest(interactiveSelector)) return;
      toggle.click();
    });

    content.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "height") return;
      if (toggle.getAttribute("aria-expanded") === "false") {
        clearExpandedStyles();
      }
    });
  });

  // Handle window resize to update heights of expanded cards
  let resizeTimeout;
  window.addEventListener("resize", () => {
    if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
    resizeTimeout = requestAnimationFrame(() => {
      expandableCards.forEach((card) => {
        const toggle = card.querySelector(".expandable-card__toggle");
        const content = card.querySelector(".expandable-card__content");
        
        // Only update if currently expanded
        if (toggle && content && toggle.getAttribute("aria-expanded") === "true") {
          // Snap to new auto height without animation
          const originalTransition = content.style.transition;
          content.style.transition = "none";
          content.style.height = "auto";
          
          const newHeight = content.scrollHeight;
          
          content.style.height = `${newHeight}px`;
          void content.offsetHeight; // Force reflow
          content.style.transition = originalTransition;
        }
      });
    });
  });

  // Footer year
  const footerYearRange = document.querySelector("[data-footer-year-range]");
  if (footerYearRange) {
    const now = new Date();
    const startYear = now.getFullYear();
    footerYearRange.textContent = `${startYear}-${startYear + 1}`;
  }
});
