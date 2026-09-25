import { useState } from "react";
import { applyTheme, type Theme } from "../lib/theme";

export function ThemeToggle({ floating = false }: { floating?: boolean }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const dark = theme === "dark";
  const label = dark ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <button
      type="button"
      className={`theme-toggle${floating ? " theme-toggle-floating" : ""}`}
      aria-label={label}
      title={label}
      onClick={() => {
        const next = dark ? "light" : "dark";
        applyTheme(next, true);
        setTheme(next);
      }}
    >
      <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        ) : (
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        )}
      </svg>
    </button>
  );
}
