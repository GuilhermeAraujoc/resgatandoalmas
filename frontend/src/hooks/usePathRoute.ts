import { useCallback, useEffect, useState } from "react";
import type { Route } from "../types";
const routes: Route[] = [
  "home",
  "login",
  "signup",
  "welcome",
  "assessment",
  "analysis",
  "result",
  "protocol",
  "exercises",
  "exercise",
  "feedback",
  "feedback-result",
  "progress",
  "profile",
  "contact",
  "design",
  "admin",
];
function readRoute(): Route {
  const legacy = window.location.hash.slice(1);
  if (window.location.pathname === "/" && routes.includes(legacy as Route)) return legacy as Route;
  const path = window.location.pathname.replace(/^\/|\/$/g, "");
  return routes.includes(path as Route) ? (path as Route) : "home";
}
export function usePathRoute() {
  const [route, setRoute] = useState<Route>(readRoute);
  const navigate = useCallback((next: Route) => {
    const path = `/${next}`;
    if (window.location.pathname !== path || window.location.hash) {
      window.history.pushState(null, "", path);
    }
    setRoute(next);
  }, []);

  useEffect(() => {
    // Keep old bookmarked hash links working while showing the new URL format.
    const legacy = window.location.hash.slice(1);
    if (window.location.pathname === "/" && routes.includes(legacy as Route)) {
      window.history.replaceState(null, "", `/${legacy}${window.location.search}`);
    }
    const sync = () => setRoute(readRoute());
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
          event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link || link.hasAttribute("download") ||
          (link.target && link.target !== "_self")) return;
      const url = new URL(link.href, window.location.href);
      const next = url.pathname.replace(/^\/|\/$/g, "") || "home";
      if (url.origin !== window.location.origin || url.hash || url.search ||
          !routes.includes(next as Route)) return;
      event.preventDefault();
      navigate(next as Route);
    };
    window.addEventListener("popstate", sync);
    document.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("popstate", sync);
      document.removeEventListener("click", onClick);
    };
  }, [navigate]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  return { route, navigate };
}
