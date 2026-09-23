import { useEffect, useState } from "react";
export function useCountdown(initialSeconds: number) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running || remaining <= 0) return;
    const timeout = setTimeout(
      () => setRemaining((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearTimeout(timeout);
  }, [running, remaining]);
  const label = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
  return {
    remaining,
    running: running && remaining > 0,
    label,
    toggle: () => setRunning((value) => !value),
  };
}
