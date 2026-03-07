  document.addEventListener("DOMContentLoaded", () => {
    document.body.classList.add("js-reveal");

    const revealElements = document.querySelectorAll(".reveal");
    const motionElements = document.querySelectorAll(
      ".scroll-fade-up, .scroll-slide-left, .scroll-slide-right, .scroll-zoom"
    );

    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px"
    });

    revealElements.forEach((el) => revealObserver.observe(el));

    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: "0px 0px -60px 0px"
    });

    motionElements.forEach((el) => motionObserver.observe(el));

    const parallaxSection = document.querySelector(".section-parallax-features");
    const featurePanels = [...document.querySelectorAll(".feature-panel")];
    const featureTitle = document.getElementById("featureTitle");
    const featureText = document.getElementById("featureText");
    const progressDots = [...document.querySelectorAll(".progress-dot")];
    const orbs = [...document.querySelectorAll(".parallax-orb")];
    const floatObjects = [...document.querySelectorAll(".float-object")];

    let currentFeatureIndex = -1;
    let textSwapTimeout;

    function setActiveFeature(index) {
      if (!featurePanels.length || !featureTitle || !featureText || !parallaxSection) return;
      if (index === currentFeatureIndex) return;

      currentFeatureIndex = index;

      featurePanels.forEach((panel, i) => {
        panel.classList.toggle("active", i === index);
        panel.classList.toggle("passed", i < index);
      });

      progressDots.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
      });

      const activePanel = featurePanels[index];
      if (!activePanel) return;

      const newTitle = activePanel.dataset.title || "";
      const newText  = activePanel.dataset.text  || "";
      const bg       = activePanel.dataset.bg    || "bg-1";

      // Fade out, swap text, fade back in — smooth 300ms cross-fade
      featureTitle.classList.add("is-changing");
      featureText.classList.add("is-changing");

      clearTimeout(textSwapTimeout);
      textSwapTimeout = setTimeout(() => {
        featureTitle.textContent = newTitle;
        featureText.textContent  = newText;
        featureTitle.classList.remove("is-changing");
        featureText.classList.remove("is-changing");
      }, 280);

      parallaxSection.classList.remove("bg-1", "bg-2", "bg-3", "bg-4");
      parallaxSection.classList.add(bg);
    }

    const featuresLeftInner = document.querySelector(".features-left-inner");
    const featuresLeft = document.querySelector(".features-left");

    // Track fixed state to avoid jump on transition
    let isFixed = false;

    function updateParallaxFeatures() {
      if (!parallaxSection || !featurePanels.length) return;

      if (window.innerWidth <= 1024) {
        setActiveFeature(0);
        featurePanels.forEach((panel, i) => {
          panel.classList.toggle("active", i === 0);
          panel.classList.remove("passed");
        });
        if (featuresLeftInner) {
          featuresLeftInner.classList.remove("is-fixed", "is-fading");
          featuresLeftInner.style.cssText = "";
        }
        isFixed = false;
        return;
      }

      const vpH = window.innerHeight;
      const secRect = parallaxSection.getBoundingClientRect();
      const innerH = featuresLeftInner.offsetHeight;
      const leftRect = featuresLeft.getBoundingClientRect();

      // The vertical center where the text block will sit when fixed
      const fixedTop = (vpH - innerH) / 2;

      // Enter fixed: when section top scrolls past where text would sit
      const enterFixed = secRect.top <= fixedTop;
      // Exit fixed: when section bottom is about to go above where text ends
      // Add a generous buffer (innerH * 1.5) so text fades out BEFORE it disappears
      const exitFixed = secRect.bottom < fixedTop + innerH + innerH * 0.2;

      if (enterFixed && !exitFixed) {
        // ── FIXED: text stays centered in viewport ──
        if (!isFixed) {
          // Capture exact current position before switching to fixed, prevents jump
          const currentTop = featuresLeftInner.getBoundingClientRect().top;
          featuresLeftInner.style.position = "fixed";
          featuresLeftInner.style.top = currentTop + "px";
          featuresLeftInner.style.left = leftRect.left + "px";
          featuresLeftInner.style.width = featuresLeft.offsetWidth + "px";
          featuresLeftInner.style.transform = "none";
          featuresLeftInner.style.opacity = "1";
          isFixed = true;
          // Animate to center position smoothly
          requestAnimationFrame(() => {
            featuresLeftInner.style.transition = "top 0.5s cubic-bezier(.4,0,.2,1)";
            featuresLeftInner.style.top = fixedTop + "px";
          });
        } else {
          // Already fixed: keep left in sync (resize safety)
          featuresLeftInner.style.left = leftRect.left + "px";
        }
        featuresLeftInner.style.opacity = "1";
        featuresLeftInner.classList.remove("is-fading");

      } else if (exitFixed && isFixed) {
        // ── FADING OUT: section ending, fade text before it snaps away ──
        // How far past the exit threshold are we? 0 = just entered, 1 = fully past
        const fadeProgress = Math.min((fixedTop + innerH + innerH * 0.2 - secRect.bottom) / (innerH * 0.5), 1);
        featuresLeftInner.style.opacity = Math.max(1 - fadeProgress * 1.4, 0);

      } else if (!enterFixed) {
        // ── BEFORE SECTION: reset to normal flow ──
        if (isFixed) {
          featuresLeftInner.style.cssText = "";
          isFixed = false;
        }
      }

      // ── Active panel: change text when panel CENTER hits fixed text center ──
      // The text block sits at fixedTop (viewport coords), panel center must match
      const textCenterY = fixedTop + innerH / 2;
      let activeIndex = 0;
      let closestDistance = Infinity;

      featurePanels.forEach((panel, i) => {
        const rect = panel.getBoundingClientRect();
        const panelCenter = rect.top + rect.height / 2;
        const distance = Math.abs(panelCenter - textCenterY);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeIndex = i;
        }
      });

      setActiveFeature(activeIndex);

      const totalScroll = Math.max(parallaxSection.offsetHeight - vpH, 1);
      const sectionProgress = Math.min(Math.max(-secRect.top / totalScroll, 0), 1);

      orbs.forEach((orb, i) => {
        const speed = (i + 1) * 22;
        orb.style.transform = `translate3d(0, ${sectionProgress * speed}px, 0)`;
      });
    }

    function updateFloatingObjects() {
      const viewportH = window.innerHeight;

      floatObjects.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = (center - viewportH / 2) / viewportH;
        const y = distance * -40;
        const rotate = distance * 8;

        el.style.transform = `translate3d(0, ${y}px, 0) rotate(${rotate}deg)`;
        el.style.opacity = `${1 - Math.min(Math.abs(distance) * 1.2, 0.55)}`;
      });
    }

    let ticking = false;

    function onScrollEffects() {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateParallaxFeatures();
          updateFloatingObjects();
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScrollEffects, { passive: true });
    window.addEventListener("resize", onScrollEffects);
    onScrollEffects();

    // Hero scroll: spline drifts up, content-inner shrinks + fades
    const splineBg = document.querySelector(".spline-bg");
    const contentInner = document.querySelector(".content-inner");
    const heroEl = document.querySelector(".hero");

    function updateHeroScroll() {
      if (!heroEl) return;
      const heroH = heroEl.offsetHeight;
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / heroH, 1);

      // Spline drifts upward slowly
      if (splineBg) {
        const drift = progress * 140;
        splineBg.style.transform = `translate3d(0, -${drift}px, 0)`;
      }

      // content-inner: scale down + fade + rise as user scrolls
      if (contentInner) {
        // start at 15% scroll progress, fully gone at 65%
        const t = Math.min(Math.max((progress - 0.0) / 0.45, 0), 1);
        const scale = 1 - t * 0.10;
        const opacity = 1 - t;
        const translateY = t * -50;
        contentInner.style.transform = `scale(${scale}) translateY(${translateY}px)`;
        contentInner.style.opacity = opacity;
      }
    }

    window.addEventListener("scroll", updateHeroScroll, { passive: true });
    updateHeroScroll();

    // ── Topbar scroll state ─────────────────────────────────────────────
    const topbar = document.querySelector(".topbar");
    function updateTopbar() {
      topbar.classList.toggle("is-scrolled", window.scrollY > 60);
    }
    window.addEventListener("scroll", updateTopbar, { passive: true });
    updateTopbar();

    // ── Cursor tilt for vehicle cards + feature panels ──────────────────
    function addTiltEffect(selector) {
      document.querySelectorAll(selector).forEach(card => {
        let animFrame;
        card.addEventListener("mousemove", (e) => {
          cancelAnimationFrame(animFrame);
          animFrame = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            // Normalize -0.5 to +0.5 from center of element
            const x = ((e.clientX - rect.left) / rect.width)  - 0.5;
            const y = ((e.clientY - rect.top)  / rect.height) - 0.5;
            const tiltX = y * -9;
            const tiltY = x *  9;
            // perspective() must be first in the transform string
            card.style.transition = "transform 0.12s ease, box-shadow 0.2s ease";
            card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.03,1.03,1.03)`;
          });
        });
        card.addEventListener("mouseleave", () => {
          cancelAnimationFrame(animFrame);
          card.style.transition = "transform 0.55s cubic-bezier(.22,1,.36,1), box-shadow 0.4s ease";
          card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
        });
      });
    }
    addTiltEffect(".vehicle-card");
    addTiltEffect(".feature-panel-media");

    // ── Hamburger menu ──────────────────────────────────────────────────
    const menuBtn   = document.querySelector(".menu-btn");
    const navClose  = document.getElementById("navClose");
    const navOverlay = document.getElementById("navOverlay");
    const navLinks  = document.querySelectorAll(".nav-link");

    function openMenu() {
      navOverlay.classList.add("is-open");
      navOverlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeMenu() {
      navOverlay.classList.remove("is-open");
      navOverlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    menuBtn.addEventListener("click", openMenu);
    navClose.addEventListener("click", closeMenu);
    navLinks.forEach(link => link.addEventListener("click", closeMenu));

    // Close on backdrop click
    navOverlay.addEventListener("click", (e) => {
      if (e.target === navOverlay) closeMenu();
    });

    // Keyboard escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  });

  // ── iOS 26 Liquid Glass: canvas-based displacement maps ─────────────
  // Generates physically-accurate edge refraction using SDF (Signed Distance
  // Function) for rounded rectangles — same math Apple's engine uses.
  // Pixels near the curved edge get outward displacement (R>128, G>128),
  // center stays neutral (R=128, G=128). Result replaces the static SVG maps.
  (function buildLiquidGlassMaps() {

    function roundedRectSDF(px, py, w, h, r) {
      // Distance from point (px,py) to surface of rounded rect centered at origin
      const qx = Math.abs(px) - w * 0.5 + r;
      const qy = Math.abs(py) - h * 0.5 + r;
      return Math.sqrt(Math.max(qx,0)**2 + Math.max(qy,0)**2) +
             Math.min(Math.max(qx, qy), 0) - r;
    }

    function buildMap(canvasId, w, h, rx, ry, edgeBand, strength) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const img = ctx.createImageData(w, h);
      const d   = img.data;
      const cx = w / 2, cy = h / 2;
      const r  = Math.min(rx, ry, Math.min(w, h) * 0.45);

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i  = (y * w + x) * 4;
          // SDF: positive = outside, negative = inside
          const dist = roundedRectSDF(x - cx, y - cy, w, h, r);
          // Edge band: dist in [-edgeBand, 0] near inner edge
          const t = Math.max(0, Math.min(1, (-dist) / edgeBand));
          // Smooth step
          const s = t * t * (3 - 2 * t);
          // Normal vector pointing from edge outward (away from center)
          const nx = (x - cx) / (Math.abs(x - cx) + 0.001);
          const ny = (y - cy) / (Math.abs(y - cy) + 0.001);
          // Encode: 128 = neutral, > 128 = push in that direction
          const rx_ = Math.round(128 + nx * s * strength);
          const ry_ = Math.round(128 + ny * s * strength);
          d[i    ] = Math.max(0, Math.min(255, rx_)); // R → X
          d[i + 1] = Math.max(0, Math.min(255, ry_)); // G → Y
          d[i + 2] = 128;
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      return canvas.toDataURL("image/png");
    }

    // Update feImage href with canvas-generated maps
    function patchFilter(filterId, dataUrl) {
      const filter = document.getElementById(filterId);
      if (!filter) return;
      const feImg = filter.querySelector("feImage");
      if (feImg) feImg.setAttribute("href", dataUrl);
    }

    // Build maps and patch filters
    // Card: 400x400, borderRadius ~28px, edgeBand 48px, strength 60
    const cardCanvas = document.createElement("canvas");
    cardCanvas.id = "_lgCardCanvas";
    document.body.appendChild(cardCanvas);
    const cardUrl = buildMap("_lgCardCanvas", 400, 400, 28, 28, 52, 62);
    if (cardUrl) patchFilter("lg-card-filter", cardUrl);

    // Button: 300x100, borderRadius 50 (pill), edgeBand 28px, strength 44
    const btnCanvas = document.createElement("canvas");
    btnCanvas.id = "_lgBtnCanvas";
    document.body.appendChild(btnCanvas);
    const btnUrl = buildMap("_lgBtnCanvas", 300, 100, 50, 50, 28, 44);
    if (btnUrl) patchFilter("lg-btn-filter", btnUrl);

    // Topbar: 800x60, borderRadius 0, edgeBand 14px, strength 20
    const barCanvas = document.createElement("canvas");
    barCanvas.id = "_lgBarCanvas";
    document.body.appendChild(barCanvas);
    const barUrl = buildMap("_lgBarCanvas", 800, 60, 0, 0, 14, 22);
    if (barUrl) patchFilter("lg-bar-filter", barUrl);

    // Cleanup hidden canvases
    [cardCanvas, btnCanvas, barCanvas].forEach(c => {
      c.style.cssText = "position:absolute;width:0;height:0;pointer-events:none;opacity:0";
    });
  })();