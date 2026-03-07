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
    const featurePanels   = [...document.querySelectorAll(".feature-panel")];
    const featureTitle    = document.getElementById("featureTitle");
    const featureText     = document.getElementById("featureText");
    const progressDots    = [...document.querySelectorAll(".progress-dot")];
    const orbs            = [...document.querySelectorAll(".parallax-orb")];
    const floatObjects    = [...document.querySelectorAll(".float-object")];
    const featuresImageFixed = document.getElementById("featuresImageFixed");
    const featuresImageCard  = document.getElementById("featuresImageCard");
    const featuresImageEl    = document.getElementById("featuresImageEl");

    let currentFeatureIndex = -1;
    let textSwapTimeout;
    let imgSwapTimeout;

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
      const newImg   = activePanel.dataset.img   || "";
      const newAlt   = activePanel.dataset.alt   || "";
      const bg       = activePanel.dataset.bg    || "bg-1";

      // ── Text swap ──────────────────────────────────────────────────────
      featureTitle.classList.add("is-changing");
      featureText.classList.add("is-changing");
      clearTimeout(textSwapTimeout);
      textSwapTimeout = setTimeout(() => {
        featureTitle.textContent = newTitle;
        featureText.textContent  = newText;
        featureTitle.classList.remove("is-changing");
        featureText.classList.remove("is-changing");
      }, 260);

      // ── Image swap — identical timing to text ─────────────────────────
      if (featuresImageCard && featuresImageEl && newImg) {
        featuresImageCard.classList.add("is-entering");
        clearTimeout(imgSwapTimeout);
        imgSwapTimeout = setTimeout(() => {
          featuresImageEl.src = newImg;
          featuresImageEl.alt = newAlt;
          featuresImageCard.classList.remove("is-entering");
        }, 260);
      }

      // Background stays static — no dynamic bg-1..4 class switching
    }

    const featuresLeftInner = document.querySelector(".features-left-inner");
    const featuresLeft      = document.querySelector(".features-left");
    let isFixed = false;

    // Set the section height: exactly N panels × 1vh.
    // Only applies on desktop (> 1024px) — mobile uses CSS auto height.
    function setSectionHeight() {
      if (!parallaxSection || !featurePanels.length) return;
      if (window.innerWidth <= 1024) {
        parallaxSection.style.height = "";
        return;
      }
      const vh = window.innerHeight;
      // N panels of scroll + a small exit buffer (0.4vh) so fixed fades before next section
      const totalH = featurePanels.length * vh + Math.round(vh * 0.4);
      parallaxSection.style.height = totalH + "px";
    }
    setSectionHeight();
    window.addEventListener("resize", setSectionHeight);

    function positionFixed(el, refLeft, refWidth, topPx) {
      el.style.position = "fixed";
      el.style.left     = refLeft + "px";
      el.style.width    = refWidth + "px";
      el.style.top      = topPx + "px";
    }

    function releaseFixed() {
      featuresLeftInner.style.cssText = "";
      if (featuresImageFixed) featuresImageFixed.style.cssText = "";
      isFixed = false;
    }

    function updateParallaxFeatures() {
      if (!parallaxSection || !featurePanels.length) return;

      // Mobile: CSS handles layout statically
      if (window.innerWidth <= 1024) {
        if (isFixed) releaseFixed();
        return;
      }

      const vpH     = window.innerHeight;
      const secRect = parallaxSection.getBoundingClientRect();

      // ── Metrics ────────────────────────────────────────────────────────
      const textH    = featuresLeftInner.offsetHeight;
      const leftRect = featuresLeft.getBoundingClientRect();
      const textTop  = (vpH - textH) / 2;

      const containerEl   = parallaxSection.querySelector(".container");
      const cRect         = containerEl ? containerEl.getBoundingClientRect() : { left: 0, right: window.innerWidth };
      const midX          = cRect.left + (cRect.right - cRect.left) / 2;
      const rightX        = midX + 40;
      const rightW        = cRect.right - rightX;
      const imgH          = featuresImageCard ? featuresImageCard.offsetHeight : vpH * 0.55;
      const imgTop        = (vpH - imgH) / 2;

      // ── Thresholds ─────────────────────────────────────────────────────
      // Enter fixed when section top scrolls past the vertically-centered text position
      const enterFixed = secRect.top <= textTop;
      // Exit: start fading when section bottom is at 65% viewport height —
      // well before the next section's solid background overlaps
      const exitThreshold = vpH * 0.65;
      const exitFixed     = secRect.bottom < exitThreshold;

      if (enterFixed && !exitFixed) {
        if (!isFixed) {
          // When re-entering (scroll back up), the elements are either:
          //   a) still in document flow (first entry) - grab current top
          //   b) just released from fixed - snap directly to textTop/imgTop
          // We detect case (b) by checking if position is already 'static'
          const isInDocFlow = featuresLeftInner.style.position !== "fixed";
          const curTop = isInDocFlow
            ? featuresLeftInner.getBoundingClientRect().top
            : textTop; // snap directly on re-entry

          positionFixed(featuresLeftInner, leftRect.left, leftRect.width, curTop);
          featuresLeftInner.style.transform  = "none";
          featuresLeftInner.style.opacity    = "1";
          featuresLeftInner.style.zIndex     = "15";
          // Suppress transition on re-entry snap to avoid rubber-band effect
          featuresLeftInner.style.transition = "opacity 0.3s ease";

          if (featuresImageFixed) {
            const curImgTop = isInDocFlow
              ? (featuresImageCard ? featuresImageCard.getBoundingClientRect().top : imgTop)
              : imgTop;
            featuresImageFixed.style.display  = "flex";
            positionFixed(featuresImageFixed, rightX, rightW, curImgTop);
            featuresImageFixed.style.opacity  = "1";
            featuresImageFixed.style.zIndex   = "15";
            featuresImageFixed.style.transition = "opacity 0.3s ease";
          }
          isFixed = true;

          // After paint: animate to centered position
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              featuresLeftInner.style.transition = "top 0.45s cubic-bezier(.4,0,.2,1), opacity 0.3s ease";
              featuresLeftInner.style.top = textTop + "px";
              if (featuresImageFixed) {
                featuresImageFixed.style.transition = "top 0.45s cubic-bezier(.4,0,.2,1), opacity 0.3s ease";
                featuresImageFixed.style.top = imgTop + "px";
              }
            });
          });
        } else {
          // Keep horizontal position in sync on resize
          featuresLeftInner.style.left  = leftRect.left + "px";
          if (featuresImageFixed) {
            featuresImageFixed.style.left  = rightX + "px";
            featuresImageFixed.style.width = rightW + "px";
          }
        }
        featuresLeftInner.style.opacity = "1";
        if (featuresImageFixed) featuresImageFixed.style.opacity = "1";

      } else if (exitFixed && isFixed) {
        // Fade out over a 0.4vh window so it disappears cleanly before next section
        const fadeProgress = Math.min((exitThreshold - secRect.bottom) / (vpH * 0.3), 1);
        const alpha        = Math.max(1 - fadeProgress, 0);
        featuresLeftInner.style.opacity = alpha;
        // Keep z-index low (behind sections z-index:30) immediately
        featuresLeftInner.style.zIndex  = "5";
        if (featuresImageFixed) {
          featuresImageFixed.style.opacity = alpha;
          featuresImageFixed.style.zIndex  = "5";
        }
        if (alpha <= 0) releaseFixed();

      } else if (!enterFixed) {
        if (isFixed) releaseFixed();
      }

      // ── Active panel: map scroll progress → panel index ───────────────
      // secRect.top goes from 0 (section at viewport top) to negative as we scroll.
      // We skip the first ~10vh (CSS padding) before counting panels.
      const ENTRY_BIAS = vpH * 0.10; // matches the 10vh padding-top on .features-layout
      const scrolled   = -secRect.top - ENTRY_BIAS;
      // Distribute scroll evenly: each panel owns (totalH - ENTRY_BIAS*2) / N pixels
      const scrollPerPanel = vpH; // one full viewport per panel
      const rawIndex  = scrolled / scrollPerPanel;
      // Add 0.15 so the FIRST panel doesn't linger: it starts activating right away
      // but transitions to panel 2 at the normal interval
      const panelIndex = Math.max(0, Math.min(
        Math.floor(rawIndex + 0.08),
        featurePanels.length - 1
      ));
      setActiveFeature(panelIndex);

      const totalScroll = Math.max(parallaxSection.offsetHeight - vpH, 1);
      const sectionProgress = Math.min(Math.max(-secRect.top / totalScroll, 0), 1);
      orbs.forEach((orb, i) => {
        orb.style.transform = `translate3d(0, ${sectionProgress * (i + 1) * 18}px, 0)`;
      });
    }

    function updateFloatingObjects() {
      const viewportH = window.innerHeight;
      floatObjects.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = (center - viewportH / 2) / viewportH;
        el.style.transform = `translate3d(0, ${distance * -40}px, 0) rotate(${distance * 8}deg)`;
        el.style.opacity   = `${1 - Math.min(Math.abs(distance) * 1.2, 0.55)}`;
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

      // Spline: no drift, stays fixed in place
      if (splineBg) {
        splineBg.style.transform = "none";
      }

      // content-inner: scale down + fade + rise as user scrolls
      if (contentInner) {
        // start at 15% scroll progress, fully gone at 65%
        const t = Math.min(Math.max((progress - 0.28) / 0.42, 0), 1);
        const scale = 1 - t * 0.08;
        const opacity = 1 - t;
        const translateY = t * -36;
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
    addTiltEffect(".features-image-card");

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
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        // Features link: scroll to first image panel, not section top
        if (link.dataset.scrollOffset) {
          e.preventDefault();
          closeMenu();
          const target = document.getElementById("features-parallax");
          if (target) {
            // On mobile, just scroll to section. On desktop, scroll so first panel is centered.
            const topbarH = 72;
            const offset = window.innerWidth > 1024
              ? target.getBoundingClientRect().top + window.scrollY - topbarH
              : target.getBoundingClientRect().top + window.scrollY - topbarH;
            window.scrollTo({ top: offset, behavior: "smooth" });
          }
        } else {
          closeMenu();
        }
      });
    });

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