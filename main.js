const root = document.documentElement;
const themeButton = document.querySelector("#theme-button");

if (themeButton) {
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");

  function updateThemeButton() {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : systemTheme.matches;
    themeButton.dataset.dark = String(dark);
    themeButton.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  updateThemeButton();
  themeButton.hidden = false;
  systemTheme.addEventListener("change", updateThemeButton);
  themeButton.addEventListener("click", () => {
    const theme = themeButton.dataset.dark === "true" ? "light" : "dark";
    root.dataset.theme = theme;
    updateThemeButton();
    try {
      localStorage.setItem("adeeba-theme", theme);
    } catch {}
  });
}

const printButton = document.querySelector("#print-button");
if (printButton) {
  printButton.hidden = false;
  printButton.addEventListener("click", () => window.print());
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

const menuButton = document.querySelector("#menu-button");
const navigation = document.querySelector("#navigation");
if (menuButton && navigation) {
  menuButton.hidden = false;
  menuButton.closest(".header-inner").classList.add("has-menu");

  function setMenu(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  }

  menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") === "false"));
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      if (menuButton.getAttribute("aria-expanded") === "true") menuButton.focus();
      setMenu(false);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".header-inner")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenu(false);
      menuButton.focus();
    }
  });
  matchMedia("(max-width: 780px)").addEventListener("change", () => setMenu(false));

  const updateHeader = () => root.classList.toggle("scrolled", scrollY > 26);
  addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();
}

