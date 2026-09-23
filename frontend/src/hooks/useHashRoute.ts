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
];
function readRoute(): Route {
  const hash = window.location.hash.slice(1);
  return routes.includes(hash as Route) ? (hash as Route) : "home";
}
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  const navigate = useCallback((next: Route) => {
    window.location.hash = next;
    setRoute(next);
  }, []);
  return { route, navigate };
}
