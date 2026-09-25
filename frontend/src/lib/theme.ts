export type Theme = "light" | "dark";
const storageKey = "resgatando-almas-theme";

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // The theme still works when browser storage is unavailable.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  if (persist) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch {
      // Keep the selected theme for this visit even if saving is blocked.
    }
  }
}
