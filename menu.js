      /* -------------------------------------------------- */
      /* Menu Component (JS logic is now responsive)        */
      /* -------------------------------------------------- */
      const Menu = (() => {
        let s;
        let isAnimating = false;

        return {
          settings() {
            return {
              body: $("body"),
              hamburger: $(".hamburger"),
              menu: $(".menu"), // Target the parent for better control
              menuContainer: $(".menu__container"),
              menuImg: $(".menu__img"),
              openClass: "js-menu-open",
              visibleClass: "js-menu-visible",
              overflowClass: "js-overflow",
              isOpen: false,
            };
          },

          init() {
            s = this.settings();
            this.bindEvents();
          },

          bindEvents() {
            s.hamburger.on("click", (e) => {
              e.preventDefault();
              if (!isAnimating) {
                this.toggleMenu();
              }
            });

            s.body.on("keyup", (e) => {
              if (s.isOpen && e.which === 27 && !isAnimating) {
                this.toggleMenu();
              }
            });
          },

          toggleMenu() {
            isAnimating = true;
            s.isOpen = !s.isOpen;
            s.body.toggleClass(s.openClass).toggleClass(s.overflowClass);

            // Determine widths based on viewport.
            // On screens <= 1024px, the nav container takes 100% width.
            const isTabletOrMobile = window.innerWidth <= 1024;
            const containerWidth = isTabletOrMobile ? 100 : 75;
            const imgWidth = isTabletOrMobile ? 0 : 25;

            if (s.isOpen) {
              s.body.addClass(s.visibleClass);
              anime
                .timeline({
                  easing: "easeOutQuart",
                  complete: () => (isAnimating = false),
                })
                .add({
                  targets: s.menuContainer[0],
                  width: [0, `${containerWidth}%`],
                  duration: 600,
                })
                .add(
                  {
                    targets: s.menuImg[0],
                    width: [0, `${imgWidth}%`],
                    duration: 600,
                  },
                  0
                );
            } else {
              anime
                .timeline({
                  easing: "easeInQuart",
                  complete: () => {
                    s.body.removeClass(s.visibleClass);
                    isAnimating = false;
                  },
                })
                .add({
                  targets: s.menuContainer[0],
                  width: [`${containerWidth}%`, 0],
                  duration: 500,
                })
                .add(
                  {
                    targets: s.menuImg[0],
                    width: [`${imgWidth}%`, 0],
                    duration: 500,
                  },
                  0
                );
            }
          },
        };
      })();

      /* -------------------------------------------------- */
      /* Initialization                                     */
      /* -------------------------------------------------- */
      $(document).ready(() => {
        $(".js-span").each(function () {
          const $this = $(this);
          const text = $this.text();
          const words = text.split(" ");
          const spannedWords = words
            .map((word) => `<span>${word}</span>`)
            .join(" ");
          $this.html(spannedWords);
        });
        Menu.init();
      });
