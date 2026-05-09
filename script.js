/* ============================================================
   Cinematic Anniversary — interactions v3
   ============================================================ */

/* ── Query selectors ──────────────────────────────────────── */
const body                   = document.body;
const loadingScreen          = document.getElementById("loading-screen");
const loaderBeginBtn         = document.getElementById("loader-begin");
const scrollProgress         = document.getElementById("scroll-progress");
const cursorGlow             = document.getElementById("cursor-glow");
const ambientLights          = document.getElementById("ambient-lights");
const floatingParticles      = document.getElementById("floating-particles");
const confettiContainer      = document.getElementById("confetti-container");
const sections               = document.querySelectorAll(".section");
const galleryItems           = document.querySelectorAll(".gallery-item");
const tiltCards              = document.querySelectorAll(".tilt-card");
const lightbox               = document.getElementById("lightbox");
const lightboxImage          = document.getElementById("lightbox-image");
const lightboxCaption        = document.getElementById("lightbox-caption");
const lightboxClose          = document.getElementById("lightbox-close");
const bgMusic                = document.getElementById("bg-music");
const musicToggle            = document.getElementById("music-toggle");
const heartIcon              = document.getElementById("heart-easter-egg");
const easterEggMessage       = document.getElementById("easter-egg-message");
const heartParticlesEl       = document.querySelector(".heart-particles");
const starFieldEl            = document.querySelector(".star-field");
const sectionNavLinks        = document.querySelectorAll("#section-nav a");
const heroBg                 = document.querySelector(".hero-bg");
const statNumbers            = document.querySelectorAll(".stat-number[data-target]");
const replayBtn              = document.getElementById("replay-btn");

/* ── Capability flags ─────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarse             = window.matchMedia("(pointer: coarse)").matches;

let musicUnlocked = false;
let eggTimeout;

/* ============================================================
   LOADING SCREEN
   Shows "Begin the Story" button after 1.4s; hiding on click.
   ============================================================ */
window.addEventListener("load", () => {
  /* Show the Begin button after loader animation plays */
  const beginBtn = document.getElementById("loader-begin");
  if (beginBtn) {
    beginBtn.style.opacity = "0";
    setTimeout(() => {
      beginBtn.style.transition = "opacity 0.6s ease";
      beginBtn.style.opacity = "1";
    }, 1400);
  }
});

function dismissLoader() {
  loadingScreen.classList.add("hidden");
  /* Attempt ambient music on first real interaction */
  unlockMusic();
}

if (loaderBeginBtn) {
  loaderBeginBtn.addEventListener("click", dismissLoader);
}
/* Fallback: auto-dismiss after 5s if button not clicked */
setTimeout(() => {
  if (!loadingScreen.classList.contains("hidden")) dismissLoader();
}, 5000);

/* ============================================================
   SCROLL PROGRESS + NAV ACTIVE + HERO PARALLAX
   ============================================================ */
function updateOnScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";

  /* Parallax hero background */
  if (heroBg && !prefersReducedMotion) {
    const y = Math.min(window.scrollY * 0.14, 110);
    heroBg.style.transform = `translateY(${y}px)`;
  }

  /* Section nav active state */
  let current = "hero";
  sections.forEach((s) => {
    if (s.getBoundingClientRect().top <= window.innerHeight * 0.42) {
      current = s.id || current;
    }
  });
  sectionNavLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
  });
}
window.addEventListener("scroll", updateOnScroll, { passive: true });
updateOnScroll();

/* ============================================================
   SECTION REVEAL — IntersectionObserver
   ============================================================ */
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("revealed"); }),
  { threshold: 0.14 }
);
sections.forEach((s) => revealObserver.observe(s));

/* ============================================================
   GALLERY ITEM STAGGER REVEAL
   ============================================================ */
const galleryObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("item-visible");
        galleryObserver.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 }
);
galleryItems.forEach((item) => galleryObserver.observe(item));

/* ============================================================
   STAT NUMBER COUNTER ANIMATION
   ============================================================ */
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  if (isNaN(target)) return; /* skip "∞" */
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(easeOutQuart(t) * target).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        statNumbers.forEach(animateCounter);
        statsObserver.disconnect();
      }
    });
  },
  { threshold: 0.4 }
);
const statsStrip = document.getElementById("stats");
if (statsStrip) statsObserver.observe(statsStrip);

