/* ===== ANIMATION TIMING CONTROLS ===== */
// ADJUST THESE VALUES TO CONTROL ALL ANIMATION TIMINGS
const AnimationConfig = {
  // Container & Layout Animations
  containerAnimation: {
    duration: 900, // Duration of main container animation
    initialDelay: 0, // Delay before animations start
  },

  // Text Animations
  textAnimation: {
    menuItemsDelay: 100, // Delay before menu items animate
    titleWordSpacing: 50, // Delay between each title word
    titleBaseDelay: 200, // Base delay for title words
    menuItemsStagger: 12, // Stagger delay between menu items
  },

  // Misc Timings
  menuItemsClassDelay: 200, // Delay for adding menu-items-animate class

  // Mobile-specific
  mobile: {
    textDelay: 100, // Delay before text appears on mobile
    animationDuration: 300, // Duration for each mobile text element
    staggerDelay: 20, // Delay between each text element on mobile
    initialDelay: 80, // Initial delay before starting mobile animations
  },
};

/* -------------------------------------------------- */
/* Page Load Animation                                */
/* -------------------------------------------------- */
const PageAnimation = (() => {
  let s;

  /* --- small helper to animate the menu text --- */
  const animateMenuText = (startDelay = 0) => {
    const textTargets = document.querySelectorAll(
      ".menu__nav .menu__subtitle, .menu__nav .menu__item > .menu__link"
    );

    const isMobile = window.innerWidth <= 768;

    // For mobile: first make everything visible, then animate
    if (isMobile) {
      // Make navigation visible first
      document.querySelectorAll(".menu__nav").forEach((nav) => {
        nav.style.visibility = "visible";
      });

      // Make all menu items visible
      document.querySelectorAll(".menu__nav .menu__item").forEach((item) => {
        item.style.visibility = "visible";
        item.style.opacity = "1";
      });

      // Make titles visible
      document.querySelectorAll(".js-span").forEach((span) => {
        span.style.visibility = "visible";
        span.style.opacity = "1";
      });
    }

    // Ensure elements are properly styled before animating
    textTargets.forEach((target) => {
      if (isMobile) {
        target.style.visibility = "visible";
      }

      if (target.classList.contains("menu__link")) {
        target.style.color = "var(--color-ink)";
        target.style.textDecoration = "none";
        target.style.fontFamily = "var(--primary-font)";
        target.style.fontSize = "0.9rem";
        target.style.fontWeight = "300";
      } else if (target.classList.contains("menu__subtitle")) {
        target.style.color = "var(--centrale-red)";
        target.style.fontFamily = "var(--mono-font)";
        target.style.fontSize = "0.7rem";
        target.style.fontWeight = "300";
      }
    });

    anime.remove(textTargets);
    anime.set(textTargets, { opacity: 0, translateY: 4 });

    anime({
      targets: textTargets,
      opacity: 1,
      translateY: 0,
      duration: isMobile ? AnimationConfig.mobile.animationDuration : 180,
      delay: anime.stagger(
        isMobile
          ? AnimationConfig.mobile.staggerDelay
          : AnimationConfig.textAnimation.menuItemsStagger,
        {
          start: startDelay,
        }
      ),
      easing: isMobile ? "easeOutQuart" : "easeOutSine", // Smoother easing on mobile
      begin: () => {
        // Let the inline styles take over, removing the pre-hide class
        document.documentElement.classList.remove("js-prep");
      },
      complete: () => {
        // Clean up inline styles after animation, let CSS take over
        textTargets.forEach((target) => {
          target.style.color = "";
          target.style.textDecoration = "";
          target.style.fontFamily = "";
          target.style.fontSize = "";
          target.style.fontWeight = "";
          if (isMobile) {
            target.style.visibility = "";
          }
        });
      },
    });
  };

  return {
    settings() {
      return {
        body: $("body"),
        menu: $(".menu"),
        menuContainer: $(".menu__container"),
        menuImg: $(".menu__img"),
        menuMotif: $(".menu__motif"),
        overflowClass: "js-overflow",
      };
    },

    init() {
      s = this.settings();
      s.body.addClass(s.overflowClass);
      this.animateIn(animateMenuText);
    },

    animateIn(animateTextCb) {
      // Remove loading class to allow animations to take over
      document.documentElement.classList.remove("js-loading");

      const w = window.innerWidth;
      const isTabletOrMobile = w <= 1024;
      const isMobile = w <= 768;

      const containerWidth = isTabletOrMobile ? 100 : 75;
      const imgWidth = isTabletOrMobile ? 0 : 25;

      // MOBILE: simplified animations with aggressive FOUC prevention
      if (isMobile) {
        s.menuContainer.css("width", "100%");
        s.menuImg.css("width", "0%");
        // On mobile, motif styling is handled by CSS media queries
        // No animation needed - it should be visible with the mobile transform

        // Longer delay for smoother mobile experience
        setTimeout(() => {
          animateTextCb(AnimationConfig.mobile.textDelay);
          s.body.removeClass(s.overflowClass);
        }, AnimationConfig.mobile.initialDelay);
        return;
      }

      // DESKTOP/TABLET: master timeline with properly synced motif animation
      // First, ensure motif starts in the correct initial state
      anime.set(s.menuMotif[0], {
        opacity: 0,
        translateX: "-100%",
        translateY: "25%",
      });

      const tl = anime.timeline({
        easing: "easeOutQuart",
        complete: () => {
          s.body.removeClass(s.overflowClass);
          animateTextCb(AnimationConfig.textAnimation.menuItemsDelay);
        },
      });

      tl
        // Columns container
        .add({
          targets: s.menuContainer[0],
          width: [0, `${containerWidth}%`],
          duration: AnimationConfig.containerAnimation.duration,
          delay: AnimationConfig.containerAnimation.initialDelay,
        })
        // Image strip
        .add(
          {
            targets: s.menuImg[0],
            width: [0, `${imgWidth}%`],
            duration: AnimationConfig.containerAnimation.duration,
          },
          0 // start together
        )
        // Motif - synchronized with container animation
        .add(
          {
            targets: s.menuMotif[0],
            opacity: [0, 1],
            translateX: ["-100%", "0%"],
            // translateY stays at 25% (no change needed)
            duration: AnimationConfig.containerAnimation.duration,
            easing: "easeOutQuart",
          },
          0 // start together with container and image
        );

      // Slightly later, flag that items can animate
      setTimeout(() => {
        $(".menu").addClass("menu-items-animate");
      }, AnimationConfig.menuItemsClassDelay);
    },
  };
})();