const showcase = document.querySelector(".showcase-inner");
if (showcase) {
  const art = showcase.querySelector(".block-art");
  const topics = [...art.querySelectorAll("[data-topic]")];
  const panels = [...art.querySelectorAll("[data-panel]")];
  const face = art.querySelector(".topic-face");
  const back = face.querySelector(".face-back");
  const index = showcase.querySelector(".block-index");
  const hero = document.querySelector(".hero");
  const chapters = [...document.querySelectorAll("[data-work]")];
  const desktop = matchMedia("(min-width: 781px) and (min-height: 660px)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let scrollChapter = chapters[0];
  let frame = 0;
  let trigger = null;
  let hoverTarget = null;
  let hoverTimer;
  let pinned = false;

  function selectPreview(key) {
    showcase.dataset.preview = key;
    panels.forEach((panel, position) => {
      panel.hidden = panel.dataset.panel !== key;
      if (!panel.hidden) index.textContent = `0${position + 1} / 0${panels.length}`;
    });
    topics.forEach((topic) => {
      const selected = topic.dataset.topic === key;
      topic.toggleAttribute("data-active", selected);
      topic.setAttribute("aria-expanded", String(topic === trigger));
    });
  }

  function revealTopic(topic, pin = false, moveFocus = false) {
    clearTimeout(hoverTimer);
    trigger = topic;
    pinned = pin;
    showcase.classList.remove("cubes-intro");
    showcase.classList.add("is-revealing");
    face.hidden = false;
    selectPreview(topic.dataset.topic);
    if (moveFocus) back.focus({ preventScroll: true });
  }

  function closeTopic(restoreFocus = false) {
    clearTimeout(hoverTimer);
    hoverTarget = null;
    if (!trigger) return;
    const previous = trigger;
    trigger = null;
    pinned = false;
    face.hidden = true;
    showcase.classList.remove("is-revealing");
    previous.setAttribute("aria-expanded", "false");
    if (restoreFocus) previous.focus({ preventScroll: true });
  }

  function syncBlock() {
    frame = 0;
    if (!desktop.matches) {
      showcase.style.removeProperty("--scroll-spread");
      return;
    }

    const heroBounds = hero.getBoundingClientRect();
    const openingDistance = Math.min(420, heroBounds.height * 0.54);
    const spread = Math.max(0, Math.min(1, (-heroBounds.top - 18) / openingDistance));
    const readingLine = innerHeight * 0.54;
    const chapter = chapters.findLast((section) => section.getBoundingClientRect().top <= readingLine) ?? chapters[0];

    if (!reducedMotion.matches) showcase.style.setProperty("--scroll-spread", spread.toFixed(3));
    if (chapter !== scrollChapter) {
      scrollChapter = chapter;
      if (!trigger) selectPreview(chapter.dataset.work);
    }
  }

  function scheduleBlock() {
    if (!frame) frame = requestAnimationFrame(syncBlock);
  }

  topics.forEach((topic) => {
    const panel = panels.find((item) => item.dataset.panel === topic.dataset.topic);
    topic.setAttribute("role", "button");
    topic.setAttribute("tabindex", "0");
    topic.setAttribute("aria-label", panel.querySelector("h3").textContent);
    topic.setAttribute("aria-controls", panel.id);
  });
  selectPreview(showcase.dataset.preview);
  showcase.querySelector(".topic-hint").hidden = false;

  if (!reducedMotion.matches) {
    if ("IntersectionObserver" in window) {
      const intro = new IntersectionObserver(([entry]) => {
        if (entry.intersectionRatio < 0.4) return;
        intro.disconnect();
        if (!trigger && !art.matches(":hover, :focus-within")) showcase.classList.add("cubes-intro");
      }, { threshold: 0.4 });
      intro.observe(art);
    } else {
      showcase.classList.add("cubes-intro");
    }
  }

  art.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse" || pinned) return;
    const topic = event.target.closest("[data-topic]");
    if (topic === hoverTarget) return;
    hoverTarget = topic;
    clearTimeout(hoverTimer);
    if (topic && topic !== trigger) {
      showcase.classList.remove("cubes-intro");
      hoverTimer = setTimeout(() => revealTopic(topic), 320);
    }
  });
  art.addEventListener("pointerleave", () => {
    clearTimeout(hoverTimer);
    hoverTarget = null;
    if (!pinned && !face.contains(document.activeElement)) closeTopic();
  });
  art.addEventListener("click", (event) => {
    const topic = event.target.closest("[data-topic]");
    if (topic) revealTopic(topic, true, event.detail === 0);
    else if (trigger && !event.target.closest("a, button")) pinned = true;
  });
  art.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && trigger) {
      event.preventDefault();
      closeTopic(true);
    }
    const topic = event.target.closest("[data-topic]");
    if (topic && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      revealTopic(topic, true, true);
    }
  });
  back.addEventListener("click", () => closeTopic(true));
  face.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeTopic();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && trigger && !art.contains(document.activeElement)) closeTopic();
  });

  addEventListener("scroll", scheduleBlock, { passive: true });
  addEventListener("resize", scheduleBlock);
  desktop.addEventListener("change", scheduleBlock);
  reducedMotion.addEventListener("change", scheduleBlock);
  syncBlock();
}

const quickNav = document.querySelector("#quick-nav");
const searchButton = document.querySelector("#search-button");
if (quickNav && searchButton && typeof quickNav.showModal === "function") {
  const input = quickNav.querySelector("input");
  const destinations = [...quickNav.querySelectorAll("li")];
  const empty = quickNav.querySelector(".quick-empty");

  function filterDestinations() {
    const query = input.value.trim().toLowerCase();
    destinations.forEach((item) => { item.hidden = !item.textContent.toLowerCase().includes(query); });
    empty.hidden = destinations.some((item) => !item.hidden);
  }

  function openQuickNav() {
    if (quickNav.open) return;
    input.value = "";
    filterDestinations();
    quickNav.showModal();
  }

  if (/Mac|iPhone|iPad/.test(navigator.platform)) searchButton.querySelector("kbd").textContent = "⌘ K";
  searchButton.hidden = false;
  searchButton.addEventListener("click", openQuickNav);
  input.addEventListener("input", filterDestinations);
  input.addEventListener("keydown", (event) => {
    const firstMatch = quickNav.querySelector("li:not([hidden]) a");
    if (!firstMatch) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      firstMatch.focus();
    }
    if (event.key === "Enter") {
      event.preventDefault();
      firstMatch.click();
    }
  });
  quickNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) quickNav.close();
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (quickNav.open) quickNav.close();
      else openQuickNav();
    }
  });
}
