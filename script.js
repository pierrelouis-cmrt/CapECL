document.addEventListener("DOMContentLoaded", () => {
  const DEFAULT_EXPANDED_HEIGHT = 220; // pixels

  const PASSWORD = "2025";
  const STORAGE_KEY = "capecl:password-unlocked";

  const siteRoot = document.querySelector("[data-site-root]");
  const passwordGate = document.querySelector("[data-password-gate]");
  const passwordInput = passwordGate?.querySelector(".password-gate__input");

  // ==== Scroll lock helpers (robust on iOS/desktop) ====
  let scrollYBeforeLock = 0;

  const lockPage = () => {
    // Hide & inert everything behind the overlay
    if (siteRoot) {
      siteRoot.setAttribute("aria-hidden", "true");
      try {
        siteRoot.inert = true; // modern browsers
      } catch (_) {}
    }

    // Hard scroll lock (iOS-safe)
    scrollYBeforeLock = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add("body--password-gate-active");
    document.body.style.top = `-${scrollYBeforeLock}px`;

    // Trap focus inside the overlay
    document.addEventListener("focusin", focusTrap, true);
    document.addEventListener("touchmove", preventScroll, { passive: false });
    document.addEventListener("wheel", preventScroll, { passive: false });
  };

  const unlockPage = () => {
    if (siteRoot) {
      siteRoot.removeAttribute("aria-hidden");
      try {
        siteRoot.inert = false;
      } catch (_) {}
    }

    document.body.classList.remove("body--password-gate-active");
    document.body.style.top = "";
    window.scrollTo(0, scrollYBeforeLock);

    document.removeEventListener("focusin", focusTrap, true);
    document.removeEventListener("touchmove", preventScroll, {
      passive: false,
    });
    document.removeEventListener("wheel", preventScroll, { passive: false });
  };

  const preventScroll = (e) => {
    // Block all page scroll/zoom gestures while gate is active
    if (
      !passwordGate ||
      passwordGate.classList.contains("password-gate--hidden")
    )
      return;
    e.preventDefault();
  };

  const focusTrap = (e) => {
    if (
      !passwordGate ||
      passwordGate.classList.contains("password-gate--hidden")
    )
      return;
    if (!passwordGate.contains(e.target)) {
      e.stopPropagation();
      passwordInput?.focus();
    }
  };

  // ==== Gate boot ====
  let hasStorage = true;
  let unlocked = false;

  try {
    unlocked = window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch (_) {
    hasStorage = false;
  }

  // Remove early lock class when known
  document.documentElement.classList.remove("pg-init");
  if (!unlocked) {
    document.documentElement.classList.add("pg-lock");
    lockPage();
  } else {
    document.documentElement.classList.remove("pg-lock");
    passwordGate?.remove();
  }

  const completeUnlock = () => {
    if (hasStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch (_) {}
    }

    // Fade overlay out, then remove and unlock page
    passwordGate?.classList.add("password-gate--hidden");
    window.setTimeout(() => {
      passwordGate?.remove();
      document.documentElement.classList.remove("pg-lock");
      unlockPage();
    }, 200);
  };

  // Input interactions
  if (passwordInput && !unlocked) {
    // Keep focus inside the gate
    passwordGate.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        passwordInput.focus();
      }
    });

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

    // Initial focus
    passwordInput.focus();
  }

  // ===== Expandable cards (unchanged logic) =====
  const expandableCards = document.querySelectorAll(".expandable-card");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

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
    plusIcon.style.opacity = "1";
    plusIcon.style.transform = "rotate(0deg)";
    minusIcon.style.opacity = "0";
    minusIcon.style.transform = "rotate(-90deg)";

    content.style.height = "0px";
    content.style.opacity = "0";

    let isAnimating = false;

    const resolveExpandedHeight = () => {
      const customHeight = Number.parseFloat(card.dataset.expandedHeight || "");
      return Number.isFinite(customHeight) && customHeight > 0
        ? customHeight
        : DEFAULT_EXPANDED_HEIGHT;
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
      if (event.target.closest(interactiveSelector)) return;
      toggle.click();
    });

    content.addEventListener("transitionend", (event) => {
      if (event.propertyName !== "height") return;
      if (toggle.getAttribute("aria-expanded") === "false") {
        clearExpandedStyles();
      }
      isAnimating = false;
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