/* -------------------------------------------------- */
/* Text Span Animation (titles)                       */
/* -------------------------------------------------- */
const TextAnimation = () => {
  const isMobile = window.innerWidth <= 768;

  $(".js-span").each(function () {
    const $this = $(this);
    const text = $this.text();
    const words = text.split(" ");
    const visibilityStyle = isMobile ? "visibility: visible;" : "";
    const spannedWords = words
      .map(
        (word) =>
          `<span style="opacity: 0; transform: translateY(15px); display: inline-block; color: var(--color-ink); font-family: var(--mono-font); font-weight: 400; font-size: 1.2rem; text-decoration: none; ${visibilityStyle}">${word}</span>`
      )
      .join(" ");
    $this.html(spannedWords);
  });

  setTimeout(
    () => {
      $(".js-span span").each(function (i) {
        const $this = $(this);

        // For mobile, make sure it's visible immediately
        if (isMobile) {
          $this.css("visibility", "visible");
        }

        // Ensure proper styling before animation
        $this.css({
          color: "var(--color-ink)",
          "font-family": "var(--mono-font)",
          "font-weight": "400",
          "font-size": "1.2rem",
          "text-decoration": "none",
        });

        anime({
          targets: this,
          opacity: [0, 1],
          translateY: [15, 0],
          duration: isMobile ? 400 : 500, // Slightly longer on mobile for smoothness
          delay: isMobile
            ? i * 60 + 120 // More staggered and delayed on mobile
            : i * AnimationConfig.textAnimation.titleWordSpacing +
              AnimationConfig.textAnimation.titleBaseDelay,
          easing: "easeOutQuart",
          complete: () => {
            // Clean up inline styles after animation
            $this.css({
              color: "",
              "font-family": "",
              "font-weight": "",
              "font-size": "",
              "text-decoration": "",
              visibility: "",
            });
          },
        });
      });
    },
    isMobile ? 40 : 50 // Slightly longer delay on mobile for title animations
  ); // Much faster start on mobile
};

/* -------------------------------------------------- */
/* Initialization                                     */
/* -------------------------------------------------- */
$(document).ready(() => {
  TextAnimation();
  PageAnimation.init();

  // Resize handler
  $(window).on("resize", () => {
    const isTabletOrMobile = window.innerWidth <= 1024;
    if (isTabletOrMobile) {
      $(".menu__container").css("width", "100%");
      $(".menu__img").css("width", "0%");
    } else {
      $(".menu__container").css("width", "75%");
      $(".menu__img").css("width", "25%");
    }
  });
});