/* ============================================================
   SMOOTH CURSOR GLOW (desktop)
   ============================================================ */
if (!isCoarse && !prefersReducedMotion) {
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let gx = mx, gy = my;

  window.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });

  (function loop() {
    gx += (mx - gx) * 0.16;
    gy += (my - gy) * 0.16;
    cursorGlow.style.left = `${gx}px`;
    cursorGlow.style.top  = `${gy}px`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll("a, button, .gallery-item, .timeline-card").forEach((el) => {
    el.addEventListener("mouseenter", () => { cursorGlow.style.width = cursorGlow.style.height = "320px"; });
    el.addEventListener("mouseleave", () => { cursorGlow.style.width = cursorGlow.style.height = "240px"; });
  });
} else {
  cursorGlow.style.display = "none";
}

/* ============================================================
   AMBIENT LIGHTS + PARTICLES
   ============================================================ */
(function spawnAmbientLights() {
  if (prefersReducedMotion) return;
  const palette = [
    "hsla(332,90%,68%,0.46)",
    "hsla(36,78%,68%,0.40)",
    "hsla(282,72%,68%,0.34)",
    "hsla(198,80%,72%,0.30)",
  ];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 10; i++) {
    const el = document.createElement("span");
    el.className = "light-orb";
    const s = 130 + Math.random() * 280;
    Object.assign(el.style, {
      width: `${s}px`, height: `${s}px`,
      left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
      background: palette[i % palette.length],
    });
    el.style.setProperty("--duration", `${15 + Math.random() * 22}s`);
    el.style.animationDelay = `-${Math.random() * 12}s`;
    frag.appendChild(el);
  }
  ambientLights.appendChild(frag);
})();

(function spawnParticles() {
  if (prefersReducedMotion) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 42; i++) {
    const el = document.createElement("span");
    el.className = "particle";
    Object.assign(el.style, {
      left: `${Math.random() * 100}%`,
      bottom: `${-5 - Math.random() * 70}px`,
      opacity: `${0.22 + Math.random() * 0.55}`,
      transform: `scale(${0.55 + Math.random() * 1.3})`,
    });
    el.style.setProperty("--duration", `${9 + Math.random() * 14}s`);
    el.style.animationDelay = `${Math.random() * 12}s`;
    frag.appendChild(el);
  }
  floatingParticles.appendChild(frag);
})();

/* ============================================================
   3D TILT — gallery cards
   ============================================================ */
