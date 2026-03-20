(function () {
  const STORAGE_KEY = "superpop_theme_mode";
  const PREFERS_DARK_MEDIA = "(prefers-color-scheme: dark)";

  function createButton() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle-btn";
    btn.setAttribute("aria-pressed", "false");
    btn.innerHTML = '<span class="theme-toggle-btn-icon material-symbols-outlined" aria-hidden="true">dark_mode</span>' +
      '<span class="theme-toggle-btn-label">Tema claro</span>';
    return btn;
  }

  function getStoredMode() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "dark" || stored === "light" ? stored : null;
    } catch (_err) {
      return null;
    }
  }

  function applyMode(button, mode, { persist = false } = {}) {
    const normalized = mode === "dark" ? "dark" : "light";
    const label = normalized === "dark" ? "Tema escuro" : "Tema claro";
    const iconName = normalized === "dark" ? "key" : "key_off";
    const root = document.documentElement;
    root.classList.toggle("dark", normalized === "dark");
    root.setAttribute("data-theme", normalized);
    root.style.colorScheme = normalized === "dark" ? "dark" : "light";
    document.body.classList.toggle("dark", normalized === "dark");
    button.dataset.theme = normalized;
    button.setAttribute("aria-pressed", normalized === "dark" ? "true" : "false");
    button.setAttribute("aria-label", label);
    const icon = button.querySelector(".theme-toggle-btn-icon");
    const labelEl = button.querySelector(".theme-toggle-btn-label");
    if (icon) {
      icon.textContent = iconName;
    }
    if (labelEl) {
      labelEl.textContent = label;
    }
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, normalized);
      } catch (_err) {}
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const topActions = document.getElementById("authTopActions");
    if (!topActions) return;
    const userMenu = document.getElementById("authUserMenu");
    const button = createButton();
    if (userMenu) {
      topActions.insertBefore(button, userMenu);
    } else {
      topActions.appendChild(button);
    }

    const storedMode = getStoredMode();
    const prefersDark = window.matchMedia && window.matchMedia(PREFERS_DARK_MEDIA).matches;
    const initialMode = storedMode || (prefersDark ? "dark" : "light");
    applyMode(button, initialMode);

    button.addEventListener("click", function () {
      const nextMode = button.dataset.theme === "dark" ? "light" : "dark";
      applyMode(button, nextMode, { persist: true });
    });

    if (window.matchMedia) {
      const media = window.matchMedia(PREFERS_DARK_MEDIA);
      const syncWithSystem = function (event) {
        if (getStoredMode()) return;
        applyMode(button, event.matches ? "dark" : "light");
      };
      if (typeof media.addEventListener === "function") {
        media.addEventListener("change", syncWithSystem);
      } else if (typeof media.addListener === "function") {
        media.addListener(syncWithSystem);
      }
    }
  });
})();
