document.addEventListener("DOMContentLoaded", () => {
  // Default height used for cards without a custom value.
  const DEFAULT_EXPANDED_HEIGHT = 220; // pixels

  const PASSWORD = "2025";
  const STORAGE_KEY = "capecl:password-unlocked";

  // Guard the interface behind a simple client-side password.
  const passwordGate = document.querySelector("[data-password-gate]");
  if (passwordGate) {
    const passwordInput = passwordGate.querySelector(".password-gate__input");
    let hasStorage = true;
    let unlocked = false;

    try {
      unlocked = window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch (error) {
      hasStorage = false;
    }

    if (unlocked) {
      passwordGate.remove();
      // Skip further setup if we have nothing to display.
    } else {
      const completeUnlock = () => {
        if (hasStorage) {
          try {
            window.localStorage.setItem(STORAGE_KEY, "true");
          } catch (error) {
            // Ignore storage failures and still unlock.
          }
        }

        passwordGate.classList.add("password-gate--hidden");
        window.setTimeout(() => {
          passwordGate.remove();
        }, 200);
      };

      if (passwordInput) {
        passwordInput.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (passwordInput.value === PASSWORD) {
              completeUnlock();
            } else {
              passwordInput.value = "";
            }
          }
        });

        passwordInput.addEventListener("input", () => {
          if (passwordInput.value === PASSWORD) {
            completeUnlock();
          }
        });

        passwordInput.focus();
      }
    }
  }

  const expandableCards = document.querySelectorAll(".expandable-card");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  expandableCards.forEach((card) => {
    const toggle = card.querySelector(".expandable-card__toggle");
    const content = card.querySelector(".expandable-card__content");
    const plusIcon = card.querySelector(".expandable-card__icon--plus");
    const minusIcon = card.querySelector(".expandable-card__icon--minus");

    if (!toggle || !content || !plusIcon || !minusIcon) {
      return;
    }

    const interactiveSelector =
      "a, button, input, select, textarea, label";

    plusIcon.style.position = "absolute";
    minusIcon.style.position = "absolute";
    minusIcon.hidden = false;
    plusIcon.style.opacity = "1";
    plusIcon.style.transform = "rotate(0deg)";
    minusIcon.style.opacity = "0";
    minusIcon.style.transform = "rotate(-90deg)";

    content.style.height = "0px";
    content.style.opacity = "0";

    let isAnimating = false;

    const resolveExpandedHeight = () => {
      const customHeight = Number.parseFloat(card.dataset.expandedHeight || "");
      if (Number.isFinite(customHeight) && customHeight > 0) {
        return customHeight;
      }
      return DEFAULT_EXPANDED_HEIGHT;
    };

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

    const open = () => {
      if (isAnimating) return;
      isAnimating = true;

      toggle.setAttribute("aria-expanded", "true");
      refreshIconState(true);
      applyExpandedStyles();

      const targetHeight = resolveExpandedHeight();

      if (prefersReducedMotion) {
        content.style.opacity = "1";
        content.style.height = `${targetHeight}px`;
        isAnimating = false;
        return;
      }

      content.style.opacity = "1";
      content.style.height = "0px";
      void content.offsetHeight;
      content.style.height = `${targetHeight}px`;
    };

    const close = () => {
      if (isAnimating) return;
      isAnimating = true;

      toggle.setAttribute("aria-expanded", "false");
      refreshIconState(false);

      const targetHeight = resolveExpandedHeight();

      if (prefersReducedMotion) {
        content.style.height = "0px";
        content.style.opacity = "0";
        clearExpandedStyles();
        isAnimating = false;
        return;
      }

      content.style.height = `${targetHeight}px`;
      void content.offsetHeight;
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
      if (event.target.closest(interactiveSelector)) {
        return;
      }
      toggle.click();
    });

    content.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "height") {
        return;
      }

      if (toggle.getAttribute("aria-expanded") === "false") {
        clearExpandedStyles();
      }

      isAnimating = false;
    });
  });

  const footerYearRange = document.querySelector("[data-footer-year-range]");
  if (footerYearRange) {
    const now = new Date();
    const startYear = now.getFullYear();
    footerYearRange.textContent = `${startYear}-${startYear + 1}`;
  }
});
