"use strict";


function enablePortalMotion() {
  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  const revealTargets =
    document.querySelectorAll(
      [
        ".hero-copy",
        ".hero-visual",
        ".feature-strip article",
        ".section-grid > *",
        ".roadmap-heading",
        ".roadmap-live-toolbar",
        ".roadmap-load-status",
        ".next-release",
        "footer"
      ].join(",")
    );

  if (reduceMotion) {
    revealTargets.forEach(
      (target) => {
        target.classList.add(
          "reveal-visible"
        );
      }
    );
  }
  else {
    const observer =
      new IntersectionObserver(
        (entries) => {
          entries.forEach(
            (entry) => {
              if (!entry.isIntersecting) {
                return;
              }

              entry.target.classList.add(
                "reveal-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          );
        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -28px 0px"
        }
      );

    revealTargets.forEach(
      (target, index) => {
        target.classList.add(
          "reveal-ready"
        );

        target.style.setProperty(
          "--reveal-delay",
          `${Math.min(
            index * 35,
            210
          )}ms`
        );

        observer.observe(
          target
        );
      }
    );
  }

  const finePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  if (
    reduceMotion ||
    !finePointer
  ) {
    return;
  }

  document
    .querySelectorAll(
      ".release-card, .next-release, .feature-strip article"
    )
    .forEach(
      (target) => {
        let rect = null;
        let frame = 0;
        let pointerX = 0;
        let pointerY = 0;

        const refreshRect = () => {
          rect =
            target.getBoundingClientRect();
        };

        const paintPointer = () => {
          frame = 0;

          if (!rect) {
            refreshRect();
          }

          target.style.setProperty(
            "--pointer-x",
            `${pointerX - rect.left}px`
          );

          target.style.setProperty(
            "--pointer-y",
            `${pointerY - rect.top}px`
          );

          target.classList.add(
            "pointer-active"
          );
        };

        target.addEventListener(
          "pointerenter",
          refreshRect
        );

        target.addEventListener(
          "pointermove",
          (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;

            if (!frame) {
              frame =
                requestAnimationFrame(
                  paintPointer
                );
            }
          },
          {
            passive: true
          }
        );

        target.addEventListener(
          "pointerleave",
          () => {
            if (frame) {
              cancelAnimationFrame(
                frame
              );
              frame = 0;
            }

            rect = null;

            target.classList.remove(
              "pointer-active"
            );
          }
        );

        window.addEventListener(
          "resize",
          () => {
            rect = null;
          },
          {
            passive: true
          }
        );
      }
    );
}


function installScrollProgress() {
  if (
    document.querySelector(
      ".scroll-progress"
    )
  ) {
    return;
  }

  const progress =
    document.createElement(
      "div"
    );

  progress.className =
    "scroll-progress";

  progress.setAttribute(
    "aria-hidden",
    "true"
  );

  document.body.append(
    progress
  );

  let frame = 0;

  const update = () => {
    frame = 0;

    const maxScroll =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const ratio =
      maxScroll > 0
        ? Math.min(
            1,
            Math.max(
              0,
              window.scrollY /
              maxScroll
            )
          )
        : 0;

    progress.style.transform =
      `scaleX(${ratio})`;
  };

  const scheduleUpdate = () => {
    if (!frame) {
      frame =
        requestAnimationFrame(
          update
        );
    }
  };

  update();

  window.addEventListener(
    "scroll",
    scheduleUpdate,
    {
      passive: true
    }
  );

  window.addEventListener(
    "resize",
    scheduleUpdate,
    {
      passive: true
    }
  );
}


function installRippleFeedback() {
  const finePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (
    !finePointer ||
    reduceMotion ||
    document.body.dataset.rippleReady ===
    "true"
  ) {
    return;
  }

  document.body.dataset.rippleReady =
    "true";

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target =
        event.target.closest(
          [
            ".btn",
            ".site-nav a",
            ".roadmap-filter",
            ".roadmap-detail-close",
            ".text-link",
            "footer a"
          ].join(",")
        );

      if (!target) {
        return;
      }

      const rect =
        target.getBoundingClientRect();

      const size =
        Math.max(
          rect.width,
          rect.height
        ) * 1.7;

      const ripple =
        document.createElement(
          "span"
        );

      ripple.className =
        "ui-ripple";

      ripple.style.width =
        `${size}px`;

      ripple.style.height =
        `${size}px`;

      ripple.style.left =
        `${event.clientX -
        rect.left -
        size / 2}px`;

      ripple.style.top =
        `${event.clientY -
        rect.top -
        size / 2}px`;

      target.append(ripple);

      window.setTimeout(
        () => {
          ripple.remove();
        },
        620
      );
    }
  );
}


function installHeroParallax() {
  const hero =
    document.querySelector(
      ".hero"
    );

  const visual =
    document.querySelector(
      ".hero-visual"
    );

  const finePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  if (
    !hero ||
    !visual ||
    !finePointer ||
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  ) {
    return;
  }

  let rect = null;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const refreshRect = () => {
    rect =
      hero.getBoundingClientRect();
  };

  const reset = () => {
    visual.style.setProperty(
      "--parallax-logo-x",
      "0px"
    );

    visual.style.setProperty(
      "--parallax-logo-y",
      "0px"
    );

    visual.style.setProperty(
      "--parallax-orbit-x",
      "0px"
    );

    visual.style.setProperty(
      "--parallax-orbit-y",
      "0px"
    );

    visual.style.setProperty(
      "--parallax-satellite-x",
      "0px"
    );

    visual.style.setProperty(
      "--parallax-satellite-y",
      "0px"
    );
  };

  const paintParallax = () => {
    frame = 0;

    if (!rect) {
      refreshRect();
    }

    const x =
      (
        pointerX -
        rect.left
      ) /
      rect.width -
      .5;

    const y =
      (
        pointerY -
        rect.top
      ) /
      rect.height -
      .5;

    visual.style.setProperty(
      "--parallax-logo-x",
      `${x * 16}px`
    );

    visual.style.setProperty(
      "--parallax-logo-y",
      `${y * 12}px`
    );

    visual.style.setProperty(
      "--parallax-orbit-x",
      `${x * -9}px`
    );

    visual.style.setProperty(
      "--parallax-orbit-y",
      `${y * -7}px`
    );

    visual.style.setProperty(
      "--parallax-satellite-x",
      `${x * 22}px`
    );

    visual.style.setProperty(
      "--parallax-satellite-y",
      `${y * 16}px`
    );
  };

  hero.addEventListener(
    "pointerenter",
    refreshRect
  );

  hero.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!frame) {
        frame =
          requestAnimationFrame(
            paintParallax
          );
      }
    },
    {
      passive: true
    }
  );

  hero.addEventListener(
    "pointerleave",
    () => {
      if (frame) {
        cancelAnimationFrame(
          frame
        );
        frame = 0;
      }

      rect = null;
      reset();
    }
  );

  window.addEventListener(
    "resize",
    () => {
      rect = null;
    },
    {
      passive: true
    }
  );

  reset();
}