tiltCards.forEach((card) => {
  let raf = null;
  card.addEventListener("mousemove", (e) => {
    if (isCoarse || prefersReducedMotion || raf) return;
    raf = requestAnimationFrame(() => {
      const r = card.getBoundingClientRect();
      const rx = -(((e.clientY - r.top)  / r.height) - 0.5) * 9;
      const ry =  (((e.clientX - r.left) / r.width)  - 0.5) * 9;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-5px)`;
      raf = null;
    });
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
  });
});

/* ============================================================
   LIGHTBOX
   ============================================================ */
galleryItems.forEach((item) => {
  item.addEventListener("click", () => {
    lightboxImage.src = item.dataset.image;
    lightboxCaption.textContent = item.querySelector(".caption")?.textContent || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
  });
});
function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  body.style.overflow = "";
}
lightboxClose.addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });

/* ============================================================
   FINALE: floating hearts + star field + confetti burst
   ============================================================ */
(function spawnHeartParticles() {
  if (!heartParticlesEl || prefersReducedMotion) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 24; i++) {
    const el = document.createElement("span");
    el.textContent = "❤";
    Object.assign(el.style, {
      left: `${4 + Math.random() * 92}%`,
      bottom: `${Math.random() * 20}%`,
      animationDelay: `${Math.random() * 5.5}s`,
      color: Math.random() > 0.5 ? "#f0507a" : "#ffd4ef",
      fontSize: `${0.65 + Math.random() * 1.1}rem`,
      textShadow: "0 0 12px rgba(240,80,122,0.7)",
    });
    frag.appendChild(el);
  }
  heartParticlesEl.appendChild(frag);
})();

(function spawnStarField() {
  if (!starFieldEl || prefersReducedMotion) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("span");
    el.className = "star-dot";
    const sz = 1 + Math.random() * 2.5;
    Object.assign(el.style, {
      width: `${sz}px`, height: `${sz}px`,
      left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
    });
    el.style.setProperty("--d",  `${2 + Math.random() * 4}s`);
    el.style.setProperty("--dd", `${Math.random() * 4}s`);
    frag.appendChild(el);
  }
  starFieldEl.appendChild(frag);
})();

function launchConfetti() {
  if (prefersReducedMotion) return;
  const colors = ["#f0507a","#d4a574","#ffb3d4","#8be9fd","#f5d6a8","#c9924a"];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 80; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    Object.assign(el.style, {
      left: `${Math.random() * 100}%`,
      top: "-8px",
      background: colors[Math.floor(Math.random() * colors.length)],
      width:  `${6 + Math.random() * 8}px`,
      height: `${6 + Math.random() * 8}px`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    });
    el.style.setProperty("--dur",   `${2 + Math.random() * 2.5}s`);
    el.style.setProperty("--delay", `${Math.random() * 1.5}s`);
    frag.appendChild(el);
  }
  confettiContainer.appendChild(frag);
  setTimeout(() => confettiContainer.replaceChildren(), 6000);
}

/* Trigger confetti when finale enters view */
const finaleSection = document.getElementById("finale");
if (finaleSection) {
  const finaleObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        launchConfetti();
        finaleObserver.disconnect();
      }
    },
    { threshold: 0.3 }
  );
  finaleObserver.observe(finaleSection);
}

/* Replay button */
if (replayBtn) {
  replayBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => launchConfetti(), 600);
  });
}

/* ============================================================
   EASTER EGG
   ============================================================ */
heartIcon.addEventListener("click", () => {
  easterEggMessage.classList.add("visible");
  clearTimeout(eggTimeout);
  eggTimeout = setTimeout(() => easterEggMessage.classList.remove("visible"), 3600);
});

/* ============================================================
   BACKGROUND MUSIC
   ============================================================ */
function setMusicUI(playing) {
  musicToggle.classList.toggle("playing", playing);
  musicToggle.setAttribute("aria-label", playing ? "Pause music" : "Play music");
}

function unlockMusic() {
  if (musicUnlocked) return;
  musicUnlocked = true;
  bgMusic.play().then(() => setMusicUI(true)).catch(() => setMusicUI(false));
}

/* First interaction auto-starts music */
["click","touchstart","keydown"].forEach((ev) => {
  window.addEventListener(ev, unlockMusic, { once: true, passive: true });
});

musicToggle.addEventListener("click", () => {
  if (bgMusic.paused) {
    bgMusic.play().then(() => setMusicUI(true)).catch(() => setMusicUI(false));
  } else {
    bgMusic.pause();
    setMusicUI(false);
  }
});

/* ============================================================
   DYNAMIC CINEMATIC LIGHTING (mouse-reactive, rAF throttled)
   ============================================================ */
let lightRaf = null;
window.addEventListener("mousemove", (e) => {
  if (isCoarse || prefersReducedMotion || lightRaf) return;
  lightRaf = requestAnimationFrame(() => {
    const xp = (e.clientX / window.innerWidth)  * 100;
    const yp = (e.clientY / window.innerHeight) * 100;
    body.style.backgroundImage = `
      radial-gradient(circle at ${xp}% ${yp}%, rgba(240,80,122,0.17), transparent 40%),
      radial-gradient(circle at 14% 9%,  rgba(240,80,122,0.18) 0%, transparent 40%),
      radial-gradient(circle at 85% 8%,  rgba(125,217,240,0.10) 0%, transparent 34%),
      radial-gradient(circle at 50% 96%, rgba(201,146,74,0.13) 0%, transparent 48%),
      radial-gradient(circle at 30% 60%, rgba(155,89,182,0.09) 0%, transparent 35%),
      linear-gradient(168deg, #06040c 0%, #0d0819 48%, #06040c 100%)
    `;
    lightRaf = null;
  });
});

/* ============================================================
   SMOOTH SECTION NAV CLICK
   ============================================================ */
sectionNavLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ============================================================
   MAGNETIC EFFECT — CTA buttons (subtle pull toward cursor)
   ============================================================ */
document.querySelectorAll(".magnetic").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    if (isCoarse) return;
    const r = btn.getBoundingClientRect();
    const dx = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const dy = ((e.clientY - r.top)  / r.height - 0.5) * 14;
    btn.style.transform = `translate(${dx}px, ${dy}px)`;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
  });
});