function prepareRoadmapCardMotion(
  button,
  index
) {
  if (
    button.dataset.motionReady ===
    "true"
  ) {
    return;
  }

  button.dataset.motionReady =
    "true";

  button.style.setProperty(
    "--roadmap-index",
    String(index)
  );

  button.classList.add(
    "roadmap-enter"
  );

  const finePointer =
    window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;

  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

  if (
    !finePointer ||
    reduceMotion
  ) {
    return;
  }

  let rect = null;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  const refreshRect = () => {
    rect =
      button.getBoundingClientRect();
  };

  const paintPointer = () => {
    frame = 0;

    if (!rect) {
      refreshRect();
    }

    button.style.setProperty(
      "--roadmap-pointer-x",
      `${pointerX - rect.left}px`
    );

    button.style.setProperty(
      "--roadmap-pointer-y",
      `${pointerY - rect.top}px`
    );

    button.classList.add(
      "roadmap-pointer-active"
    );
  };

  button.addEventListener(
    "pointerenter",
    refreshRect
  );

  button.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!frame) {
        frame =
          requestAnimationFrame(
            paintPointer
          );
      }
    },
    {
      passive: true
    }
  );

  button.addEventListener(
    "pointerleave",
    () => {
      if (frame) {
        cancelAnimationFrame(
          frame
        );
        frame = 0;
      }

      rect = null;

      button.classList.remove(
        "roadmap-pointer-active"
      );
    }
  );

  window.addEventListener(
    "resize",
    () => {
      rect = null;
    },
    {
      passive: true
    }
  );
}


function refreshRoadmapMotion() {
  document
    .querySelectorAll(
      ".roadmap-live-card"
    )
    .forEach(
      (button, index) => {
        prepareRoadmapCardMotion(
          button,
          index
        );
      }
    );

  const detail =
    document.querySelector(
      "#roadmapDetail"
    );

  if (
    detail &&
    !detail.hidden &&
    detail.children.length
  ) {
    detail.classList.remove(
      "roadmap-detail-enter"
    );

    requestAnimationFrame(
      () => {
        detail.classList.add(
          "roadmap-detail-enter"
        );
      }
    );
  }
}


function installRoadmapMotionObserver() {
  const grid =
    document.querySelector(
      "#roadmapGrid"
    );

  const detail =
    document.querySelector(
      "#roadmapDetail"
    );

  const targets =
    [grid, detail]
      .filter(Boolean);

  if (!targets.length) {
    return;
  }

  const observer =
    new MutationObserver(
      () => {
        refreshRoadmapMotion();
      }
    );

  targets.forEach(
    (target) => {
      observer.observe(
        target,
        {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: [
            "hidden"
          ]
        }
      );
    }
  );

  refreshRoadmapMotion();
}


function installMotionLayer() {
  enablePortalMotion();
  installScrollProgress();
  installRippleFeedback();
  installHeroParallax();
  installRoadmapMotionObserver();
}


if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    installMotionLayer,
    {
      once: true
    }
  );
}
else {
  installMotionLayer();
}
